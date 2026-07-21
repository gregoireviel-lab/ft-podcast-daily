"use client";

import { useState } from "react";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import { BrandGlyph } from "@/components/BrandMark";
import { formatDate, formatDuration } from "@/lib/format";
import type { Episode } from "@/types/episode";

interface Props {
  episode: Episode;
}

export default function EpisodeDetail({ episode }: Props) {
  return (
    <main className="min-h-screen bg-bg pb-[calc(9rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(120% 100% at 15% 0%, rgba(255,178,122,0.10), transparent 55%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-7">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Tous les épisodes
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-contrast shadow-lg shadow-black/30">
              <BrandGlyph className="h-9 w-9" />
            </div>
            <div className="min-w-0">
              <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
                FT Daily Podcast
              </p>
              <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-fg">
                {episode.title}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-subtle">
                <span className="capitalize">
                  {formatDate(episode.date, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {episode.duration_sec > 0 && (
                  <>
                    <span aria-hidden="true" className="text-white/20">
                      •
                    </span>
                    <span className="tabular-nums">{formatDuration(episode.duration_sec)}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-5">
        {/* Summary */}
        {episode.summary && (
          <section>
            <SectionLabel>Résumé</SectionLabel>
            <p className="text-[0.9375rem] leading-relaxed text-muted">{episode.summary}</p>
          </section>
        )}

        {/* Full script (COS-0064) — collapsible, comfortable reading type */}
        {episode.script && <ScriptSection script={episode.script} />}

        {/* Sources (COS-0068) — clickable article links */}
        {episode.sources && episode.sources.length > 0 && (
          <section>
            <SectionLabel>Sources ({episode.sources.length})</SectionLabel>
            <ul className="space-y-1.5">
              {episode.sources.map((s, i) => (
                <li key={`${s.url}-${i}`}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-transparent bg-surface px-4 py-3 transition-colors hover:border-white/5 hover:bg-surface-hover"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-subtle transition-colors group-hover:bg-accent/15 group-hover:text-accent">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg group-hover:text-accent">
                      {s.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Player (autoplay on load of a dedicated episode page) */}
      <AudioPlayer episode={episode} playToken={1} />
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
      {children}
    </h2>
  );
}

/** Collapsible full narration script with an editorial reading layout. */
function ScriptSection({ script }: { script: string }) {
  const [open, setOpen] = useState(false);
  const paragraphs = script.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-hairline bg-surface/60 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
            Script complet
          </span>
        </span>
        <svg
          className={`h-5 w-5 text-subtle transition-transform duration-300 ease-[var(--ease)] ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="animate-rise pt-4">
          <article className="space-y-4 font-serif text-[1.0625rem] leading-[1.75] text-muted">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
        </div>
      )}
    </section>
  );
}
