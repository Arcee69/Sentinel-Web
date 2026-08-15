import { MEDIA_LIMITS } from "./constants";
import type { MediaItem } from "./types";
import { STORES, idbDelete, idbGet, idbPut } from "./idb";

/**
 * Media capture helpers.
 *
 * Blobs live in IndexedDB so a queued report keeps its evidence across a
 * reload; the object URL is only a preview handle for the current session and
 * is rebuilt from the blob when a queued item is reopened.
 */

interface StoredMedia {
  id: string;
  blob: Blob;
  meta: Omit<MediaItem, "url">;
}

export interface MediaRejection {
  name: string;
  reason: string;
}

export interface MediaIntakeResult {
  accepted: MediaItem[];
  rejected: MediaRejection[];
}

function kindOf(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

/** Reads a video's duration without leaking the temporary object URL. */
function probeDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const done = (value?: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };

    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : undefined);
    video.onerror = () => done(undefined);
    video.src = url;
  });
}

/**
 * Validates picked files, persists them, and returns preview-ready items plus
 * a list of what was turned away and why.
 */
export async function intakeFiles(
  files: File[],
  existingCount: number,
): Promise<MediaIntakeResult> {
  const accepted: MediaItem[] = [];
  const rejected: MediaRejection[] = [];

  for (const file of files) {
    if (existingCount + accepted.length >= MEDIA_LIMITS.maxFiles) {
      rejected.push({ name: file.name, reason: `Limit is ${MEDIA_LIMITS.maxFiles} files` });
      continue;
    }

    const kind = kindOf(file);
    if (!kind) {
      rejected.push({ name: file.name, reason: "Only photos and videos" });
      continue;
    }

    const cap = kind === "image" ? MEDIA_LIMITS.maxImageBytes : MEDIA_LIMITS.maxVideoBytes;
    if (file.size > cap) {
      rejected.push({
        name: file.name,
        reason: `Over ${Math.round(cap / (1024 * 1024))}MB limit`,
      });
      continue;
    }

    const id = crypto.randomUUID();
    const duration = kind === "video" ? await probeDuration(file) : undefined;

    const meta: Omit<MediaItem, "url"> = {
      id,
      kind,
      name: file.name || `${kind}-${id.slice(0, 6)}`,
      size: file.size,
      mimeType: file.type,
      duration,
    };

    try {
      await idbPut<StoredMedia>(STORES.media, { id, blob: file, meta });
    } catch {
      // Storage failure shouldn't block the report — the preview URL still
      // works for an immediate online submit.
    }

    accepted.push({ ...meta, url: URL.createObjectURL(file) });
  }

  return { accepted, rejected };
}

/** Rebuilds a previewable item for media that was persisted earlier. */
export async function rehydrateMedia(id: string): Promise<MediaItem | null> {
  const stored = await idbGet<StoredMedia>(STORES.media, id);
  if (!stored) return null;
  return { ...stored.meta, url: URL.createObjectURL(stored.blob) };
}

export async function discardMedia(item: MediaItem): Promise<void> {
  URL.revokeObjectURL(item.url);
  try {
    await idbDelete(STORES.media, item.id);
  } catch {
    /* best effort */
  }
}

/** Frees preview URLs; call when a form unmounts. */
export function releasePreviews(items: MediaItem[]): void {
  for (const item of items) URL.revokeObjectURL(item.url);
}

/** Packs media into FormData for the eventual real upload endpoint. */
export async function toFormData(
  payload: Record<string, unknown>,
  media: MediaItem[],
): Promise<FormData> {
  const form = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    form.append(key, typeof value === "string" ? value : JSON.stringify(value));
  }

  for (const item of media) {
    const stored = await idbGet<StoredMedia>(STORES.media, item.id);
    if (stored) form.append("media", stored.blob, item.name);
  }

  return form;
}
