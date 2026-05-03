import type { HTMLAttributes, ReactNode } from "react";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function GlassCard({ children, className = "", ...props }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[inset_0_0_0_rgba(240,240,255,0)] transition-shadow duration-300 hover:shadow-[inset_0_0_28px_rgba(240,240,255,0.08)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

