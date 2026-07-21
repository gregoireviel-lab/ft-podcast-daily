"use client";

import type { Episode } from "@/types/episode";

interface EpisodeCardProps {
  episode: Episode;
  isActive: boolean;
  onSelect: (episode: Episode) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s > 0 ? ` ${s}s` : ""}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function EpisodeCard({ episode, isActive, onSelect }: EpisodeCardProps) {
  return (
    <button
      onClick={() => onSelect(episode)}
      className={`w-full text-left p-4 rounded-lg transition-colors group ${
        isActive
          ? "bg-[#282828] border border-[#1DB954]/30"
          : "bg-[#181818] hover:bg-[#282828] border border-transparent"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Episode number / play icon */}
        <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${
          isActive ? "bg-[#1DB954]" : "bg-[#3E3E3E] group-hover:bg-[#1DB954]/20"
        }`}>
          {isActive ? (
            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[#727272] group-hover:text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? "text-[#1DB954]" : "text-white"}`}>
            {episode.title}
          </p>
          <p className="text-[#b3b3b3] text-xs mt-0.5 line-clamp-2 leading-relaxed">
            {episode.summary}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
          <span className="text-[#727272] text-xs">{formatDate(episode.date)}</span>
          {episode.duration_sec > 0 && (
            <span className="text-[#727272] text-xs">{formatDuration(episode.duration_sec)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
