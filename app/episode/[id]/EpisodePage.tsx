"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEpisodeById } from "@/lib/episodes";
import AudioPlayer from "@/components/AudioPlayer";
import type { Episode } from "@/types/episode";

interface Props {
  episodeId: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EpisodePage({ episodeId }: Props) {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEpisodeById(episodeId)
      .then((ep) => {
        if (!ep) setError("Épisode introuvable.");
        else setEpisode(ep);
      })
      .catch(() => setError("Impossible de charger l'épisode."))
      .finally(() => setIsLoading(false));
  }, [episodeId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !episode) {
    return (
      <main className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[#b3b3b3] text-sm">{error ?? "Épisode non trouvé."}</p>
        <Link href="/" className="text-[#1DB954] text-sm hover:underline">
          ← Retour à la liste
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a2a1a] to-[#121212] px-4 pt-8 pb-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[#b3b3b3] text-sm hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Tous les épisodes
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-[#1DB954] flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a9 9 0 0 1 9 9v7a3 3 0 0 1-3 3h-1v-8h2V10A8 8 0 0 0 4 10v2h2v8H5a3 3 0 0 1-3-3v-7a9 9 0 0 1 9-9Z" />
              </svg>
            </div>
            <div>
              <p className="text-[#b3b3b3] text-xs uppercase tracking-widest mb-1">FT Daily Podcast</p>
              <h1 className="text-xl font-bold text-white leading-tight">{episode.title}</h1>
              <p className="text-[#b3b3b3] text-sm mt-1 capitalize">{formatDate(episode.date)}</p>
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

      {/* Player */}
      <AudioPlayer episode={episode} />
    </main>
  );
}
