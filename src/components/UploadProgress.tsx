import { UploadCloud } from "lucide-react";

interface UploadProgressProps {
  /** 0–100, or null before the upload starts. */
  percent: number | null;
  visible: boolean;
}

/**
 * Upload feedback for submissions carrying media. Video from a field handset
 * can take a while on a rural connection — a bare spinner reads as a hang.
 */
export default function UploadProgress({ percent, visible }: UploadProgressProps) {
  if (!visible) return null;

  const value = percent ?? 0;
  const done = value >= 100;

  return (
    <div
      className="rounded-sm border border-border bg-surface px-3 py-2.5"
      role="status"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <UploadCloud className="size-3.5" aria-hidden />
          {done ? "Processing" : "Uploading evidence"}
        </span>
        <span className="text-foreground">{value}%</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
