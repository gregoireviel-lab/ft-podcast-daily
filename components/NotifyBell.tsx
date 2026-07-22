"use client";

/**
 * Web Push opt-in (COS — re-engagement). A discreet bell button: on tap it asks
 * for notification permission, subscribes via the service worker (VAPID), and
 * POSTs the subscription to /api/push/subscribe. The local pipeline then pushes
 * "new episode" to every stored subscription on publish.
 *
 * iOS caveat: Web Push only works for an INSTALLED PWA (iOS 16.4+). In Safari
 * (not installed) PushManager is absent, so the button hides itself gracefully.
 */
import { useEffect, useState } from "react";
import { captureEvent } from "@/lib/analytics";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type State = "hidden" | "idle" | "working" | "subscribed" | "denied";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  // Allocate over an explicit ArrayBuffer so the type is Uint8Array<ArrayBuffer>
  // (BufferSource), not Uint8Array<ArrayBufferLike>.
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function NotifyBell() {
  const [state, setState] = useState<State>("hidden");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window) ||
      !VAPID_PUBLIC
    ) {
      setState("hidden");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    // Show the button as soon as push is supported — don't gate on the SW being
    // ready (in dev the SW isn't registered; in prod it resolves shortly after).
    setState("idle");
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setState("subscribed");
      })
      .catch(() => {
        /* no SW yet — stay on the idle button */
      });
  }, []);

  const subscribe = async () => {
    if (!VAPID_PUBLIC) return;
    setState("working");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "idle");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (res.ok) {
        captureEvent("push_subscribed", {});
        setState("subscribed");
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  };

  if (state === "hidden" || state === "denied") return null;

  if (state === "subscribed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-[0.75rem] font-medium text-muted">
        <svg className="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6-6V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v5l-1.7 1.7a1 1 0 00.7 1.3h14a1 1 0 00.7-1.7L18 16z" />
        </svg>
        Notifications activées
      </span>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={state === "working"}
      className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-[0.75rem] font-semibold text-fg transition-colors hover:border-white/10 hover:bg-surface-hover disabled:opacity-60"
      aria-label="M'avertir quand un nouvel épisode est disponible"
    >
      <svg className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.7-1.7A2 2 0 0118 14V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v3a2 2 0 01-.3 1.3L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {state === "working" ? "…" : "M'avertir du nouvel épisode"}
    </button>
  );
}
