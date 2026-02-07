import { useEffect, useRef } from 'react';
import { trackEngagement, ENGAGEMENT_SCORES } from '@/services/analytics';
import { scheduleWhenIdle } from '@/lib/deferredInit';

const TIMER_FIRED_KEY = 'wte-page-timer-fired';

/**
 * Awards engagement points based on time spent on site
 * - 2 minutes = +10 points
 * - Only fires once per session
 * - Timer setup is deferred to improve initial render performance
 */
export function usePageTimer() {
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    // Defer timer setup to idle time (3s after load)
    const cancelIdle = scheduleWhenIdle(() => {
      // Check if already fired this session
      try {
        if (sessionStorage.getItem(TIMER_FIRED_KEY)) {
          firedRef.current = true;
          return;
        }
      } catch {
        // Ignore storage errors
      }
      
      const TWO_MINUTES = 2 * 60 * 1000;
      
      timerRef.current = setTimeout(() => {
        if (!firedRef.current) {
          firedRef.current = true;
          trackEngagement('time_on_site_2min', ENGAGEMENT_SCORES.TIME_ON_SITE_2MIN);
          
          // Mark as fired in session storage
          try {
            sessionStorage.setItem(TIMER_FIRED_KEY, 'true');
          } catch {
            // Ignore storage errors
          }
          
          console.log('⏱️ Awarded 10 points for 2min on site');
        }
      }, TWO_MINUTES);
    }, { minDelay: 3000 });
    
    return () => {
      cancelIdle();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
