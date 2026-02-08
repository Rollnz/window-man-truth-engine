/**
 * useDeferredAuth - Defers auth check until after initial render
 * 
 * This hook wraps useAuth but delays the actual auth check by a few milliseconds
 * to prevent blocking the critical rendering path. The auth state is then
 * populated asynchronously.
 * 
 * For components that need auth state but aren't critical for FCP/LCP.
 */
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';

interface DeferredAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasPassword: boolean | null;
}

const initialState: DeferredAuthState = {
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  hasPassword: null,
};

export function useDeferredAuth(delayMs: number = 100): DeferredAuthState {
  const [authState, setAuthState] = useState<DeferredAuthState>(initialState);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Defer the actual auth import/check
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  // Only load auth module after delay
  useEffect(() => {
    if (!shouldLoad) return;

    let mounted = true;

    // Dynamic import to avoid loading Supabase on initial render
    import('@/hooks/useAuth').then(({ useAuth }) => {
      // This is a workaround - we can't use hooks dynamically
      // Instead, we'll directly use the Supabase client
      import('@/integrations/supabase/client').then(({ supabase }) => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (mounted) {
            setAuthState({
              user: session?.user ?? null,
              session,
              loading: false,
              isAuthenticated: !!session?.user,
              hasPassword: null, // Can be fetched later if needed
            });
          }
        });

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_, session) => {
            if (mounted) {
              setAuthState({
                user: session?.user ?? null,
                session,
                loading: false,
                isAuthenticated: !!session?.user,
                hasPassword: null,
              });
            }
          }
        );

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      });
    });
  }, [shouldLoad]);

  return authState;
}
