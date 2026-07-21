# Agent notes — FT Daily Podcast (front)

- **Stack (aligned on Greg's default):** Next.js **15** (App Router) + React 19 +
  TypeScript + Tailwind CSS v4 + pnpm. (Downgraded from a scaffolded Next 16.)
- **Data:** Neon Postgres, read **server-side only** via `lib/episodes.ts`
  (`DATABASE_URL`, never `NEXT_PUBLIC_`). No Firebase.
- **Audio:** public MP3s on Vercel Blob, streamed by `<audio>`.
- Home + episode pages are prerendered (SSG) and refreshed via ISR
  (`export const revalidate`). No client-side data fetching, no `/api/episodes`.
- Pure helpers live in `lib/format.ts` (unit-tested in `tests/`).
