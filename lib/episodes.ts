import "server-only";
import { getSql } from "./db";
import { mapEpisodeRow as mapRow } from "./format";
import type { Episode } from "@/types/episode";

/**
 * Fetch the N most recent episodes from Neon, newest first.
 * Same signature as the previous Firestore implementation.
 */
export async function getEpisodes(maxResults = 30): Promise<Episode[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, date, title, summary, duration_sec, audio_url, created_at
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
    SELECT id, date, title, summary, duration_sec, audio_url, created_at
    FROM episodes
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows.length ? mapRow(rows[0]) : null;
}
