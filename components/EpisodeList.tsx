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
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSelect = (episode: Episode) => {
    setActiveEpisode(episode);
    setPlayToken((t) => t + 1); // tap-to-play
  };

  if (loadError) {
    return (
      <EmptyState
        title="Épisodes momentanément indisponibles"
        body="La connexion aux épisodes a échoué. Reviens dans un instant — la page se rafraîchit automatiquement."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        }
      />
    );
  }

  if (episodes.length === 0) {
    return (
      <EmptyState
        title="Le premier épisode arrive bientôt"
        body="Un nouveau briefing est généré chaque matin à 7h. Repasse un peu plus tard pour ta première écoute."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        }
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        {episodes.map((episode, i) => (
          <li
            key={episode.id}
            className="animate-rise"
            style={{ animationDelay: `${Math.min(i * 45, 360)}ms` }}
          >
            <EpisodeCard
              episode={episode}
              isActive={activeEpisode?.id === episode.id}
              isPlaying={isPlaying}
              onSelect={handleSelect}
            />
          </li>
        ))}
      </ul>

      <AudioPlayer
        episode={activeEpisode}
        playToken={playToken}
        onPlayingChange={setIsPlaying}
      />
    </>
  );
}

function EmptyState({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-hairline bg-surface/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          {icon}
        </svg>
      </div>
      <div className="space-y-1.5">
        <p className="text-[0.9375rem] font-semibold text-fg">{title}</p>
        <p className="mx-auto max-w-xs text-[0.8125rem] leading-relaxed text-subtle">{body}</p>
      </div>
    </div>
  );
}
