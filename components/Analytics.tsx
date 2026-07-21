"use client";

/**
 * Analytics bootstrap (COS-0062). Mounted once in the root layout.
 *
 * - Initialises PostHog (no-op unless NEXT_PUBLIC_POSTHOG_KEY is set).
 * - Emits a manual $pageview on every App Router navigation.
 *
 * useSearchParams() must live under a Suspense boundary to avoid opting the
 * whole tree out of static rendering, so the tracker is isolated below.
 */
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, capturePageview } from "@/lib/analytics";

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    const url = window.origin + pathname + (qs ? `?${qs}` : "");
    capturePageview(url);
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  );
}
