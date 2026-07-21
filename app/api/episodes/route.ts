import { NextResponse } from "next/server";
import { getEpisodes } from "@/lib/episodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/episodes
 * Returns the N most recent episodes from Firestore.
 * Query param: ?limit=30 (default 30)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);

  try {
    const episodes = await getEpisodes(limit);
    return NextResponse.json({ episodes, count: episodes.length });
  } catch (err) {
    console.error("[GET /api/episodes]", err);
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}
