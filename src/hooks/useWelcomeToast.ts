import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getEngagementScore } from '@/services/analytics';

const WELCOME_SEEN_KEY = 'wte-welcome-toast-seen';
const TOAST_DELAY_MS = 2500;

/**
 * Hook to manage Welcome Toast visibility
 * Only shows on Homepage when user has 0 engagement score
 */
export function useWelcomeToast() {
  const [showToast, setShowToast] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    // Only show on homepage
    if (location.pathname !== '/') {
      setShowToast(false);
      return;
    }
    
    // Check if already seen
    const hasSeenWelcome = localStorage.getItem(WELCOME_SEEN_KEY) === 'true';
    if (hasSeenWelcome) {
      setShowToast(false);
      return;
    }
    
    // Check if user already has engagement score
    const score = getEngagementScore();
    if (score > 0) {
      setShowToast(false);
      return;
    }
    
    // Delay showing toast to let LCP load
    const timer = setTimeout(() => {
      // Re-check conditions after delay
      const currentScore = getEngagementScore();
      const stillHomepage = window.location.pathname === '/';
      const stillNotSeen = localStorage.getItem(WELCOME_SEEN_KEY) !== 'true';
      
      if (currentScore === 0 && stillHomepage && stillNotSeen) {
        setShowToast(true);
      }
    }, TOAST_DELAY_MS);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  const dismissToast = useCallback(() => {
    setShowToast(false);
    localStorage.setItem(WELCOME_SEEN_KEY, 'true');
  }, []);
  
  return { showToast, dismissToast };
}
