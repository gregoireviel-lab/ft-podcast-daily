"use client";

import { useState, useEffect } from "react";
import { getEpisodes } from "@/lib/episodes";
import EpisodeCard from "./EpisodeCard";
import AudioPlayer from "./AudioPlayer";
import type { Episode } from "@/types/episode";

export default function EpisodeList() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEpisodes() {
      try {
        const data = await getEpisodes(30);
        setEpisodes(data);
        // Auto-select the most recent episode
        if (data.length > 0) {
          setActiveEpisode(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch episodes:", err);
        setError("Impossible de charger les épisodes. Vérifie la configuration Firebase.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEpisodes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#727272] text-sm">Chargement des épisodes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 px-4">
        <svg className="w-12 h-12 text-[#535353]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-[#b3b3b3] text-sm text-center">{error}</p>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 px-4">
        <svg className="w-12 h-12 text-[#535353]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <p className="text-[#b3b3b3] text-sm text-center">Aucun épisode disponible pour l'instant.</p>
        <p className="text-[#535353] text-xs text-center">Le pipeline local génère un épisode chaque matin à 7h.</p>
      </div>
    );
  }

  return (
    <>
      {/* Episode list */}
      <div className="flex flex-col gap-2 pb-24">
        {episodes.map((episode) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            isActive={activeEpisode?.id === episode.id}
            onSelect={setActiveEpisode}
          />
        ))}
      </div>

      {/* Sticky audio player */}
      <AudioPlayer episode={activeEpisode} />
    </>
  );
}
