import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/config/navigation';

/**
 * Core authentication hook. Manages user/session state, provides
 * sign-in, sign-up, sign-out, and password management utilities.
 * Automatically syncs with the auth state change listener.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  // Fetch password status from profiles table
  const fetchPasswordStatus = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('has_password')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setHasPassword(data.has_password);
    } else {
      // Profile might not exist yet, default to false
      setHasPassword(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Fetch password status when user logs in
        if (session?.user) {
          setTimeout(() => {
            fetchPasswordStatus(session.user.id);
          }, 0);
        } else {
          setHasPassword(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchPasswordStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchPasswordStatus]);

  // Magic link sign in (for signup flow)
  const signInWithMagicLink = useCallback(async (email: string) => {
    const redirectUrl = `${window.location.origin}${ROUTES.AUTH}?mode=set-password`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    return { error };
  }, []);

  // Email/password sign in
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  }, []);

  // Sign up with email (sends magic link for verification)
  const signUp = useCallback(async (email: string) => {
    const redirectUrl = `${window.location.origin}${ROUTES.AUTH}?mode=set-password`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    return { error };
  }, []);

  // Set password for first time (after magic link)
  const setPassword = useCallback(async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    
    if (!error && user) {
      // Update profile to mark password as set
      await supabase
        .from('profiles')
        .update({ has_password: true })
        .eq('user_id', user.id);
      
      setHasPassword(true);
    }
    
    return { data, error };
  }, [user]);

  // Request password reset email
  const resetPasswordRequest = useCallback(async (email: string) => {
    const redirectUrl = `${window.location.origin}${ROUTES.AUTH}?mode=reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    return { error };
  }, []);

  // Update password (from reset flow)
  const updatePassword = useCallback(async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    
    if (!error && user) {
      // Ensure has_password is true
      await supabase
        .from('profiles')
        .update({ has_password: true })
        .eq('user_id', user.id);
      
      setHasPassword(true);
    }
    
    return { data, error };
  }, [user]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setHasPassword(null);
    return { error };
  }, []);

  const isAuthenticated = !!user;

  return {
    user,
    session,
    loading,
    hasPassword,
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    setPassword,
    resetPasswordRequest,
    updatePassword,
    signOut,
    isAuthenticated,
    needsPasswordSetup: isAuthenticated && hasPassword === false,
  };
}
