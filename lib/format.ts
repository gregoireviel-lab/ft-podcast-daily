/**
 * Pure formatting helpers — no React, no DOM — so they are unit-testable.
 */
import type { Episode, EpisodeSource, EpisodeHighlight } from "@/types/episode";

/**
 * Parse the (optional) `sources` column into a clean EpisodeSource[]. The
 * pipeline may store it as jsonb (array/object) or a JSON string. Anything
 * malformed degrades gracefully to an empty list. Only well-formed
 * `{ title, url }` entries survive.
 */
export function parseSources(raw: unknown): EpisodeSource[] {
  if (raw == null) return [];
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      value = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item): EpisodeSource | null => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const url = typeof o.url === "string" ? o.url.trim() : "";
      if (!url) return null;
      const title =
        typeof o.title === "string" && o.title.trim() ? o.title.trim() : url;
      return { title, url };
    })
    .filter((s): s is EpisodeSource => s !== null);
}

/**
 * Parse the (optional) `highlights` column into a clean EpisodeHighlight[]. The
 * pipeline stores it as jsonb (array of `{ rank, title, blurb }`) or a JSON
 * string. Anything malformed degrades gracefully to an empty list. Only entries
 * with a finite `rank` and a non-empty `title` survive, and the result is sorted
 * by `rank` ascending (defensive — the pipeline already stores them sorted).
 */
export function parseHighlights(raw: unknown): EpisodeHighlight[] {
  if (raw == null) return [];
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      value = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item): EpisodeHighlight | null => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const rank = Number(o.rank);
      if (!Number.isFinite(rank)) return null;
      const title = typeof o.title === "string" ? o.title.trim() : "";
      if (!title) return null;
      const blurb = typeof o.blurb === "string" ? o.blurb.trim() : "";
      return { rank, title, blurb };
    })
    .filter((h): h is EpisodeHighlight => h !== null)
    .sort((a, b) => a.rank - b.rank);
}

/**
 * Map a raw Neon row (loose shape) to a typed Episode. Kept here (pure, no
 * `server-only`) so it can be unit-tested. The HTTP driver returns DATE and
 * TIMESTAMPTZ as strings; `date` is normalised to plain YYYY-MM-DD.
 * `script`/`sources` are optional — mapped only when the pipeline provides them.
 */
export function mapEpisodeRow(row: Record<string, unknown>): Episode {
  const rawDate = String(row.date ?? "");
  const script =
    typeof row.script === "string" && row.script.trim() ? row.script : undefined;
  const sources = parseSources(row.sources);
  const highlights = parseHighlights(row.highlights);
  return {
    id: String(row.id ?? ""),
    date: rawDate.slice(0, 10),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    duration_sec: Number(row.duration_sec ?? 0),
    audio_url: String(row.audio_url ?? ""),
    created_at: String(row.created_at ?? ""),
    ...(script ? { script } : {}),
    ...(sources.length ? { sources } : {}),
    ...(highlights.length ? { highlights } : {}),
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
