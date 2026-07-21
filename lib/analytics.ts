/**
 * Product analytics (COS-0062) — PostHog, fully env-gated + lazy-loaded.
 *
 * Without `NEXT_PUBLIC_POSTHOG_KEY` this is a clean no-op: `posthog-js` is
 * loaded via dynamic import ONLY when a key is present, so builds/deploys
 * without the key pay zero runtime bundle cost and make no network calls.
 * The key must be added to Vercel env vars for analytics to flow.
 *
 * Region: defaults to PostHog US cloud. Override with
 * `NEXT_PUBLIC_POSTHOG_HOST` (e.g. https://eu.i.posthog.com) for the EU cloud.
 */
import type { PostHog } from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/** True only when a key is configured AND we are in the browser. */
export const analyticsEnabled = (): boolean =>
  typeof window !== "undefined" && Boolean(KEY);

let client: PostHog | null = null;
let loading = false;
// Events captured before the async client is ready are buffered, then flushed.
const queue: Array<[string, Record<string, unknown> | undefined]> = [];

function flush() {
  if (!client) return;
  for (const [event, props] of queue.splice(0)) client.capture(event, props);
}

/** Initialise PostHog once (dynamic import). No-op without a key. */
export function initAnalytics(): void {
  if (loading || client || !analyticsEnabled()) return;
  loading = true;
  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(KEY as string, {
        api_host: HOST,
        // We drive pageviews manually (App Router client navigations aren't
        // full page loads); disable the automatic one to avoid double counting.
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: false,
        persistence: "localStorage+cookie",
        defaults: "2025-05-24",
      });
      client = posthog;
      flush();
    })
    .catch(() => {
      /* analytics must never break the app */
      loading = false;
    });
}

/** Record a virtual pageview for an App Router navigation. */
export function capturePageview(url: string): void {
  captureEvent("$pageview", { $current_url: url });
}

/** Record an arbitrary product event. No-op without a key. */
export function captureEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!analyticsEnabled()) return;
  if (client) client.capture(event, properties);
  else queue.push([event, properties]);
}
