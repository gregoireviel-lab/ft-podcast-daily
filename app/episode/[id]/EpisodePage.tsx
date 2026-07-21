"use client";

import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import { formatDate } from "@/lib/format";
import type { Episode } from "@/types/episode";

interface Props {
  episode: Episode;
}

export default function EpisodeDetail({ episode }: Props) {
  return (
    <main className="min-h-screen bg-[#121212] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a2a1a] to-[#121212] px-4 pt-8 pb-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[#b3b3b3] text-sm hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Tous les épisodes
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-[#1DB954] flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 1a9 9 0 0 1 9 9v7a3 3 0 0 1-3 3h-1v-8h2V10A8 8 0 0 0 4 10v2h2v8H5a3 3 0 0 1-3-3v-7a9 9 0 0 1 9-9Z" />
              </svg>
            </div>
            <div>
              <p className="text-[#b3b3b3] text-xs uppercase tracking-widest mb-1">FT Daily Podcast</p>
              <h1 className="text-xl font-bold text-white leading-tight">{episode.title}</h1>
              <p className="text-[#b3b3b3] text-sm mt-1 capitalize">
                {formatDate(episode.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {episode.summary && (
        <div className="max-w-2xl mx-auto px-4 mb-6">
          <h2 className="text-[#b3b3b3] text-xs font-semibold uppercase tracking-widest mb-2">
            Résumé
          </h2>
          <p className="text-[#e0e0e0] text-sm leading-relaxed">{episode.summary}</p>
        </div>
      )}

      {/* Player (autoplay on load of a dedicated episode page) */}
      <AudioPlayer episode={episode} playToken={1} />
    </main>
  );
}
