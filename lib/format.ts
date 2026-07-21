/**
 * Pure formatting helpers — no React, no DOM — so they are unit-testable.
 */
import type { Episode } from "@/types/episode";

/**
 * Map a raw Neon row (loose shape) to a typed Episode. Kept here (pure, no
 * `server-only`) so it can be unit-tested. The HTTP driver returns DATE and
 * TIMESTAMPTZ as strings; `date` is normalised to plain YYYY-MM-DD.
 */
export function mapEpisodeRow(row: Record<string, unknown>): Episode {
  const rawDate = String(row.date ?? "");
  return {
    id: String(row.id ?? ""),
    date: rawDate.slice(0, 10),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    duration_sec: Number(row.duration_sec ?? 0),
    audio_url: String(row.audio_url ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

/** Seconds -> "m:ss" clock for the player (e.g. 305 -> "5:05"). */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Seconds -> compact human duration for cards (e.g. 305 -> "5m 5s"). */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m${s > 0 ? ` ${s}s` : ""}`;
}

/**
 * YYYY-MM-DD -> localized date string. Parses as noon UTC to avoid the
 * off-by-one-day timezone bug that midnight parsing causes.
 */
export function formatDate(
  dateStr: string,
  opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" },
  locale = "fr-FR"
): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(locale, opts);
}
