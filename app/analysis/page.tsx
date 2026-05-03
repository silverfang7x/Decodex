"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AnalysisDashboard, GlassCard } from "@/components";
import { extractTextFromPDF } from "@/lib/extractPdf";

interface StoredFile {
  name: string;
  type: string;
  lastModified: number;
  dataUrl: string;
}

interface AnalysisInput {
  files: StoredFile[];
  syllabus: string;
  subject: string;
  yearRange: { from: number; to: number };
}

interface ExtractedPaper {
  name: string;
  text: string;
}

interface AnalysisResponse {
  [key: string]: unknown;
}

const STEPS = [
  "Reading papers",
  "Extracting topics",
  "Cross-referencing syllabus",
  "Building your plan",
];

const QUOTES = [
  "Study smart. Stress less.",
  "Every past paper is a map to your marks.",
  "Consistency beats cramming.",
  "Small daily wins compound into big results.",
];

const stepVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function dataUrlToFile(dataUrl: string, name: string, type: string, lastModified: number) {
  const [meta, content] = dataUrl.split(",");
  const mimeMatch = meta?.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? type ?? "application/pdf";
  const binary = atob(content ?? "");
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], name, { type: mimeType, lastModified });
}

export default function AnalysisPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Preparing analysis...");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typedQuote, setTypedQuote] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);

  const isProcessing = !result && !error;

  useEffect(() => {
    if (!isProcessing) return;

    let charIndex = 0;
    const quote = QUOTES[quoteIndex];
    setTypedQuote("");

    const typing = window.setInterval(() => {
      charIndex += 1;
      setTypedQuote(quote.slice(0, charIndex));
      if (charIndex >= quote.length) {
        window.clearInterval(typing);
        window.setTimeout(() => {
          setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        }, 1300);
      }
    }, 45);

    return () => window.clearInterval(typing);
  }, [isProcessing, quoteIndex]);

  useEffect(() => {
    let cancelled = false;

    const runAnalysis = async () => {
      try {
        const raw = sessionStorage.getItem("decodex-analysis-input");
        if (!raw) {
          throw new Error("Missing upload data. Please upload papers again.");
        }

        const parsed: AnalysisInput = JSON.parse(raw);
        if (!parsed.files?.length) {
          throw new Error("No papers found. Please upload at least one PDF.");
        }

        setActiveStep(0);
        setProgressMessage(`Reading ${parsed.files.length} paper(s)...`);
        const pdfFiles = parsed.files.map((file) =>
          dataUrlToFile(file.dataUrl, file.name, file.type, file.lastModified),
        );

        setActiveStep(1);
        const extractedPapers: ExtractedPaper[] = [];
        for (let index = 0; index < pdfFiles.length; index += 1) {
          if (cancelled) return;
          setProgressMessage(
            `Extracting text from ${pdfFiles[index].name} (${index + 1}/${pdfFiles.length})`,
          );
          const text = await extractTextFromPDF(pdfFiles[index]);
          extractedPapers.push({ name: pdfFiles[index].name, text });
        }

        setActiveStep(2);
        setProgressMessage("Cross-referencing extracted topics with your syllabus...");

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extractedPapers,
            syllabus: parsed.syllabus,
            subject: parsed.subject,
            yearRange: parsed.yearRange,
          }),
        });

        if (!response.ok) {
          const failure = await response.json().catch(() => ({}));
          throw new Error(
            typeof failure.error === "string"
              ? failure.error
              : "Analysis request failed.",
          );
        }

        setActiveStep(3);
        setProgressMessage("Building your personalized plan...");
        const apiResult: AnalysisResponse = await response.json();
        if (!cancelled) {
          setResult(apiResult);
        }
      } catch (analysisError) {
        if (!cancelled) {
          const message =
            analysisError instanceof Error
              ? analysisError.message
              : "Something went wrong during analysis.";
          setError(message);
        }
      }
    };

    void runAnalysis();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleSteps = useMemo(
    () => STEPS.map((label, index) => ({ label, active: index <= activeStep })),
    [activeStep],
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="analysis-dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <AnalysisDashboard data={result} />
          </motion.div>
        ) : error ? (
          <motion.main
            key="analysis-error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="mx-auto flex min-h-[78vh] w-full max-w-4xl items-center px-4 py-16 sm:px-6 sm:py-20"
          >
            <GlassCard className="w-full p-6 text-center sm:p-8">
              <h1 className="font-[var(--font-heading)] text-2xl font-bold text-icewhite sm:text-3xl">
                Unable to Analyze Papers
              </h1>
              <p className="mt-3 text-sm text-coral">{error}</p>
            </GlassCard>
          </motion.main>
        ) : (
          <motion.main
            key="analysis-loading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mx-auto flex min-h-[78vh] w-full max-w-5xl items-center px-4 py-16 sm:px-6 sm:py-20"
          >
            <GlassCard className="w-full p-6 sm:p-8 md:p-10">
              <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                <div className="orbital-spinner relative mb-6 size-14 sm:size-16">
                  <span className="absolute inset-0 rounded-full border border-amber/25" />
                  <span className="absolute inset-2 rounded-full border border-t-amber border-r-amber/20 border-b-transparent border-l-transparent" />
                  <span className="absolute inset-4 rounded-full border border-t-amber/85 border-r-transparent border-b-transparent border-l-amber/30" />
                </div>

                <h1 className="font-[var(--font-heading)] text-2xl font-bold text-icewhite sm:text-3xl">
                  Decoding your papers...
                </h1>
                <p className="mt-2 text-sm text-icewhite/68">{progressMessage}</p>

                <div className="mt-7 w-full space-y-3 text-left sm:mt-8">
                  {visibleSteps.map((step, index) => (
                    <motion.div
                      key={step.label}
                      variants={stepVariants}
                      initial="hidden"
                      animate={step.active ? "show" : "hidden"}
                      className={`rounded-xl border px-4 py-3 text-sm transition ${
                        step.active
                          ? "border-amber/40 bg-amber/10 text-icewhite"
                          : "border-white/10 bg-surface/60 text-icewhite/45"
                      }`}
                    >
                      <span className="mr-2 text-amber">{index + 1}.</span>
                      {step.label}
                    </motion.div>
                  ))}
                </div>

                <div className="mt-7 min-h-7 text-sm text-icewhite/70 sm:mt-8">
                  <span className="text-amber">“</span>
                  {typedQuote}
                  <span className="type-cursor ml-0.5 inline-block">|</span>
                  <span className="text-amber">”</span>
                </div>
              </div>
            </GlassCard>
          </motion.main>
        )}
      </AnimatePresence>

      <style jsx>{`
        .orbital-spinner {
          animation: spin-orbit 2.2s linear infinite;
        }

        .type-cursor {
          animation: blink 1s steps(1, end) infinite;
        }

        @keyframes spin-orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

