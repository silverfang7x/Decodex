"use client";

import { useEffect, useMemo, useState } from "react";
import { useMotionValue, useMotionValueEvent, useSpring } from "framer-motion";

export interface AnimatedCounterProps {
  value: number;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  locale = "en-US",
  maximumFractionDigits = 0,
  minimumFractionDigits = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const target = Number.isFinite(value) ? value : 0;
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 110,
    damping: 22,
    mass: 0.8,
  });

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
      }),
    [locale, minimumFractionDigits, maximumFractionDigits],
  );

  const [display, setDisplay] = useState(() =>
    `${prefix}${formatter.format(0)}${suffix}`,
  );

  useMotionValueEvent(springValue, "change", (latest) => {
    const rounded =
      maximumFractionDigits > 0
        ? Number(latest.toFixed(maximumFractionDigits))
        : Math.round(latest);
    setDisplay(`${prefix}${formatter.format(rounded)}${suffix}`);
  });

  useEffect(() => {
    motionValue.set(0);
    springValue.jump(0);
    motionValue.set(target);
  }, [motionValue, springValue, target]);

  return <span className={className}>{display}</span>;
}

