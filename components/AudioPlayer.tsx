"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { Episode } from "@/types/episode";
import { formatTime, formatDate } from "@/lib/format";

interface AudioPlayerProps {
  episode: Episode | null;
  /** Increments each time the user explicitly taps a card -> trigger autoplay. */
  playToken?: number;
}

const SPEEDS = [1, 1.25, 1.5, 2] as const;
const SKIP = 15;
const posKey = (id: string) => `ftpod:pos:${id}`;

export default function AudioPlayer({ episode, playToken = 0 }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speedIdx, setSpeedIdx] = useState(0);

  // Persist playback position (resume where you left off), throttled to ~5s.
  const lastSavedRef = useRef(0);
  const savePosition = useCallback(
    (t: number) => {
      if (!episode) return;
      try {
        if (t > 3) localStorage.setItem(posKey(episode.id), String(Math.floor(t)));
      } catch {
        /* localStorage may be unavailable (private mode) — ignore */
      }
    },
    [episode]
  );

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(
      Math.max(0, audio.currentTime + delta),
      audio.duration || Infinity
    );
  }, []);

  // --- Load a new episode -------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !episode) return;

    setError(null);
    setCurrentTime(0);
    setDuration(episode.duration_sec || 0);
    setIsBuffering(true);

    audio.src = episode.audio_url;
    audio.playbackRate = SPEEDS[speedIdx];
    audio.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode?.id]);

  // --- Autoplay on explicit tap ------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !episode || playToken === 0) return;
    audio.play().catch(() => {
      /* user gesture required — leave paused, no hard error */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken]);

  // --- Media Session (lock screen / headset controls) --------------------
  useEffect(() => {
    if (!episode || typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: episode.title,
      artist: "FT Daily Podcast",
      album: formatDate(episode.date, { day: "numeric", month: "long", year: "numeric" }),
    });
    const audio = audioRef.current;
    const set = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
    set("play", () => audio?.play());
    set("pause", () => audio?.pause());
    set("seekbackward", () => skip(-SKIP));
    set("seekforward", () => skip(SKIP));
    set("seekto", (d) => {
      if (audio && d.seekTime != null) audio.currentTime = d.seekTime;
    });
    return () => {
      (["play", "pause", "seekbackward", "seekforward", "seekto"] as MediaSessionAction[]).forEach(
        (a) => {
          try {
            set(a, null);
          } catch {
            /* ignore */
          }
        }
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode?.id, skip]);

  // Save position on unmount / tab close.
  useEffect(() => {
    const handler = () => savePosition(audioRef.current?.currentTime ?? 0);
    window.addEventListener("pagehide", handler);
    return () => {
      handler();
      window.removeEventListener("pagehide", handler);
    };
  }, [savePosition]);

  // --- Controls -----------------------------------------------------------
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !episode) return;
    if (audio.paused) audio.play().catch(() => setError("Lecture impossible"));
    else audio.pause();
  };

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const seekTo = (t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    setCurrentTime(t);
  };

  // --- <audio> events drive state (never optimistic) ----------------------
  const onLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
    setIsBuffering(false);
    try {
      const saved = episode && localStorage.getItem(posKey(episode.id));
      if (saved) {
        const t = parseInt(saved, 10);
        if (t > 0 && t < audio.duration - 2) audio.currentTime = t;
      }
    } catch {
      /* ignore */
    }
  };

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.currentTime - lastSavedRef.current > 5) {
      lastSavedRef.current = audio.currentTime;
      savePosition(audio.currentTime);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (episode) {
      try {
        localStorage.removeItem(posKey(episode.id));
      } catch {
        /* ignore */
      }
    }
  };

  const onError = () => {
    setIsBuffering(false);
    setIsPlaying(false);
    setError("Impossible de lire l'audio. Réessaie plus tard.");
  };

  if (!episode) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] h-[72px] flex items-center justify-center">
        <p className="text-[#727272] text-sm">Sélectionne un épisode pour écouter</p>
      </div>
    );
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] px-4 py-3 z-50">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
          setError(null);
        }}
        onWaiting={() => setIsBuffering(true)}
        onEnded={onEnded}
        onError={onError}
      />

      <div className="flex items-center gap-3 mb-2 max-w-2xl mx-auto">
        <div className="w-10 h-10 rounded bg-[#1DB954] flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 1a9 9 0 0 1 9 9v7a3 3 0 0 1-3 3h-1v-8h2V10A8 8 0 0 0 4 10v2h2v8H5a3 3 0 0 1-3-3v-7a9 9 0 0 1 9-9Z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{episode.title}</p>
          <p className="text-[#b3b3b3] text-xs">
            {error ? (
              <span className="text-red-400">{error}</span>
            ) : (
              formatDate(episode.date, { weekday: "long", day: "numeric", month: "long" })
            )}
          </p>
        </div>

        {/* Speed */}
        <button
          onClick={cycleSpeed}
          className="text-[#b3b3b3] hover:text-white text-xs font-semibold tabular-nums w-11 h-8 rounded-full border border-[#3E3E3E] hover:border-[#727272] transition-colors shrink-0"
          aria-label={`Vitesse de lecture ${SPEEDS[speedIdx]}x, changer`}
        >
          {SPEEDS[speedIdx]}×
        </button>

        {/* Skip back 15s */}
        <button
          onClick={() => skip(-SKIP)}
          className="text-[#b3b3b3] hover:text-white shrink-0"
          aria-label="Reculer de 15 secondes"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11 8V5l-5 5 5 5v-3c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5H4a7 7 0 1 0 7-7z" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-105 transition-transform shrink-0"
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isBuffering ? (
            <svg className="w-4 h-4 text-black animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Skip forward 15s */}
        <button
          onClick={() => skip(SKIP)}
          className="text-[#b3b3b3] hover:text-white shrink-0"
          aria-label="Avancer de 15 secondes"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13 8V5l5 5-5 5v-3c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5h2a7 7 0 1 1-7-7z" />
          </svg>
        </button>
      </div>

      {/* Accessible progress slider (native keyboard support) */}
      <div className="flex items-center gap-2 max-w-2xl mx-auto">
        <span className="text-[#727272] text-xs w-9 text-right tabular-nums">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="Progression de la lecture"
          aria-valuetext={`${formatTime(currentTime)} sur ${formatTime(duration)}`}
          className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer accent-[#1DB954]"
          style={{
            background: `linear-gradient(to right, #1DB954 ${pct}%, #535353 ${pct}%)`,
          }}
        />
        <span className="text-[#727272] text-xs w-9 tabular-nums">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
