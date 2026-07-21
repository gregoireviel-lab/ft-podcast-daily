"use client";

import type { Episode } from "@/types/episode";
import { formatDate, formatDuration } from "@/lib/format";

interface EpisodeCardProps {
  episode: Episode;
  isActive: boolean;
  isPlaying?: boolean;
  onSelect: (episode: Episode) => void;
}

export default function EpisodeCard({
  episode,
  isActive,
  isPlaying = false,
  onSelect,
}: EpisodeCardProps) {
  return (
    <button
      onClick={() => onSelect(episode)}
      aria-pressed={isActive}
      aria-label={`${isActive && isPlaying ? "En lecture" : "Lire"} : ${episode.title}`}
      className={`group w-full rounded-xl border p-3.5 text-left transition-[background-color,border-color,transform] duration-200 ease-[var(--ease)] active:scale-[0.99] motion-reduce:active:scale-100 ${
        isActive
          ? "border-accent/30 bg-surface-hover"
          : "border-transparent bg-surface hover:border-white/5 hover:bg-surface-hover"
      }`}
    >
      <div className="flex items-center gap-3.5">
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
      </div>
    </button>
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
