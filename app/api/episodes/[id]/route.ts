import { NextResponse } from "next/server";
import { getEpisodeById } from "@/lib/episodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/episodes/[id]
 * Returns a single episode by its ID (date string, e.g. "2026-07-21").
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const episode = await getEpisodeById(id);
    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }
    return NextResponse.json({ episode });
  } catch (err) {
    console.error(`[GET /api/episodes/${id}]`, err);
    return NextResponse.json(
      { error: "Failed to fetch episode" },
      { status: 500 }
    );
  }
}
