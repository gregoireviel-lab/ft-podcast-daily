"use client";

import { useState } from "react";
import EpisodeCard from "./EpisodeCard";
import AudioPlayer from "./AudioPlayer";
import type { Episode } from "@/types/episode";

interface Props {
  episodes: Episode[];
  loadError?: boolean;
}

export default function EpisodeListClient({ episodes, loadError = false }: Props) {
  // Auto-select the most recent episode (but do NOT autoplay on load).
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(
    episodes.length > 0 ? episodes[0] : null
  );
  // Bumped on every explicit tap -> tells the player to start playing.
  const [playToken, setPlayToken] = useState(0);

  const handleSelect = (episode: Episode) => {
    setActiveEpisode(episode);
    setPlayToken((t) => t + 1); // tap-to-play
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 px-4">
        <svg className="w-12 h-12 text-[#535353]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-[#b3b3b3] text-sm text-center">
          Impossible de charger les épisodes pour le moment.
        </p>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 px-4">
        <svg className="w-12 h-12 text-[#535353]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <p className="text-[#b3b3b3] text-sm text-center">Aucun épisode disponible pour l&apos;instant.</p>
        <p className="text-[#535353] text-xs text-center">Le pipeline local génère un épisode chaque matin à 7h.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 pb-28">
        {episodes.map((episode) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            isActive={activeEpisode?.id === episode.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <AudioPlayer episode={activeEpisode} playToken={playToken} />
    </>
  );
}
