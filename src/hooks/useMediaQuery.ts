"use client";

import { useState, useEffect } from "react";

/**
 * Simple hook wrapping window.matchMedia.
 * Returns `true` if the media query currently matches.
 *
 * On the server the hook assumes a wide screen (returns `true`) to avoid
 * unnecessary layout flicker. After hydration the value will adjust
 * based on the actual viewport and update on resize.
 */
export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") {
      // assume wide screen during server render to avoid showing mobile layout
      return true;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    // sync in case value changed between render and effect
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
