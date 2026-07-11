"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/api";

/**
 * Records client-side navigations to the backend SQLite analytics store.
 * Failures are silent so tracking never blocks the UI.
 */
export function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;
    const referrer =
      typeof document !== "undefined" && document.referrer ? document.referrer : "";

    void trackPageView(path, referrer);
  }, [pathname, searchParams]);

  return null;
}
