import { NextResponse } from "next/server";
import Groq from "groq-sdk";

interface AnalyzeRequestBody {
  extractedPapers: Array<{ name: string; text: string }>;
  syllabus: string;
  subject: string;
  yearRange: { from: number; to: number };
}

const CANDIDATE_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama3-70b-8192",
];

async function getBestModel(client: Groq): Promise<string> {
  if (process.env.GROQ_MODEL) {
    return process.env.GROQ_MODEL;
  }

  try {
    const modelsList = await client.models.list();
    const available = new Set(modelsList.data.map((m) => m.id));

    for (const candidate of CANDIDATE_MODELS) {
      if (available.has(candidate)) {
        return candidate;
      }
    }

    // Fallback: pick the first available general chat model
    const chatModel = modelsList.data.find(
      (m) =>
        !m.id.includes("whisper") &&
        !m.id.includes("guard") &&
        !m.id.includes("safeguard") &&
        !m.id.includes("orpheus"),
    );

    if (chatModel) {
      return chatModel.id;
    }
  } catch {
    // If listing models fails, default to standard GPT-OSS model
  }

  return "openai/gpt-oss-120b";
}

export async function POST(request: Request) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY?.trim();
    if (!groqApiKey) {
      return NextResponse.json(
        {
          error:
            "Missing GROQ_API_KEY environment variable. Please ensure GROQ_API_KEY is configured in your .env.local and in your deployment settings.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as AnalyzeRequestBody;
    const papersText = body.extractedPapers
      ?.map((paper, index) => `Paper ${index + 1}: ${paper.name}\n${paper.text}`)
      .join("\n\n---\n\n") ?? "";

    const client = new Groq({ apiKey: groqApiKey });
    const model = await getBestModel(client);

    const messages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content:
          "You are DecodeX, an exam strategist. Produce concise, practical insights with prioritized topic focus, revision tactics, and a simple study plan. Return valid JSON only with keys: summary, highPriorityTopics, likelyPatterns, revisionPlan, confidenceNotes.",
      },
      {
        role: "user",
        content: [
          `Subject: ${body.subject || "Not specified"}`,
          `Year range: ${body.yearRange?.from ?? ""} to ${body.yearRange?.to ?? ""}`,
          `Syllabus topics:\n${body.syllabus || "Not provided"}`,
          `Past paper extracts:\n${papersText || "No extracted text."}`,
          "Return a JSON object with keys: summary, highPriorityTopics, likelyPatterns, revisionPlan, and confidenceNotes.",
        ].join("\n\n"),
      },
    ];

    let completion;
    try {
      completion = await client.chat.completions.create({
        model,
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages,
      });
    } catch (apiError: unknown) {
      // If primary model failed with 404 or model not found, retry with backup
      const isModelError =
        apiError &&
        typeof apiError === "object" &&
        ("status" in apiError
          ? (apiError as { status?: number }).status === 404
          : false);

      if (isModelError && model !== "openai/gpt-oss-20b") {
        completion = await client.chat.completions.create({
          model: "openai/gpt-oss-20b",
          temperature: 0.25,
          response_format: { type: "json_object" },
          messages,
        });
      } else {
        throw apiError;
      }
    }

    return NextResponse.json({
      completion,
      output: completion.choices?.[0]?.message?.content ?? "",
    });
  } catch (error: unknown) {
    let message = "Failed to analyze papers.";

    if (error && typeof error === "object") {
      const err = error as { status?: number; message?: string };
      if (err.status === 401) {
        message =
          "Invalid Groq API key. Please check your GROQ_API_KEY in .env.local (and Vercel environment variables if deployed).";
      } else if (err.status === 429) {
        message = "Groq API rate limit reached. Please wait a moment and try again.";
      } else if (err.message) {
        message = err.message;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
