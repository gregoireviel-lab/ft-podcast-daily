import { neon } from "@neondatabase/serverless";

/**
 * Server-only Neon client. DATABASE_URL is a server secret (never NEXT_PUBLIC_),
 * so episode reads happen in Server Components / route handlers, never in the
 * browser. This replaces the old Firebase client SDK.
 */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — cannot reach Neon");
  }
  return neon(url);
}
