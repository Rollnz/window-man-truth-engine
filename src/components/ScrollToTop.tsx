import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 *
 * Automatically scrolls the window to the top (0, 0) whenever the route changes.
 * This ensures users always start at the top of a new page in the SPA.
 *
 * Usage: Place this component inside the <BrowserRouter> in App.tsx
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top-left corner whenever the pathname changes
    window.scrollTo(0, 0);
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
