import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSessionData, SessionData } from '@/hooks/useSessionData';
import { supabase } from '@/integrations/supabase/client';
import { scheduleWhenIdle } from '@/lib/deferredInit';
import { handleAuthError } from '@/lib/authErrorHandler';

/**
 * useSessionSync - Automatically syncs localStorage session data to database on authentication
 * 
 * This hook runs at app root and fires once per auth session when:
 * 1. User just authenticated (isAuthenticated becomes true)
 * 2. localStorage has meaningful session data
 * 
 * Safety:
 * - Fire-and-forget: Errors are logged but never block UI
 * - Deferred: Uses idle callback to avoid blocking initial render
 * - Idempotent: Marks sync complete to avoid duplicate calls
 */
export function useSessionSync() {
  const { isAuthenticated, user } = useAuth();
  const { sessionData, updateFields } = useSessionData();
  const hasSynced = useRef(false);
  const syncInProgress = useRef(false);

  // Sync localStorage to database on auth
  useEffect(() => {
    // Only sync once per auth session
    if (!isAuthenticated || !user || hasSynced.current || syncInProgress.current) {
      return;
    }

    const syncSession = async () => {
      syncInProgress.current = true;

      try {
        // Skip if localStorage is effectively empty (only has lastVisit or nothing)
        const meaningfulKeys = Object.keys(sessionData).filter(
          key => key !== 'lastVisit' && sessionData[key as keyof SessionData] !== undefined
        );

        if (meaningfulKeys.length === 0) {
          console.log('[SessionSync] No meaningful data to sync');
          hasSynced.current = true;
          return;
        }

        console.log('[SessionSync] Syncing session data...', meaningfulKeys.length, 'fields');

        const { data, error } = await supabase.functions.invoke('sync-session', {
          body: {
            sessionData,
            syncReason: 'auth_login',
          },
        });

        if (error) {
          console.error('[SessionSync] Sync failed:', error);
          // Handle 401 gracefully — refresh or sign out
          const was401 = await handleAuthError(error);
          if (was401) {
            hasSynced.current = true; // Don't retry on auth failure
          }
        } else {
          console.log('[SessionSync] Sync complete:', data);
          hasSynced.current = true;
        }
      } catch (err) {
        console.error('[SessionSync] Unexpected error:', err);
        // Handle 401 gracefully if it surfaces as a thrown error
        await handleAuthError(err);
      } finally {
        syncInProgress.current = false;
      }
    };

    // Defer sync to idle time (2s delay to let auth settle + avoid blocking render)
    const cancel = scheduleWhenIdle(syncSession, { minDelay: 2000, timeout: 5000 });
    return cancel;
  }, [isAuthenticated, user, sessionData]);

  // Reset sync flag on logout
  useEffect(() => {
    if (!isAuthenticated) {
      hasSynced.current = false;
    }
  }, [isAuthenticated]);

  // Hydrate localStorage from database if empty
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const hydrateFromDb = async () => {
      // Only hydrate if localStorage is effectively empty
      const meaningfulKeys = Object.keys(sessionData).filter(
        key => key !== 'lastVisit' && sessionData[key as keyof SessionData] !== undefined
      );

      if (meaningfulKeys.length > 0) {
        // localStorage has data, no need to hydrate
        return;
      }

      try {
        console.log('[SessionSync] localStorage empty, checking database...');

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('session_data')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('[SessionSync] Failed to fetch profile:', error);
          return;
        }

        const dbSessionData = profile?.session_data as Partial<SessionData> | null;

        if (dbSessionData && Object.keys(dbSessionData).length > 0) {
          console.log('[SessionSync] Hydrating from database...', Object.keys(dbSessionData).length, 'fields');
          updateFields(dbSessionData);
        } else {
          console.log('[SessionSync] No data in database to hydrate');
        }
      } catch (err) {
        console.error('[SessionSync] Hydration error:', err);
      }
    };

    // Small delay to let initial localStorage check settle
    const timer = setTimeout(hydrateFromDb, 200);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, sessionData, updateFields]);
}
