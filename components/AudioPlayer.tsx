"use client";

import { useRef, useState, useEffect } from "react";
import type { Episode } from "@/types/episode";

interface AudioPlayerProps {
  episode: Episode | null;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ episode }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Reset player when episode changes
  useEffect(() => {
    if (!episode) return;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(episode.duration_sec || 0);
    setIsLoading(true);

    const audio = audioRef.current;
    if (!audio) return;

    audio.src = episode.audio_url;
    audio.load();
  }, [episode?.id]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !episode) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;

    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!episode) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] h-[72px] flex items-center justify-center">
        <p className="text-[#727272] text-sm">Sélectionne un épisode pour écouter</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] px-4 py-3 z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Episode info */}
      <div className="flex items-center gap-3 mb-2 max-w-2xl mx-auto">
        {/* Podcast cover */}
        <div className="w-10 h-10 rounded bg-[#1DB954] flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a9 9 0 0 1 9 9v7a3 3 0 0 1-3 3h-1v-8h2V10A8 8 0 0 0 4 10v2h2v8H5a3 3 0 0 1-3-3v-7a9 9 0 0 1 9-9Z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{episode.title}</p>
          <p className="text-[#b3b3b3] text-xs">
            {new Date(episode.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <svg className="w-4 h-4 text-black animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 max-w-2xl mx-auto">
        <span className="text-[#727272] text-xs w-9 text-right tabular-nums">{formatTime(currentTime)}</span>
        <div
          ref={progressRef}
          className="flex-1 h-1 bg-[#535353] rounded-full cursor-pointer group relative"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-[#1DB954] rounded-full relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <span className="text-[#727272] text-xs w-9 tabular-nums">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
