// Lightweight assertion tests (no framework) — run with: pnpm test
import {
  formatTime,
  formatDuration,
  formatDate,
  mapEpisodeRow,
  parseHighlights,
} from "../lib/format";

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
// Optional script/sources absent by default (columns not yet in DB).
assert("mapEpisodeRow no script by default", partial.script === undefined);
assert("mapEpisodeRow no sources by default", partial.sources === undefined);
assert("mapEpisodeRow no highlights by default", partial.highlights === undefined);

// --- optional script + sources (COS-0064 / COS-0068) ---
const enriched = mapEpisodeRow({
  id: "y",
  date: "2026-02-02",
  script: "  Full narration.  ",
  sources: [
    { title: "FT article", url: "https://ft.com/a" },
    { url: "https://ft.com/b" }, // title defaults to url
    { title: "bad", url: "" }, // dropped (no url)
    "garbage", // dropped
  ],
});
eq("mapEpisodeRow keeps script", enriched.script, "  Full narration.  ");
eq("mapEpisodeRow sources length (invalid dropped)", enriched.sources?.length, 2);
eq("mapEpisodeRow source title kept", enriched.sources?.[0].title, "FT article");
eq("mapEpisodeRow source title defaults to url", enriched.sources?.[1].title, "https://ft.com/b");

// sources may arrive as a JSON string (jsonb serialised)
const fromString = mapEpisodeRow({
  id: "z",
  date: "2026-03-03",
  sources: '[{"title":"S","url":"https://x.com"}]',
});
eq("parseSources from JSON string", fromString.sources?.[0].url, "https://x.com");
// blank / malformed script + sources degrade to undefined
const blank = mapEpisodeRow({ id: "w", date: "2026-04-04", script: "   ", sources: "not json" });
assert("blank script -> undefined", blank.script === undefined);
assert("malformed sources -> undefined", blank.sources === undefined);

// --- highlights (COS-0087) ---
// Well-formed, out-of-order input is sorted by rank ascending.
const hl = parseHighlights([
  { rank: 2, title: "Second", blurb: "b2" },
  { rank: 1, title: "First", blurb: "b1" },
  { rank: 3, title: "Third", blurb: "b3" },
]);
eq("parseHighlights length", hl.length, 3);
eq("parseHighlights sorted rank[0]", hl[0].rank, 1);
eq("parseHighlights sorted title[0]", hl[0].title, "First");
eq("parseHighlights sorted rank[2]", hl[2].rank, 3);

// Malformed entries are dropped; rank strings are coerced; blank titles rejected.
const hlDirty = parseHighlights([
  { rank: "1", title: "  Coerced rank  ", blurb: "  trimmed  " }, // rank "1" -> 1, trimmed
  { rank: 2, title: "", blurb: "no title" }, // dropped (blank title)
  { rank: 3 }, // dropped (no title)
  { title: "no rank", blurb: "x" }, // dropped (NaN rank)
  "garbage", // dropped
  null, // dropped
]);
eq("parseHighlights drops invalid", hlDirty.length, 1);
eq("parseHighlights coerces rank", hlDirty[0].rank, 1);
eq("parseHighlights trims title", hlDirty[0].title, "Coerced rank");
eq("parseHighlights trims blurb", hlDirty[0].blurb, "trimmed");

// Missing blurb degrades to empty string, entry still kept.
const hlNoBlurb = parseHighlights([{ rank: 1, title: "Only title" }]);
eq("parseHighlights missing blurb -> ''", hlNoBlurb[0].blurb, "");

// null / non-array / JSON string handling.
eq("parseHighlights null -> []", parseHighlights(null).length, 0);
eq("parseHighlights non-array -> []", parseHighlights({ rank: 1 }).length, 0);
eq("parseHighlights bad json string -> []", parseHighlights("not json").length, 0);
const hlFromString = parseHighlights('[{"rank":1,"title":"S","blurb":"b"}]');
eq("parseHighlights from JSON string", hlFromString[0].title, "S");

// mapEpisodeRow wires highlights through and omits when empty.
const withHl = mapEpisodeRow({
  id: "h",
  date: "2026-05-05",
  highlights: [{ rank: 1, title: "News", blurb: "blurb" }],
});
eq("mapEpisodeRow highlights length", withHl.highlights?.length, 1);
const emptyHl = mapEpisodeRow({ id: "h2", date: "2026-05-06", highlights: [] });
assert("mapEpisodeRow empty highlights -> undefined", emptyHl.highlights === undefined);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
