"use client";

/**
 * PWA runtime (COS-0066): registers the service worker and surfaces a discreet
 * install affordance — on MOBILE ONLY, where installing the app actually makes
 * sense. On desktop nothing is shown.
 *
 * Two mobile paths:
 * - Android / Chromium mobile: the browser fires `beforeinstallprompt`, so we
 *   show an "Installer" button that triggers the native prompt.
 * - iOS Safari: `beforeinstallprompt` never fires, so we show a discreet hint
 *   explaining the manual "Add to Home Screen" gesture (Share ⎙ → "Sur l'écran
 *   d'accueil").
 *
 * The SW registers in production only (avoids caching the dev server's assets).
 * The affordance is dismissible (remembered for the session) and never shows
 * once the app is already running standalone (installed).
 */
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kairos:install-dismissed";

/** Coarse pointer + narrow viewport → treat as a phone. Excludes desktop
 *  (fine pointer, wide) and keeps the prompt where install is useful. */
function computeIsMobile(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(max-width: 1024px)").matches
  );
}

function computeIsIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iphone|ipod|ipad/i.test(ua) ||
    // iPadOS 13+ reports as "MacIntel" but exposes touch points.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function computeIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function Pwa() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [dismissed, setDismissed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  // Register the service worker (production only).
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failure must never break the app */
      });
    };
    // Effects run after hydration, so the window "load" event has usually
    // already fired — register straight away in that case, otherwise wait.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  // Detect environment (client-only) + keep `isMobile` in sync on resize.
  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    setIsIOS(computeIsIOS());
    setIsStandalone(computeIsStandalone());

    const syncMobile = () => setIsMobile(computeIsMobile());
    syncMobile();
    const mq = window.matchMedia("(pointer: coarse) and (max-width: 1024px)");
    mq.addEventListener?.("change", syncMobile);
    window.addEventListener("resize", syncMobile);
    return () => {
      mq.removeEventListener?.("change", syncMobile);
      window.removeEventListener("resize", syncMobile);
    };
  }, []);

  // Capture the Android install prompt.
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    const e = promptEvent;
    if (!e) return;
    setPromptEvent(null);
    await e.prompt();
    await e.userChoice.catch(() => undefined);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  // Mobile-only. Never on desktop, never when already installed/dismissed.
  if (dismissed || isStandalone || !isMobile) return null;

  const showAndroidButton = promptEvent != null;
  const showIosHint = !showAndroidButton && isIOS;
  if (!showAndroidButton && !showIosHint) return null;

  const wrapperClass =
    "fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]";

  if (showIosHint) {
    return (
      <div className={wrapperClass}>
        <div className="flex max-w-[22rem] items-start gap-2.5 rounded-2xl border border-hairline bg-elevated/95 py-2.5 pl-3.5 pr-2 shadow-lg shadow-black/30 backdrop-blur-md">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {/* iOS Share glyph */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V4m0 0L8 8m4-4l4 4M6 12v6a2 2 0 002 2h8a2 2 0 002-2v-6"
            />
          </svg>
          <p className="text-[0.8125rem] leading-snug text-muted">
            Installer The Essential : appuie sur Partager{" "}
            <span className="font-semibold text-fg">⎙</span> puis «&nbsp;Sur
            l&apos;écran d&apos;accueil&nbsp;».
          </p>
          <button
            onClick={dismiss}
            aria-label="Masquer"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-subtle transition-colors hover:bg-white/5 hover:text-fg"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className="flex items-center gap-3 rounded-full border border-hairline bg-elevated/95 py-1.5 pl-4 pr-1.5 shadow-lg shadow-black/30 backdrop-blur-md">
        <span className="text-[0.8125rem] font-medium text-muted">
          Installer The Essential
        </span>
        <button
          onClick={install}
          className="rounded-full bg-accent px-3.5 py-1.5 text-[0.8125rem] font-semibold text-accent-contrast transition-transform duration-150 ease-[var(--ease)] hover:scale-105 active:scale-95 motion-reduce:hover:scale-100"
        >
          Installer
        </button>
        <button
          onClick={dismiss}
          aria-label="Masquer"
          className="flex h-8 w-8 items-center justify-center rounded-full text-subtle transition-colors hover:bg-white/5 hover:text-fg"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
