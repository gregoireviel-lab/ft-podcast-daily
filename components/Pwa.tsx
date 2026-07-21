"use client";

/**
 * PWA runtime (COS-0066): registers the service worker and surfaces a discreet
 * "Installer" button when the browser offers installation.
 *
 * - SW registers in production only (avoids caching the dev server's assets).
 * - The install chip appears only after `beforeinstallprompt` fires, is
 *   dismissible, and remembers dismissal for the session. It never shows once
 *   the app is already running standalone (installed).
 */
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kairos:install-dismissed";

export default function Pwa() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [dismissed, setDismissed] = useState(true);

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

  // Capture the install prompt.
  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

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

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true);

  if (!promptEvent || dismissed || isStandalone) return null;

  const install = async () => {
    const e = promptEvent;
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

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3 rounded-full border border-hairline bg-elevated/95 py-1.5 pl-4 pr-1.5 shadow-lg shadow-black/30 backdrop-blur-md">
        <span className="text-[0.8125rem] font-medium text-muted">
          Installer Kairos
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
