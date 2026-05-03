import type { HTMLAttributes } from "react";

type ScoreTier = "high" | "mid" | "low";

export interface TopicBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  score: number;
}

const TIER_STYLES: Record<ScoreTier, string> = {
  high: "border-teal/60 bg-teal/10 text-teal",
  mid: "border-amber/60 bg-amber/10 text-amber",
  low: "border-purple/60 bg-purple/10 text-purple",
};

function getScoreTier(score: number): ScoreTier {
  if (score >= 75) return "high";
  if (score >= 40) return "mid";
  return "low";
}

export function TopicBadge({
  label,
  score,
  className = "",
  ...props
}: TopicBadgeProps) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const tier = getScoreTier(normalizedScore);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${TIER_STYLES[tier]} ${className}`}
      {...props}
    >
      <span>{label}</span>
      <span className="text-icewhite/80">{normalizedScore}</span>
    </span>
  );
}

