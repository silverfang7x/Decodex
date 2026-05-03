export interface SkeletonLoaderProps {
  rows?: number;
  className?: string;
  barClassName?: string;
}

const DEFAULT_WIDTHS = ["100%", "88%", "72%", "94%", "66%"];

export function SkeletonLoader({
  rows = 4,
  className = "",
  barClassName = "",
}: SkeletonLoaderProps) {
  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className={`h-3 overflow-hidden rounded-full bg-white/5 ${barClassName}`}
            style={{ width: DEFAULT_WIDTHS[index % DEFAULT_WIDTHS.length] }}
          >
            <div className="skeleton-shimmer h-full w-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 bg-[length:200%_100%]" />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes skeleton-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .skeleton-shimmer {
          animation: skeleton-shimmer 1.4s linear infinite;
        }
      `}</style>
    </>
  );
}

