"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Clock3,
  Download,
  Flame,
  Sparkles,
  Target,
  Telescope,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { GlassCard } from "@/components/GlassCard";
import { TopicBadge } from "@/components/TopicBadge";

export interface AnalysisDashboardProps {
  data: unknown;
}

interface TopicRow {
  topicName: string;
  frequency: number;
  importanceScore: number;
  yearsSeen: string;
  match: number;
}

interface ParsedResult {
  totalQuestionsDetected: number;
  uniqueTopicsFound: number;
  highYieldTopics: number;
  syllabusCoverage: number;
  topicRows: TopicRow[];
  gapTopics: string[];
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function parseJsonFromText(value: string): Record<string, unknown> | null {
  const cleaned = value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return toObject(parsed);
  } catch {
    return null;
  }
}

function normalizeYearsSeen(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(", ");
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return "—";
}

function normalizeTopicRows(source: unknown): TopicRow[] {
  if (!Array.isArray(source)) return [];

  return source
    .map((entry, index) => {
      if (typeof entry === "string") {
        const fallbackScore = clampPercent(88 - index * 8);
        return {
          topicName: entry,
          frequency: Math.max(1, 8 - index),
          importanceScore: fallbackScore,
          yearsSeen: "2019-2024",
          match: clampPercent(fallbackScore - 8),
        };
      }

      const item = toObject(entry);
      if (!item) return null;

      const score = clampPercent(
        Number(
          item.importanceScore ??
            item.score ??
            item.importance ??
            item.priorityScore ??
            70 - index * 6,
        ),
      );

      const match = clampPercent(
        Number(item.match ?? item.matchPercent ?? item.syllabusMatch ?? score - 10),
      );

      return {
        topicName: String(item.topicName ?? item.topic ?? item.name ?? `Topic ${index + 1}`),
        frequency: Math.max(
          1,
          Math.round(Number(item.frequency ?? item.freq ?? item.count ?? 6 - index)),
        ),
        importanceScore: score,
        yearsSeen: normalizeYearsSeen(item.yearsSeen ?? item.years ?? item.yearSpan),
        match,
      };
    })
    .filter((entry): entry is TopicRow => Boolean(entry));
}

function normalizeGapTopics(source: unknown): string[] {
  if (!Array.isArray(source)) return [];

  return source
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      const objectEntry = toObject(entry);
      if (!objectEntry) return "";
      const value = objectEntry.topic ?? objectEntry.name ?? objectEntry.topicName;
      return typeof value === "string" ? value.trim() : "";
    })
    .filter((entry) => Boolean(entry));
}

function parseResult(data: unknown): ParsedResult {
  const root = toObject(data) ?? {};
  const outputText = typeof root.output === "string" ? root.output : "";
  const parsedOutput = outputText ? parseJsonFromText(outputText) : null;
  const structured = parsedOutput ?? root;

  const topicRows = normalizeTopicRows(
    structured.topicRanking ??
      structured.topics ??
      structured.highPriorityTopics ??
      structured.likelyPatterns,
  ).sort((a, b) => b.importanceScore - a.importanceScore);

  const totalQuestionsDetected = Math.max(
    0,
    Math.round(
      Number(
        structured.totalQuestionsDetected ??
          structured.totalQuestions ??
          topicRows.reduce((sum, topic) => sum + topic.frequency, 0),
      ),
    ),
  );

  const uniqueTopicsFound = Math.max(
    0,
    Math.round(Number(structured.uniqueTopicsFound ?? structured.uniqueTopics ?? topicRows.length)),
  );

  const highYieldTopics = Math.max(
    0,
    Math.round(
      Number(
        structured.highYieldTopics ??
          structured.highYieldCount ??
          topicRows.filter((topic) => topic.importanceScore >= 75).length,
      ),
    ),
  );

  const syllabusCoverage = clampPercent(
    Number(
      structured.syllabusCoverage ??
        structured.syllabusCoveragePercent ??
        (topicRows.length
          ? topicRows.reduce((sum, topic) => sum + topic.match, 0) / topicRows.length
          : 0),
    ),
  );

  const gapTopics = normalizeGapTopics(
    structured.coverageGaps ?? structured.gapTopics ?? structured.unaskedTopics,
  );

  return {
    totalQuestionsDetected,
    uniqueTopicsFound,
    highYieldTopics,
    syllabusCoverage,
    topicRows,
    gapTopics,
  };
}

function rankBadgeClass(rank: number) {
  if (rank === 1) return "border-[#f5c451]/70 bg-[#f5c451]/20 text-[#f5c451]";
  if (rank === 2) return "border-[#c6cedf]/70 bg-[#c6cedf]/18 text-[#c6cedf]";
  if (rank === 3) return "border-[#cd7f32]/70 bg-[#cd7f32]/20 text-[#cd7f32]";
  return "border-white/20 bg-white/5 text-icewhite/80";
}

interface DarkTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
}

function DarkChartTooltip({ active, label, payload }: DarkTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#11111b] px-3 py-2 text-xs text-icewhite shadow-xl">
      {label !== undefined ? <p className="mb-1 text-icewhite/70">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <p key={`${entry.name ?? "item"}-${index}`} className="flex items-center gap-2">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: entry.color ?? "#F5A623" }}
            />
            <span className="text-icewhite/75">{entry.name}:</span>
            <span className="font-medium text-icewhite">{entry.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

interface HeatmapCell {
  topic: string;
  year: number;
  count: number;
  rowIndex: number;
  colIndex: number;
}

interface StudyDayPlan {
  dayNumber: number;
  dayName: string;
  focus: string;
  subTopics: string[];
  hours: number;
}

function parseYearsSeen(yearsSeen: string): number[] {
  const matches = yearsSeen.match(/\b20\d{2}\b/g) ?? [];
  return Array.from(new Set(matches.map((match) => Number(match)).filter((year) => year > 0)));
}

function truncateLabel(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function toHeatColor(count: number, maxCount: number) {
  if (count <= 0 || maxCount <= 0) return "rgba(13,13,20,0.95)";
  const alpha = 0.2 + (count / maxCount) * 0.8;
  return `rgba(245,166,35,${Math.min(1, alpha).toFixed(3)})`;
}

export function AnalysisDashboard({ data }: AnalysisDashboardProps) {
  const parsed = useMemo(() => parseResult(data), [data]);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const topFrequencyData = useMemo(
    () =>
      parsed.topicRows.slice(0, 10).map((topic) => ({
        name:
          topic.topicName.length > 16
            ? `${topic.topicName.slice(0, 16)}...`
            : topic.topicName,
        frequency: topic.frequency,
      })),
    [parsed.topicRows],
  );

  const radarData = useMemo(
    () =>
      parsed.topicRows.slice(0, 8).map((topic) => {
        const hard = clampPercent(topic.importanceScore);
        const medium = clampPercent(100 - Math.abs(55 - topic.importanceScore) * 1.35);
        const easy = clampPercent(100 - hard);

        return {
          topic:
            topic.topicName.length > 14
              ? `${topic.topicName.slice(0, 14)}...`
              : topic.topicName,
          easy,
          medium,
          hard,
        };
      }),
    [parsed.topicRows],
  );

  const pieData = useMemo(() => {
    const distribution = [
      {
        name: "High Yield",
        value: parsed.topicRows.filter((topic) => topic.importanceScore >= 80).length,
        color: "#F5A623",
      },
      {
        name: "Core",
        value: parsed.topicRows.filter(
          (topic) => topic.importanceScore >= 60 && topic.importanceScore < 80,
        ).length,
        color: "#00D4B4",
      },
      {
        name: "Support",
        value: parsed.topicRows.filter(
          (topic) => topic.importanceScore >= 40 && topic.importanceScore < 60,
        ).length,
        color: "#8B5CF6",
      },
      {
        name: "Weak",
        value: parsed.topicRows.filter((topic) => topic.importanceScore < 40).length,
        color: "#FF6B6B",
      },
    ];

    return distribution.filter((slice) => slice.value > 0);
  }, [parsed.topicRows]);

  const heatmap = useMemo(() => {
    const selectedTopics = parsed.topicRows.slice(0, 12);
    const yearsFromRows = selectedTopics.flatMap((topic) => parseYearsSeen(topic.yearsSeen));
    const years =
      yearsFromRows.length > 0
        ? Array.from(new Set(yearsFromRows)).sort((a, b) => a - b)
        : Array.from({ length: 10 }, (_, index) => 2015 + index);

    const matrix = selectedTopics.map((topic, rowIndex) => {
      const countsByYear: Record<number, number> = Object.fromEntries(
        years.map((year) => [year, 0]),
      );
      const seenYears = parseYearsSeen(topic.yearsSeen).filter((year) => year in countsByYear);
      const distributionYears = seenYears.length > 0 ? seenYears : [years[years.length - 1]];
      const base = Math.floor(topic.frequency / distributionYears.length);
      let remainder = topic.frequency % distributionYears.length;

      distributionYears.forEach((year) => {
        countsByYear[year] += base + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder -= 1;
      });

      return {
        topic: topic.topicName,
        rowIndex,
        values: years.map((year, colIndex) => ({
          topic: topic.topicName,
          year,
          count: countsByYear[year],
          rowIndex,
          colIndex,
        })),
      };
    });

    const maxCount =
      matrix
        .flatMap((row) => row.values)
        .reduce((max, cell) => (cell.count > max ? cell.count : max), 0) || 1;

    return { years, matrix, maxCount };
  }, [parsed.topicRows]);

  const studyPlan = useMemo<StudyDayPlan[]>(() => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const topicPool =
      parsed.topicRows.length > 0
        ? parsed.topicRows
        : Array.from({ length: 7 }, (_, index) => ({
            topicName: `Topic ${index + 1}`,
            frequency: 4,
            importanceScore: 60,
            yearsSeen: "2024",
            match: 50,
          }));

    return dayNames.map((dayName, index) => {
      const focusTopic = topicPool[index % topicPool.length];
      const subTopics = [
        topicPool[(index + 1) % topicPool.length]?.topicName,
        topicPool[(index + 2) % topicPool.length]?.topicName,
        topicPool[(index + 3) % topicPool.length]?.topicName,
      ]
        .filter((topic) => Boolean(topic) && topic !== focusTopic.topicName)
        .slice(0, 3)
        .map((topic) => String(topic));

      return {
        dayNumber: index + 1,
        dayName,
        focus: focusTopic.topicName,
        subTopics,
        hours: Math.max(2, Math.min(5, Math.round(focusTopic.importanceScore / 24))),
      };
    });
  }, [parsed.topicRows]);

  const practiceTopics = useMemo(() => parsed.topicRows.slice(0, 3), [parsed.topicRows]);

  useEffect(() => {
    const raw = localStorage.getItem("decodex-study-plan-completed");
    if (!raw) return;
    try {
      const parsedValue = JSON.parse(raw);
      if (Array.isArray(parsedValue)) {
        setCompletedDays(
          parsedValue
            .map((entry) => Number(entry))
            .filter((entry) => Number.isInteger(entry) && entry > 0 && entry <= 7),
        );
      }
    } catch {
      setCompletedDays([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("decodex-study-plan-completed", JSON.stringify(completedDays));
  }, [completedDays]);

  const toggleDayCompletion = (dayNumber: number) => {
    setCompletedDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((entry) => entry !== dayNumber)
        : [...prev, dayNumber].sort((a, b) => a - b),
    );
  };

  const downloadStudyPlan = () => {
    const lines = [
      "DecodeX - 7 Day Study Plan",
      "",
      ...studyPlan.map((day) => {
        const done = completedDays.includes(day.dayNumber) ? "Completed" : "Pending";
        return [
          `Day ${day.dayNumber} (${day.dayName})`,
          `Focus: ${day.focus}`,
          `Sub-topics: ${day.subTopics.join(", ") || "—"}`,
          `Estimated Hours: ${day.hours}h`,
          `Status: ${done}`,
          "",
        ].join("\n");
      }),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "decodex-study-plan.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-icewhite/60">Total Questions Detected</p>
              <p className="mt-2 font-[var(--font-heading)] text-3xl font-bold text-coral">
                <AnimatedCounter value={parsed.totalQuestionsDetected} />
              </p>
            </div>
            <ClipboardList className="size-5 text-coral" />
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-icewhite/60">Unique Topics Found</p>
              <p className="mt-2 font-[var(--font-heading)] text-3xl font-bold text-amber">
                <AnimatedCounter value={parsed.uniqueTopicsFound} />
              </p>
            </div>
            <Telescope className="size-5 text-amber" />
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-icewhite/60">High-Yield Topics</p>
              <p className="mt-2 font-[var(--font-heading)] text-3xl font-bold text-[#36F29D]">
                <AnimatedCounter value={parsed.highYieldTopics} />
              </p>
            </div>
            <Flame className="size-5 text-[#36F29D]" />
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-icewhite/60">Syllabus Coverage %</p>
              <p className="mt-2 font-[var(--font-heading)] text-3xl font-bold text-teal">
                <AnimatedCounter value={parsed.syllabusCoverage} suffix="%" />
              </p>
            </div>
            <Target className="size-5 text-teal" />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
            <thead className="bg-surface/95 text-icewhite/70">
              <tr>
                <th className="px-4 py-4 font-medium">Rank</th>
                <th className="px-4 py-4 font-medium">Topic Name</th>
                <th className="px-4 py-4 font-medium">Frequency</th>
                <th className="px-4 py-4 font-medium">Importance Score</th>
                <th className="px-4 py-4 font-medium">Years Seen</th>
                <th className="px-4 py-4 font-medium">Match</th>
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {parsed.topicRows.map((row, index) => {
                const rank = index + 1;
                return (
                  <motion.tr
                    key={`${row.topicName}-${rank}`}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      show: {
                        opacity: 1,
                        x: 0,
                        transition: { duration: 0.35, ease: "easeOut" },
                      },
                    }}
                    className={`border-t border-white/8 transition ${
                      index % 2 === 1 ? "bg-white/[0.02]" : "bg-transparent"
                    } hover:border-l-4 hover:border-l-amber hover:bg-amber/[0.07]`}
                  >
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex min-w-8 items-center justify-center rounded-full border px-2 py-1 text-xs font-semibold ${rankBadgeClass(
                          rank,
                        )}`}
                      >
                        {rank}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-icewhite">{row.topicName}</td>
                    <td className="px-4 py-4 text-icewhite/80">{row.frequency}</td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-[180px] items-center gap-3">
                        <span className="w-10 shrink-0 text-xs text-icewhite/70">
                          {row.importanceScore}%
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${row.importanceScore}%` }}
                            viewport={{ once: true, amount: 0.7 }}
                            transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
                            className="h-full rounded-full bg-gradient-to-r from-amber via-coral to-purple"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-icewhite/80">{row.yearsSeen}</td>
                    <td className="px-4 py-4">
                      <TopicBadge
                        label={
                          row.match >= 75 ? "High" : row.match >= 40 ? "Medium" : "Low"
                        }
                        score={row.match}
                      />
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </GlassCard>

      <motion.section
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mt-6 grid gap-4 xl:grid-cols-10"
      >
        <GlassCard className="p-5 xl:col-span-4">
          <h3 className="mb-4 text-sm font-semibold text-icewhite/90">
            Top 10 Topics by Frequency
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFrequencyData} margin={{ top: 8, right: 8, left: -16, bottom: 44 }}>
                <defs>
                  <linearGradient id="amberBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5A623" stopOpacity={1} />
                    <stop offset="100%" stopColor="#F5A623" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff15" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  stroke="#888899"
                  tick={{ fill: "#888899", fontSize: 11 }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#888899" tick={{ fill: "#888899", fontSize: 11 }} />
                <Tooltip content={<DarkChartTooltip />} cursor={{ fill: "rgba(245,166,35,0.08)" }} />
                <Bar
                  dataKey="frequency"
                  fill="url(#amberBarGradient)"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5 xl:col-span-3">
          <h3 className="mb-4 text-sm font-semibold text-icewhite/90">
            Difficulty Distribution
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 8, right: 14, left: 14, bottom: 8 }}>
                <PolarGrid stroke="#ffffff15" />
                <PolarAngleAxis
                  dataKey="topic"
                  tick={{ fill: "#888899", fontSize: 11 }}
                  stroke="#888899"
                />
                <Tooltip content={<DarkChartTooltip />} />
                <Radar
                  name="Hard %"
                  dataKey="hard"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.4}
                  isAnimationActive
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5 xl:col-span-3">
          <h3 className="mb-4 text-sm font-semibold text-icewhite/90">
            Topic Category Distribution
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<DarkChartTooltip />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={92}
                  paddingAngle={3}
                  isAnimationActive
                >
                  {pieData.map((slice) => (
                    <Cell key={slice.name} fill={slice.color} />
                  ))}
                  <Label
                    position="center"
                    content={({ viewBox }) => {
                      const total = pieData.reduce((sum, slice) => sum + slice.value, 0);
                      if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                      const cx = Number(viewBox.cx);
                      const cy = Number(viewBox.cy);
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={cx} dy="-0.2em" fill="#F0F0FF" fontSize="26" fontWeight="700">
                            {total}
                          </tspan>
                          <tspan x={cx} dy="1.4em" fill="#888899" fontSize="11">
                            Total
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </motion.section>

      <GlassCard className="mt-6 p-5">
        <h3 className="mb-4 text-sm font-semibold text-icewhite/90">
          Year × Topic Frequency Heatmap
        </h3>
        <div className="relative overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="mb-2 ml-44 grid gap-2" style={{ gridTemplateColumns: `repeat(${heatmap.years.length}, minmax(0, 1fr))` }}>
              {heatmap.years.map((year) => (
                <div key={`year-${year}`} className="text-center text-xs text-icewhite/60">
                  {year}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {heatmap.matrix.map((row) => (
                <div key={row.topic} className="flex items-center gap-3">
                  <div className="w-40 truncate text-xs text-icewhite/72" title={row.topic}>
                    {truncateLabel(row.topic, 20)}
                  </div>
                  <div
                    className="grid flex-1 gap-2"
                    style={{ gridTemplateColumns: `repeat(${heatmap.years.length}, minmax(0, 1fr))` }}
                  >
                    {row.values.map((cell) => (
                      <button
                        key={`${cell.topic}-${cell.year}`}
                        type="button"
                        className="heat-cell h-5 rounded-md border border-white/8"
                        style={{
                          backgroundColor: toHeatColor(cell.count, heatmap.maxCount),
                          animationDelay: `${(cell.rowIndex * 0.05 + cell.colIndex * 0.03).toFixed(
                            2,
                          )}s`,
                        }}
                        onMouseEnter={(event) => {
                          setHoveredCell(cell);
                          setHoverPosition({ x: event.clientX, y: event.clientY });
                        }}
                        onMouseMove={(event) =>
                          setHoverPosition({ x: event.clientX, y: event.clientY })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        aria-label={`${cell.topic} in ${cell.year}: ${cell.count} occurrences`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hoveredCell ? (
            <div
              className="pointer-events-none fixed z-40 rounded-lg border border-white/10 bg-[#11111b] px-3 py-2 text-xs text-icewhite shadow-xl"
              style={{ left: hoverPosition.x + 14, top: hoverPosition.y + 14 }}
            >
              <p className="text-icewhite/75">{truncateLabel(hoveredCell.topic, 36)}</p>
              <p className="mt-0.5 text-amber">
                {hoveredCell.year} • {hoveredCell.count} occurrence
                {hoveredCell.count === 1 ? "" : "s"}
              </p>
            </div>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard className="mt-6 p-5">
        <h3 className="text-sm font-semibold text-icewhite/90">Topics You&apos;ve Been Ignoring</h3>
        <p className="mt-2 text-xs font-semibold text-amber">
          These topics appear in your syllabus but have NEVER appeared in past papers.
          Study them last.
        </p>
        <motion.div
          layout
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          transition={{ layout: { duration: 0.35, ease: "easeOut" } }}
        >
          {parsed.gapTopics.length > 0 ? (
            parsed.gapTopics.map((topic) => (
              <motion.div
                key={topic}
                layout
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                className="inline-flex items-center gap-2 rounded-full border border-coral/35 border-l-[5px] border-l-coral bg-coral/10 px-4 py-2 text-xs text-icewhite/90"
              >
                <AlertTriangle className="size-3.5 shrink-0 text-coral" />
                <span className="truncate">{topic}</span>
              </motion.div>
            ))
          ) : (
            <motion.div
              layout
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-icewhite/70"
            >
              No uncovered syllabus topics detected from the current dataset.
            </motion.div>
          )}
        </motion.div>
      </GlassCard>

      <GlassCard className="mt-6 p-5">
        <h3 className="text-sm font-semibold text-icewhite/90">7-Day Study Planner</h3>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:overflow-x-auto md:pb-2">
          {studyPlan.map((day) => {
            const completed = completedDays.includes(day.dayNumber);
            return (
              <GlassCard
                key={`plan-day-${day.dayNumber}`}
                className={`w-full border-l-4 p-4 md:min-w-[260px] md:max-w-[260px] ${
                  completed
                    ? "border-l-[#36F29D] opacity-75"
                    : "border-l-teal"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                      Day {day.dayNumber}
                    </p>
                    <p className="mt-1 text-sm font-medium text-icewhite">{day.dayName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleDayCompletion(day.dayNumber)}
                    className={`inline-flex size-6 items-center justify-center rounded-md border text-xs transition ${
                      completed
                        ? "border-[#36F29D] bg-[#36F29D]/15 text-[#36F29D]"
                        : "border-white/25 text-icewhite/70 hover:border-amber hover:text-amber"
                    }`}
                    aria-label={`Mark day ${day.dayNumber} as ${
                      completed ? "incomplete" : "complete"
                    }`}
                  >
                    {completed ? <Check className="size-3.5" /> : null}
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-icewhite/60">Focus:</p>
                  <p className="mt-1 font-[var(--font-heading)] text-xl font-bold leading-tight text-icewhite">
                    {truncateLabel(day.focus, 32)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {day.subTopics.slice(0, 3).map((topic) => (
                    <span
                      key={`${day.dayNumber}-${topic}`}
                      className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] text-icewhite/78"
                    >
                      {truncateLabel(topic, 22)}
                    </span>
                  ))}
                </div>

                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/15 px-2.5 py-1 text-xs font-semibold text-amber">
                    <Clock3 className="size-3.5" />
                    {day.hours}h
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </GlassCard>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-icewhite/90">Practice Questions</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {practiceTopics.length > 0 ? (
            practiceTopics.map((topic) => (
              <div
                key={`practice-${topic.topicName}`}
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
              >
                <TopicBadge
                  label={topic.importanceScore >= 75 ? "High" : topic.importanceScore >= 40 ? "Medium" : "Low"}
                  score={topic.importanceScore}
                />
                <p className="mt-3 text-sm leading-relaxed text-icewhite/85">
                  {topic.topicName} — Analyze and evaluate...
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-xs font-semibold text-amber transition hover:bg-amber/20"
                >
                  <Sparkles className="size-3.5" />
                  Generate Similar
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-icewhite/70">
              No ranked topics available yet to generate practice prompts.
            </div>
          )}
        </div>
      </section>

      <GlassCard className="mt-6 p-5">
        <button
          type="button"
          onClick={downloadStudyPlan}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-6 py-3 text-sm font-semibold text-obsidian transition hover:brightness-110"
        >
          <Download className="size-4" />
          Download Your Study Plan
        </button>
      </GlassCard>

      <style jsx>{`
        .heat-cell {
          opacity: 0;
          transform: scale(0.75);
          animation: heat-cell-in 0.35s ease-out forwards;
        }

        @keyframes heat-cell-in {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  );
}

