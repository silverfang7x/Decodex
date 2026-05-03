"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, UploadCloud } from "lucide-react";
import { AnimatedCounter, GlassCard } from "@/components";
import { useAnalysis } from "@/hooks/useAnalysis";

const revealContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const particleDots = Array.from({ length: 40 }, (_, index) => ({
  id: index,
  x: (index % 10) * 10 + 5,
  y: Math.floor(index / 10) * 22 + 16,
}));

const fileListContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fileListItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const years = Array.from({ length: 10 }, (_, index) => 2015 + index);

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const router = useRouter();
  const {
    files,
    syllabus,
    subject,
    yearRange,
    isLoading,
    results,
    setFiles,
    setSyllabus,
    setSubject,
    setYearRange,
    setIsLoading,
  } = useAnalysis();
  const [uploadError, setUploadError] = useState("");

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: { file: File }[]) => {
      setUploadError("");

      if (fileRejections.length > 0) {
        setUploadError("Only PDF files are allowed.");
      }

      const currentKeys = new Set(files.map((file) => `${file.name}-${file.size}`));
      const uniqueAccepted = acceptedFiles.filter(
        (file) => !currentKeys.has(`${file.name}-${file.size}`),
      );
      const availableSlots = Math.max(0, 5 - files.length);

      if (uniqueAccepted.length > availableSlots) {
        setUploadError("You can upload up to 5 PDF files.");
      }

      if (availableSlots === 0) {
        return;
      }

      setFiles([...files, ...uniqueAccepted.slice(0, availableSlots)]);
    },
    [files, setFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);

      const filePayload = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          dataUrl: await fileToDataUrl(file),
        })),
      );

      const payload = {
        files: filePayload,
        syllabus,
        subject,
        yearRange,
        results,
      };

      sessionStorage.setItem("decodex-analysis-input", JSON.stringify(payload));
      router.push("/analysis");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative overflow-x-clip">
      <section
        id="home"
        className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-4 py-20 sm:min-h-[92vh] sm:px-6 sm:py-24"
      >
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="particle-grid h-full w-full"
            aria-hidden="true"
          >
            {particleDots.map((dot) => (
              <circle
                key={dot.id}
                cx={`${dot.x}%`}
                cy={`${dot.y}%`}
                r="0.28"
                fill="rgba(240, 240, 255, 0.38)"
              />
            ))}
            {particleDots.slice(0, 30).map((dot) => (
              <line
                key={`h-${dot.id}`}
                x1={`${dot.x}%`}
                y1={`${dot.y}%`}
                x2={`${dot.x + 10}%`}
                y2={`${dot.y}%`}
                stroke="rgba(240, 240, 255, 0.16)"
                strokeWidth="0.08"
              />
            ))}
            {particleDots.slice(0, 20).map((dot) => (
              <line
                key={`v-${dot.id}`}
                x1={`${dot.x}%`}
                y1={`${dot.y}%`}
                x2={`${dot.x}%`}
                y2={`${dot.y + 22}%`}
                stroke="rgba(240, 240, 255, 0.1)"
                strokeWidth="0.08"
              />
            ))}
          </svg>
        </div>

        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          className="relative z-10 mx-auto w-full max-w-6xl"
        >
          <motion.div variants={fadeUp} className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber/35 bg-amber/10 px-4 py-2 text-xs font-medium text-amber">
              <span className="size-2 rounded-full bg-amber shadow-[0_0_0_0_rgba(245,166,35,0.9)] animate-[amber-pulse_1.8s_ease-out_infinite]" />
              AI-Powered by Claude
            </span>
          </motion.div>

          <motion.div variants={fadeUp} className="text-center">
            <h1 className="font-[var(--font-heading)] text-4xl font-bold leading-tight tracking-tight text-icewhite sm:text-5xl md:text-6xl">
              <span className="bg-gradient-to-r from-amber via-[#ffd16f] to-amber bg-clip-text text-transparent">
                Decode
              </span>{" "}
              Your Exam. Dominate It.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm text-icewhite/68 sm:text-base">
              DecodeX turns past papers into strategic insights, exposes patterns, and
              helps you study with precision before exam day.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href="#upload"
              className="rounded-xl bg-amber px-5 py-3 text-sm font-semibold text-obsidian transition hover:brightness-110 sm:px-6"
            >
              Start Analysis
            </a>
            <a
              href="#demo"
              className="rounded-xl border border-white/25 bg-transparent px-5 py-3 text-sm font-semibold text-icewhite transition hover:border-white/45 hover:bg-white/5 sm:px-6"
            >
              See Demo
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3"
          >
            <GlassCard className="p-5 text-center">
              <p className="font-[var(--font-heading)] text-3xl font-bold text-amber">
                <AnimatedCounter value={10000} suffix="+" />
              </p>
              <p className="mt-2 text-sm text-icewhite/72">Papers Analyzed</p>
            </GlassCard>
            <GlassCard className="p-5 text-center">
              <p className="font-[var(--font-heading)] text-3xl font-bold text-teal">
                <AnimatedCounter value={95} suffix="%" />
              </p>
              <p className="mt-2 text-sm text-icewhite/72">Accuracy</p>
            </GlassCard>
            <GlassCard className="p-5 text-center">
              <p className="font-[var(--font-heading)] text-3xl font-bold text-purple">
                <AnimatedCounter value={3} suffix="x" />
              </p>
              <p className="mt-2 text-sm text-icewhite/72">Study Efficiency</p>
            </GlassCard>
          </motion.div>
        </motion.div>
      </section>

      <motion.nav
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
        className="sticky top-0 z-30 border-y border-white/10 bg-surface/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <span className="font-[var(--font-heading)] text-xl font-extrabold tracking-tight text-icewhite sm:text-2xl">
            DecodeX
          </span>
          <div className="flex items-center gap-4 text-xs text-icewhite/78 sm:gap-6 sm:text-sm">
            <a href="#home" className="transition hover:text-icewhite">
              Home
            </a>
            <a href="#features" className="transition hover:text-icewhite">
              Features
            </a>
            <a href="#demo" className="transition hover:text-icewhite">
              Demo
            </a>
          </div>
        </div>
      </motion.nav>

      <section
        id="upload"
        className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 text-icewhite sm:px-6 sm:pb-20 sm:pt-14"
      >
        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <GlassCard className="h-full p-5 sm:p-6">
                <div
                  {...getRootProps()}
                    className={`group cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8 ${
                    isDragActive
                      ? "border-amber bg-amber/10"
                      : "border-amber/55 bg-amber/5 hover:border-amber hover:bg-amber/10"
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mx-auto size-9 text-amber" />
                  <p className="mt-3 font-[var(--font-heading)] text-lg font-bold text-icewhite sm:text-xl">
                    Drop past papers here
                  </p>
                  <p className="mt-2 text-sm text-icewhite/65">
                    PDF only • up to 5 files
                  </p>
                </div>

                {uploadError ? (
                  <p className="mt-4 text-sm font-medium text-coral">{uploadError}</p>
                ) : null}

                <motion.ul
                  variants={fileListContainer}
                  initial="hidden"
                  animate="show"
                  className="mt-5 space-y-3"
                >
                  <AnimatePresence mode="popLayout">
                    {files.map((file) => (
                      <motion.li
                        key={`${file.name}-${file.size}`}
                        variants={fileListItem}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <FileText className="size-4 shrink-0 text-amber" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-icewhite">
                              {file.name}
                            </p>
                            <p className="text-xs text-icewhite/60">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2 className="size-5 shrink-0 text-[#36F29D] drop-shadow-[0_0_6px_rgba(54,242,157,0.9)]" />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlassCard className="h-full space-y-5 p-5 sm:p-6">
                <div>
                  <label
                    htmlFor="syllabus-topics"
                    className="mb-2 block text-sm font-medium text-icewhite/85"
                  >
                    Paste your syllabus topics (one per line)
                  </label>
                  <textarea
                    id="syllabus-topics"
                    value={syllabus}
                    onChange={(event) => setSyllabus(event.target.value)}
                    rows={10}
                    className="w-full resize-none rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-icewhite outline-none transition placeholder:text-icewhite/45 focus:border-amber/75"
                    placeholder={`Algebra\nDifferentiation\nOrganic Chemistry`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject-name"
                    className="mb-2 block text-sm font-medium text-icewhite/85"
                  >
                    Subject name
                  </label>
                  <input
                    id="subject-name"
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-icewhite outline-none transition placeholder:text-icewhite/45 focus:border-amber/75"
                    placeholder="e.g. Physics"
                  />
                </div>

                <div>
                  <p className="mb-2 block text-sm font-medium text-icewhite/85">Year range</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      aria-label="From year"
                      value={yearRange.from}
                      onChange={(event) => {
                        const from = Number(event.target.value);
                        setYearRange((prev) => ({
                          from,
                          to: Math.max(prev.to, from),
                        }));
                      }}
                      className="rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-icewhite outline-none transition focus:border-amber/75"
                    >
                      {years.map((year) => (
                        <option key={`from-${year}`} value={year} className="bg-card text-icewhite">
                          {year}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="To year"
                      value={yearRange.to}
                      onChange={(event) => {
                        const to = Number(event.target.value);
                        setYearRange((prev) => ({
                          from: Math.min(prev.from, to),
                          to,
                        }));
                      }}
                      className="rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-icewhite outline-none transition focus:border-amber/75"
                    >
                      {years.map((year) => (
                        <option key={`to-${year}`} value={year} className="bg-card text-icewhite">
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          <motion.button
            variants={fadeUp}
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-2xl bg-amber px-6 py-3.5 text-sm font-semibold text-obsidian transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-80 sm:px-8 sm:py-4 sm:text-base"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                Analyzing...
              </span>
            ) : (
              "Analyze Papers →"
            )}
          </motion.button>
        </motion.div>
      </section>

      <section
        id="features"
        className="mx-auto min-h-[40vh] w-full max-w-6xl px-4 py-16 text-icewhite/60 sm:px-6 sm:py-20"
      >
        <p className="text-sm">Features section placeholder</p>
      </section>
      <section
        id="demo"
        className="mx-auto min-h-[40vh] w-full max-w-6xl px-4 py-16 text-icewhite/60 sm:px-6 sm:py-20"
      >
        <p className="text-sm">Demo section placeholder</p>
      </section>

      <style jsx>{`
        @keyframes particle-drift {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0.8%, -1.2%, 0) scale(1.015);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes amber-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.8);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(245, 166, 35, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(245, 166, 35, 0);
          }
        }

        .particle-grid {
          animation: particle-drift 22s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
