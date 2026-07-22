"use client";

import Link from "next/link";
import type { Episode } from "@/types/episode";
import { formatDate, formatDuration } from "@/lib/format";
import ShareWhatsApp from "@/components/ShareWhatsApp";

interface EpisodeCardProps {
  episode: Episode;
  isActive: boolean;
  isPlaying?: boolean;
  onSelect: (episode: Episode) => void;
}

/**
 * Two distinct affordances, Spotify-style:
 * - the artwork tile plays the episode inline (mini-player),
 * - the title/summary block links to the full episode page (script, Top-10,
 *   sources). Share stays as the rightmost icon.
 */
export default function EpisodeCard({
  episode,
  isActive,
  isPlaying = false,
  onSelect,
}: EpisodeCardProps) {
  return (
    <div
      className={`group flex items-stretch rounded-xl border transition-[background-color,border-color] duration-200 ease-[var(--ease)] ${
        isActive
          ? "border-accent/30 bg-surface-hover"
          : "border-transparent bg-surface hover:border-white/5 hover:bg-surface-hover"
      }`}
    >
      {/* Play / pause — artwork tile */}
      <button
        onClick={() => onSelect(episode)}
        aria-pressed={isActive}
        aria-label={`${isActive && isPlaying ? "En lecture" : "Lire"} : ${episode.title}`}
        className="flex shrink-0 items-center rounded-l-xl py-3.5 pl-3.5 transition-transform duration-200 ease-[var(--ease)] active:scale-95 motion-reduce:active:scale-100"
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-200 ${
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
      </button>

      {/* Title + summary — links to the full episode page */}
      <Link
        href={`/episode/${episode.id}`}
        aria-label={`Ouvrir : ${episode.title}`}
        className="flex min-w-0 flex-1 flex-col justify-center py-3.5 pl-3.5 pr-1"
      >
        <p
          className={`truncate text-[0.9375rem] font-semibold leading-snug transition-colors ${
            isActive ? "text-accent" : "text-fg group-hover:text-fg"
          }`}
        >
          {episode.title}
        </p>
        <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-subtle">
          {episode.summary}
        </p>
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
          <span aria-hidden="true" className="text-white/20">
            •
          </span>
          <span className="inline-flex items-center gap-0.5 text-muted transition-colors group-hover:text-accent">
            Détails
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>

      {/* Share to WhatsApp — rightmost hit-zone (growth loop). */}
      <ShareWhatsApp
        episodeId={episode.id}
        title={episode.title}
        variant="icon"
        className="rounded-r-xl"
      />
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
