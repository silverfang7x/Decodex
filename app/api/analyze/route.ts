import { NextResponse } from "next/server";
import Groq from "groq-sdk";

interface AnalyzeRequestBody {
  extractedPapers: Array<{ name: string; text: string }>;
  syllabus: string;
  subject: string;
  yearRange: { from: number; to: number };
}

export async function POST(request: Request) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY environment variable." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as AnalyzeRequestBody;
    const papersText = body.extractedPapers
      .map((paper, index) => `Paper ${index + 1}: ${paper.name}\n${paper.text}`)
      .join("\n\n---\n\n");

    const client = new Groq({ apiKey: groqApiKey });
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content:
            "You are DecodeX, an exam strategist. Produce concise, practical insights with prioritized topic focus, revision tactics, and a simple study plan.",
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
      ],
    });

    return NextResponse.json({
      completion,
      output: completion.choices?.[0]?.message?.content ?? "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze papers.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

