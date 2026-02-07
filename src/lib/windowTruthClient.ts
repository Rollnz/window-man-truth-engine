/**
 * Lightweight client helper for the Window Truth Engine backend.
 * - Persists/creates a wm_session_id (localStorage first, cookies as backup)
 * - Registers session in wm_sessions table via Supabase
 * - Provides a logEvent helper with graceful failure
 *
 * Defensive coding: network failures never throw; they just log to console.
 */

import { supabase } from '@/integrations/supabase/client';
import { getGoldenThreadId } from '@/lib/goldenThread';

import type { Json } from '@/integrations/supabase/types';

const STORAGE_KEY = "wm_session_id";

type EventPayload = {
  event_name: string;
  params?: Record<string, unknown>;
  tool_name?: string;
  page_path?: string;
};

const getAttributionParams = () => {
  const url = new URL(window.location.href);
  const pick = (key: string) => url.searchParams.get(key) ?? undefined;
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_term: pick("utm_term"),
    utm_content: pick("utm_content"),
    gclid: pick("gclid"),
    fbclid: pick("fbclid"),
    msclkid: pick("msclkid"),
    referrer: document.referrer || undefined,
  };
};

const saveSessionId = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, id);
    document.cookie = `${STORAGE_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (error) {
    console.warn("[wm] unable to persist session id", error);
  }
};

const readSessionId = () => {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage) return fromStorage;
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${STORAGE_KEY}=([^;]*)`));
  return match?.[1];
};

/**
 * Create or refresh session in the database.
 * Uses Supabase client directly to insert into wm_sessions table.
 */
const createOrRefreshSession = async (): Promise<string> => {
  const existing = readSessionId();
  const attribution = getAttributionParams();

  // If we already have a session ID, verify it exists in DB or create it
  if (existing) {
    try {
      // Check if session exists
      const { data: existingSession } = await supabase
        .from('wm_sessions')
        .select('id')
        .eq('id', existing)
        .maybeSingle();

      if (existingSession) {
        // Session exists, just update timestamp
        await supabase
          .from('wm_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existing);
        return existing;
      }
    } catch (error) {
      console.warn("[wm] session verification failed, will create new", error);
    }
  }

  // Create new session in database
  const newSessionId = existing || crypto.randomUUID();
  // Use Golden Thread ID for visitor identity (ensures leads.client_id matches wm_sessions.anonymous_id)
  const anonymousId = getGoldenThreadId();

  try {
    const { error } = await supabase
      .from('wm_sessions')
      .insert({
        id: newSessionId,
        anonymous_id: anonymousId,
        landing_page: window.location.pathname,
        user_agent: navigator.userAgent,
        referrer: attribution.referrer,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
      });

    if (error) {
      console.warn("[wm] session insert failed", error);
      // Fallback: return local UUID anyway so downstream calls work
      const localId = existing || crypto.randomUUID();
      saveSessionId(localId);
      return localId;
    }

    saveSessionId(newSessionId);
    console.log("[wm] session registered:", newSessionId);
    return newSessionId;
  } catch (error) {
    console.warn("[wm] session bootstrap failed", error);
  }

  // Fallback: keep using existing client-side ID or mint a local UUID
  const localId = existing || crypto.randomUUID();
  saveSessionId(localId);
  return localId;
};

let sessionPromise: Promise<string | undefined> | null = null;

export const getSessionId = async (): Promise<string> => {
  if (!sessionPromise) {
    sessionPromise = createOrRefreshSession();
  }
  return (await sessionPromise) ?? "";
};

export const logEvent = async ({ event_name, params = {}, tool_name, page_path }: EventPayload) => {
  const session_id = await getSessionId();
  if (!session_id) {
    console.warn("[wm] cannot log event without session");
    return;
  }

  try {
    // Insert event directly into wm_events table
    const { error } = await supabase
      .from('wm_events')
      .insert([{
        session_id: session_id,
        event_name,
        event_category: tool_name,
        page_path: page_path ?? window.location.pathname,
        event_data: (params || null) as Json,
      }]);
    
    if (error) {
      console.warn("[wm] logEvent insert error", error);
    }
  } catch (error) {
    console.warn("[wm] logEvent failed", error);
  }
};
