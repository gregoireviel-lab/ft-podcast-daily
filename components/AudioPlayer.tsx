"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { Episode } from "@/types/episode";
import { formatTime, formatDate } from "@/lib/format";
import { captureEvent } from "@/lib/analytics";
import { BrandGlyph } from "./BrandMark";

interface AudioPlayerProps {
  episode: Episode | null;
  /** Increments each time the user explicitly taps a card -> trigger autoplay. */
  playToken?: number;
  /** Bubbles play/pause state up so the list can show the equalizer. */
  onPlayingChange?: (playing: boolean) => void;
}

const SPEEDS = [1, 1.25, 1.5, 2] as const;
const SKIP = 15;
const posKey = (id: string) => `ftpod:pos:${id}`;
// Listen-progress milestones we report to analytics (COS-0062).
const MILESTONES = [25, 50, 75] as const;

export default function AudioPlayer({
  episode,
  playToken = 0,
  onPlayingChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [showRemaining, setShowRemaining] = useState(false);

  // Analytics guards (reset per episode) — fire each event at most once.
  const playedRef = useRef(false);
  const milestonesRef = useRef<Set<number>>(new Set());

  const setPlaying = useCallback(
    (p: boolean) => {
      setIsPlaying(p);
      onPlayingChange?.(p);
    },
    [onPlayingChange]
  );

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
    playedRef.current = false;
    milestonesRef.current = new Set();

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
      artist: "Kairos",
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
    // Report listen-progress milestones once each (COS-0062).
    if (episode && audio.duration > 0) {
      const pctDone = (audio.currentTime / audio.duration) * 100;
      for (const m of MILESTONES) {
        if (pctDone >= m && !milestonesRef.current.has(m)) {
          milestonesRef.current.add(m);
          captureEvent("episode_progress", {
            episode_id: episode.id,
            percent: m,
          });
        }
      }
    }
  };

  const onEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
    if (episode) {
      captureEvent("episode_completed", {
        episode_id: episode.id,
        title: episode.title,
      });
      try {
        localStorage.removeItem(posKey(episode.id));
      } catch {
        /* ignore */
      }
    }
  };

  const onError = () => {
    setIsBuffering(false);
    setPlaying(false);
    setError("Impossible de lire l'audio. Réessaie plus tard.");
  };

  const onPlayEvent = () => {
    setPlaying(true);
    // Fire "played" once per loaded episode (COS-0062).
    if (episode && !playedRef.current) {
      playedRef.current = true;
      captureEvent("episode_played", {
        episode_id: episode.id,
        title: episode.title,
        date: episode.date,
      });
    }
  };

  const shellClass =
    "fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-elevated/95 backdrop-blur-md";

  if (!episode) {
    return (
      <div className={`${shellClass} pb-[env(safe-area-inset-bottom)]`}>
        <div className="mx-auto flex h-[68px] max-w-2xl items-center justify-center px-5">
          <p className="text-sm text-subtle">Sélectionne un épisode pour écouter</p>
        </div>
      </div>
    );
  }

  const total = duration || 0;
  const pct = total > 0 ? (currentTime / total) * 100 : 0;
  const remaining = Math.max(0, total - currentTime);

  // Transport controls, rendered inline on desktop and as their own centered
  // row on mobile (COS-0069, Spotify-like hierarchy: title → progress →
  // controls). A helper (fresh JSX per call) keeps the two placements in sync.
  const renderControls = (opts?: { size?: "sm" | "lg" }) => {
    const big = opts?.size === "lg";
    const btn = big ? "h-12 w-12" : "h-11 w-11";
    const play = big ? "h-14 w-14" : "h-12 w-12";
    return (
      <>
        {/* Speed */}
        <button
          onClick={cycleSpeed}
          className={`${btn} shrink-0 rounded-full text-xs font-bold tabular-nums text-muted transition-colors hover:bg-white/5 hover:text-fg`}
          aria-label={`Vitesse de lecture ${SPEEDS[speedIdx]}x, changer`}
        >
          {SPEEDS[speedIdx]}×
        </button>

        {/* Skip back 15s */}
        <button
          onClick={() => skip(-SKIP)}
          className={`${btn} flex shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-fg`}
          aria-label="Reculer de 15 secondes"
        >
          <svg className={big ? "h-7 w-7" : "h-6 w-6"} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11 8V5l-5 5 5 5v-3c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5H4a7 7 0 1 0 7-7z" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className={`${play} relative flex shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-md shadow-black/30 transition-transform duration-150 ease-[var(--ease)] hover:scale-105 active:scale-95 motion-reduce:hover:scale-100`}
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {/* discreet buffering ring */}
          {isBuffering && (
            <span
              className="absolute inset-[-3px] animate-spin rounded-full border-2 border-transparent border-t-accent/70 motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          <span className="relative grid place-items-center">
            <svg
              className={`col-start-1 row-start-1 ${big ? "h-6 w-6" : "h-5 w-5"} transition-all duration-150 ${
                isPlaying ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M7 5h3.5v14H7V5zm6.5 0H17v14h-3.5V5z" />
            </svg>
            <svg
              className={`col-start-1 row-start-1 ml-0.5 ${big ? "h-6 w-6" : "h-5 w-5"} transition-all duration-150 ${
                isPlaying ? "scale-50 opacity-0" : "scale-100 opacity-100"
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>

        {/* Skip forward 15s */}
        <button
          onClick={() => skip(SKIP)}
          className={`${btn} flex shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-fg`}
          aria-label="Avancer de 15 secondes"
        >
          <svg className={big ? "h-7 w-7" : "h-6 w-6"} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13 8V5l5 5-5 5v-3c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5h2a7 7 0 1 1-7-7z" />
          </svg>
        </button>
      </>
    );
  };

  const subtitle = error ? (
    <span className="text-danger">{error}</span>
  ) : isBuffering ? (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
      Chargement…
    </span>
  ) : (
    <span className="capitalize">
      {formatDate(episode.date, { weekday: "long", day: "numeric", month: "long" })}
    </span>
  );

  return (
    <div className={`${shellClass} px-5 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]`}>
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPlay={onPlayEvent}
        onPause={() => setPlaying(false)}
        onPlaying={() => {
          setIsBuffering(false);
          onPlayEvent();
          setError(null);
        }}
        onWaiting={() => setIsBuffering(true)}
        onEnded={onEnded}
        onError={onError}
      />

      {/* Row 1 — identity (title always visible) + inline controls on desktop */}
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        {/* Artwork */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-contrast">
          <BrandGlyph className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{episode.title}</p>
          <p className="truncate text-xs text-subtle">{subtitle}</p>
        </div>

        {/* Desktop: controls inline on the right */}
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          {renderControls()}
        </div>
      </div>

      {/* Row 2 — progress (visible draggable thumb, keyboard-accessible range) */}
      <div className="mx-auto mt-1.5 flex max-w-2xl items-center gap-2.5">
        <span className="w-10 text-right text-[0.6875rem] font-medium tabular-nums text-subtle">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={total}
          step={0.1}
          value={Math.min(currentTime, total)}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="Progression de la lecture"
          aria-valuetext={`${formatTime(currentTime)} sur ${formatTime(total)}`}
          className="player-range flex-1"
          style={
            {
              "--range-bg": `linear-gradient(to right, var(--accent) ${pct}%, #3a3a42 ${pct}%)`,
            } as React.CSSProperties
          }
        />
        <button
          onClick={() => setShowRemaining((s) => !s)}
          className="w-10 text-left text-[0.6875rem] font-medium tabular-nums text-subtle transition-colors hover:text-fg"
          aria-label={showRemaining ? "Afficher la durée totale" : "Afficher le temps restant"}
        >
          {showRemaining ? `-${formatTime(remaining)}` : formatTime(total)}
        </button>
      </div>

      {/* Row 3 — controls on their own centered row (mobile only) */}
      <div className="mx-auto mt-1.5 flex max-w-2xl items-center justify-center gap-3 sm:hidden">
        {renderControls({ size: "lg" })}
      </div>
    </div>
  );
}
