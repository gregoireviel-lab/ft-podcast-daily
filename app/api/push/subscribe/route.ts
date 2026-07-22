import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

// Node runtime — Neon serverless driver + secret DATABASE_URL live server-side.
export const runtime = "nodejs";

/**
 * Store a Web Push subscription so the local pipeline can notify this device
 * when a new episode publishes. Upsert on endpoint (idempotent re-subscribe).
 */
export async function POST(req: Request) {
  try {
    const sub = await req.json().catch(() => null);
    const endpoint: string | undefined = sub?.endpoint;
    const p256dh: string | undefined = sub?.keys?.p256dh;
    const auth: string | undefined = sub?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
    }

    const sql = getSql();
    await sql`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth)
      VALUES (${endpoint}, ${p256dh}, ${auth})
      ON CONFLICT (endpoint) DO UPDATE
        SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe] failed:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
