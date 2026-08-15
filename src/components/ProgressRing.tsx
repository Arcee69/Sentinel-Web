interface ProgressRingProps {
  /** 0–100. */
  value: number;
  label: string;
  size?: number;
}

/** Circular completion gauge used for the daily task quota. */
export default function ProgressRing({ value, label, size = 80 }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="6"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold leading-none">{clamped}%</span>
        <span className="font-mono text-[8px] uppercase text-muted-foreground">{label}</span>
      </div>
      <span className="sr-only">{`${clamped}% ${label}`}</span>
    </div>
  );
}
