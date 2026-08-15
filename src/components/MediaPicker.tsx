import { useEffect, useRef, useState } from "react";
import { Camera, Film, Play, Video, X } from "lucide-react";
import { toast } from "sonner";
import { MEDIA_LIMITS } from "../lib/constants";
import { discardMedia, intakeFiles, releasePreviews } from "../lib/media";
import { cn, formatBytes, formatDuration } from "../lib/format";
import type { MediaItem } from "../lib/types";

interface MediaPickerProps {
  value: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  label?: string;
  hint?: string;
}

/**
 * Photo and video evidence capture.
 *
 * Two inputs rather than one: on mobile, `capture="environment"` opens the
 * camera directly in the right mode, which matters when an agent is
 * documenting something time-sensitive. Both also accept gallery picks.
 */
export default function MediaPicker({
  value,
  onChange,
  label = "Evidence",
  hint,
}: MediaPickerProps) {
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<MediaItem | null>(null);

  // Track the current selection so unmount can release exactly what's live.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  useEffect(() => () => releasePreviews(latest.current), []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;

    setBusy(true);
    try {
      const { accepted, rejected } = await intakeFiles(Array.from(fileList), value.length);
      if (accepted.length) onChange([...value, ...accepted]);
      for (const item of rejected) toast.error(`${item.name}: ${item.reason}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: MediaItem) => {
    onChange(value.filter((m) => m.id !== item.id));
    await discardMedia(item);
  };

  const full = value.length >= MEDIA_LIMITS.maxFiles;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {value.length}/{MEDIA_LIMITS.maxFiles}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <CaptureButton
          icon={<Camera className="size-4" aria-hidden />}
          label="Photo"
          disabled={full || busy}
          onClick={() => photoInput.current?.click()}
        />
        <CaptureButton
          icon={<Video className="size-4" aria-hidden />}
          label="Video"
          disabled={full || busy}
          onClick={() => videoInput.current?.click()}
        />
      </div>

      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="sr-only"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/*"
        capture="environment"
        multiple
        className="sr-only"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {value.map((item) => (
            <li key={item.id} className="relative">
              <button
                type="button"
                onClick={() => setPreview(item)}
                className="block aspect-square w-full overflow-hidden rounded-sm border border-border bg-muted"
                aria-label={`Preview ${item.name}`}
              >
                {item.kind === "image" ? (
                  <img
                    src={item.url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                    <Film className="size-5" aria-hidden />
                    <span className="font-mono text-[9px]">
                      {item.duration ? formatDuration(item.duration) : "VIDEO"}
                    </span>
                  </span>
                )}
              </button>

              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-console/75 px-1 py-0.5 font-mono text-[8px] text-console-foreground">
                {formatBytes(item.size)}
              </span>

              <button
                type="button"
                onClick={() => void remove(item)}
                aria-label={`Remove ${item.name}`}
                className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-sm hover:text-destructive"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {preview && <PreviewOverlay item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function CaptureButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-surface py-3",
        "font-mono text-[11px] font-bold uppercase tracking-widest text-foreground",
        "hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PreviewOverlay({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${item.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <X className="size-5" aria-hidden />
      </button>

      <div className="max-h-full w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {item.kind === "image" ? (
          <img src={item.url} alt={item.name} className="max-h-[75vh] w-full object-contain" />
        ) : (
          <video
            src={item.url}
            controls
            playsInline
            className="max-h-[75vh] w-full rounded-sm bg-black"
          >
            <track kind="captions" />
          </video>
        )}
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-white/70">
          {item.kind === "video" && <Play className="mr-1 inline size-3" aria-hidden />}
          {item.name} · {formatBytes(item.size)}
        </p>
      </div>
    </div>
  );
}
