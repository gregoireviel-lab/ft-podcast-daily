// Lightweight assertion tests (no framework) — run with: pnpm test
import { formatTime, formatDuration, formatDate, mapEpisodeRow } from "../lib/format";

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}`);
  }
}
function eq(name: string, got: unknown, want: unknown) {
  assert(`${name} (got ${JSON.stringify(got)})`, got === want);
}

// --- formatTime ---
eq("formatTime 0", formatTime(0), "0:00");
eq("formatTime 5", formatTime(5), "0:05");
eq("formatTime 65", formatTime(65), "1:05");
eq("formatTime 305", formatTime(305), "5:05");
eq("formatTime 3599", formatTime(3599), "59:59");
eq("formatTime NaN", formatTime(NaN), "0:00");
eq("formatTime Infinity", formatTime(Infinity), "0:00");
eq("formatTime negative", formatTime(-10), "0:00");

// --- formatDuration ---
eq("formatDuration 0", formatDuration(0), "");
eq("formatDuration 45", formatDuration(45), "45s");
eq("formatDuration 60", formatDuration(60), "1m");
eq("formatDuration 305", formatDuration(305), "5m 5s");

// --- formatDate (noon-UTC parsing avoids off-by-one) ---
eq(
  "formatDate en full",
  formatDate("2026-07-20", { day: "numeric", month: "long", year: "numeric" }, "en-GB"),
  "20 July 2026"
);
eq("formatDate invalid passthrough", formatDate("not-a-date"), "not-a-date");

// --- mapEpisodeRow ---
const row = {
  id: "2026-07-20",
  date: "2026-07-20T00:00:00.000Z",
  title: "Test",
  summary: "A summary",
  duration_sec: "312", // driver may hand back a string
  audio_url: "https://blob/x.mp3",
  created_at: "2026-07-20T05:00:00.000Z",
};
const mapped = mapEpisodeRow(row);
eq("mapEpisodeRow date normalised", mapped.date, "2026-07-20");
eq("mapEpisodeRow duration coerced to number", mapped.duration_sec, 312);
assert("mapEpisodeRow duration is number type", typeof mapped.duration_sec === "number");
eq("mapEpisodeRow title", mapped.title, "Test");
// Missing fields must not throw and default safely.
const partial = mapEpisodeRow({ id: "x", date: "2026-01-01" });
eq("mapEpisodeRow missing summary -> ''", partial.summary, "");
eq("mapEpisodeRow missing duration -> 0", partial.duration_sec, 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
