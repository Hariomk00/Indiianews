import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * Ensures every page navigation immediately resets scroll position to the very top (0, 0),
 * preventing pages from opening in the middle of an article or banner.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Disable browser automatic scroll restoration to avoid opening pages in the middle
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Force immediate scroll to top on navigation
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });

    // Also trigger on next tick in case async layout shift occurs
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
