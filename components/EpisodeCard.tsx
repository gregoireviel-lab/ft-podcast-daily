"use client";

import type { Episode } from "@/types/episode";
import { formatDate, formatDuration } from "@/lib/format";

interface EpisodeCardProps {
  episode: Episode;
  isActive: boolean;
  isPlaying?: boolean;
  onSelect: (episode: Episode) => void;
  /** Whether this card's Top-10 accordion is currently open (list-level, single-open). */
  isExpanded?: boolean;
  /** Toggle this card's accordion open/closed. */
  onToggleExpand?: () => void;
}

export default function EpisodeCard({
  episode,
  isActive,
  isPlaying = false,
  onSelect,
  isExpanded = false,
  onToggleExpand,
}: EpisodeCardProps) {
  const highlights = episode.highlights ?? [];
  const hasHighlights = highlights.length > 0;
  const panelId = `highlights-${episode.id}`;

  return (
    <div
      className={`group rounded-xl border transition-[background-color,border-color] duration-200 ease-[var(--ease)] ${
        isActive
          ? "border-accent/30 bg-surface-hover"
          : "border-transparent bg-surface hover:border-white/5 hover:bg-surface-hover"
      }`}
    >
      <div className="flex items-stretch">
        {/* Main select area — tap to play. Distinct from the chevron zone. */}
        <button
          onClick={() => onSelect(episode)}
          aria-pressed={isActive}
          aria-label={`${isActive && isPlaying ? "En lecture" : "Lire"} : ${episode.title}`}
          className="flex min-w-0 flex-1 items-center gap-3.5 rounded-l-xl p-3.5 text-left transition-transform duration-200 ease-[var(--ease)] active:scale-[0.99] motion-reduce:active:scale-100"
        >
          {/* Artwork tile — play / equalizer affordance */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
              isActive
                ? "bg-accent text-accent-contrast"
                : "bg-white/[0.06] text-subtle group-hover:bg-accent/15 group-hover:text-accent"
            }`}
          >
            {isActive && isPlaying ? (
              <EqualizerBars />
            ) : (
              <svg className="h-[18px] w-[18px] translate-x-px" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[0.9375rem] font-semibold leading-snug transition-colors ${
                isActive ? "text-accent" : "text-fg"
              }`}
            >
              {episode.title}
            </p>
            <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-subtle">
              {episode.summary}
            </p>
            {/* Meta row — reads left-to-right, always AA-contrast */}
            <div className="mt-1.5 flex items-center gap-2 text-[0.6875rem] font-medium text-subtle">
              <span className="capitalize">{formatDate(episode.date)}</span>
              {episode.duration_sec > 0 && (
                <>
                  <span aria-hidden="true" className="text-white/20">
                    •
                  </span>
                  <span className="tabular-nums">{formatDuration(episode.duration_sec)}</span>
                </>
              )}
            </div>
          </div>
        </button>

        {/* Chevron — separate hit zone, toggles the Top-10 accordion. Only rendered
            when highlights exist (graceful: no chevron otherwise). */}
        {hasHighlights && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={`${isExpanded ? "Masquer" : "Afficher"} les ${highlights.length} temps forts : ${episode.title}`}
            className="flex w-11 shrink-0 items-center justify-center self-stretch rounded-r-xl text-subtle transition-colors hover:text-accent focus-visible:text-accent"
          >
            <svg
              className={`h-[18px] w-[18px] transition-transform duration-300 ease-[var(--ease)] ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Accordion panel — smooth height via the grid-rows 0fr→1fr trick; content
          stays clipped when collapsed. Reduced-motion snaps via the global media
          query in globals.css. */}
      {hasHighlights && (
        <div
          id={panelId}
          className={`grid transition-[grid-template-rows] duration-300 ease-[var(--ease)] ${
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden" aria-hidden={!isExpanded}>
            <div className="px-3.5 pb-3.5">
              <p className="mb-2.5 border-t border-hairline pt-3 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-subtle">
                Top {highlights.length}
              </p>
              <ol className="space-y-2">
                {highlights.map((h, i) => (
                  <li key={`${h.rank}-${i}`} className="flex gap-3">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/10 text-[0.6875rem] font-semibold tabular-nums text-accent">
                      {h.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] font-semibold leading-snug text-fg">
                        {h.title}
                      </p>
                      {h.blurb && (
                        <p className="mt-0.5 text-[0.75rem] leading-relaxed text-subtle">
                          {h.blurb}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Animated 3-bar equalizer shown on the currently-playing card. */
function EqualizerBars() {
  return (
    <span className="flex h-[18px] w-[18px] items-end justify-center gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-current motion-reduce:!h-2.5"
          style={{
            height: "60%",
            animation: `eq 0.9s ${i * 0.18}s ease-in-out infinite alternate`,
          }}
        />
      ))}
      <style>{`@keyframes eq{from{height:25%}to{height:95%}}`}</style>
    </span>
  );
}
