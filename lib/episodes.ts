import "server-only";
import { getSql } from "./db";
import { mapEpisodeRow as mapRow } from "./format";
import type { Episode } from "@/types/episode";

/**
 * Fetch the N most recent episodes from Neon, newest first.
 * Same signature as the previous Firestore implementation.
 *
 * NOTE (COS-0064 / COS-0068 / COS-0087): the `script` (text), `sources` (jsonb)
 * and `highlights` (jsonb) columns are selected below. `mapEpisodeRow` maps them
 * all defensively (empty/absent -> omitted), so rows without them degrade
 * gracefully with zero further changes.
 */
export async function getEpisodes(maxResults = 30): Promise<Episode[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, date, title, summary, duration_sec, audio_url, created_at, script, sources, highlights
    FROM episodes
    ORDER BY date DESC
    LIMIT ${maxResults}
  `;
  return rows.map(mapRow);
}

/**
 * Fetch a single episode by id (date string, e.g. "2026-07-21"). Null if absent.
 */
export async function getEpisodeById(id: string): Promise<Episode | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, date, title, summary, duration_sec, audio_url, created_at, script, sources, highlights
    FROM episodes
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows.length ? mapRow(rows[0]) : null;
}
