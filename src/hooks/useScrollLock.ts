import { useState, useEffect, useCallback, useRef } from 'react';

interface UseScrollLockOptions {
  enabled: boolean;
  hideDelay?: number;
  showDelay?: number;
}

export function useScrollLock({ 
  enabled, 
  hideDelay = 0,
  showDelay = 500 
}: UseScrollLockOptions) {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const showTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    if (!enabled) {
      setIsNavbarVisible(true);
      return;
    }

    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY.current;
    const scrollingUp = currentScrollY < lastScrollY.current;

    // Clear any pending timeouts
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    if (showTimeout.current) {
      clearTimeout(showTimeout.current);
    }

    if (scrollingDown && currentScrollY > 50) {
      // Hide navbar immediately when scrolling down
      scrollTimeout.current = setTimeout(() => {
        setIsNavbarVisible(false);
      }, hideDelay);
    } else if (scrollingUp) {
      // Show navbar after delay when scrolling up
      showTimeout.current = setTimeout(() => {
        setIsNavbarVisible(true);
      }, showDelay);
    }

    lastScrollY.current = currentScrollY;
  }, [enabled, hideDelay, showDelay]);

  useEffect(() => {
    if (!enabled) {
      setIsNavbarVisible(true);
      return;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      if (showTimeout.current) clearTimeout(showTimeout.current);
    };
  }, [enabled, handleScroll]);

  return { isNavbarVisible };
}
