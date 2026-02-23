/**
 * Unified Tracking Utility for Lead Scoring + Attribution
 * Persists events to Supabase via /track edge function AND pushes to GTM dataLayer.
 * 
 * Implements:
 * - Client ID (localStorage, persistent across sessions)
 * - Session ID (sessionStorage, per-tab)
 * - Attribution (first touch + last touch)
 * - Non-blocking event dispatch with keepalive
 */

import { supabase } from '@/integrations/supabase/client';
import { getFullAttributionData, type AttributionData } from './attribution';

const CLIENT_ID_KEY = 'wm_client_id';
const SESSION_ID_KEY = 'wm_session_id';

// =====================================================
// ID Management
// =====================================================

import { generateSecureUUID } from './secureUUID';

/** Generate a cryptographically secure UUIDv4 (CWE-338 compliant) */
function generateUUID(): string {
  return generateSecureUUID();
}

/**
 * @deprecated Use getGoldenThreadId() from '@/lib/goldenThread' instead.
 * This function is aliased to the canonical ID via the startup reconciler,
 * so it works correctly but should be migrated in future cleanup.
 */
export function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return generateUUID();
  
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = generateUUID();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

/** Get or create session ID (per browser tab) */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateUUID();
  
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Attribution is now handled by src/lib/attribution.ts (Three-Tier system)
// Legacy types removed: Attribution, TouchPoint, parseCurrentAttribution, getAttribution

// =====================================================
// Event Tracking
// =====================================================

export interface TrackEventPayload {
  event_name?: string;
  section_id?: string;
  page_path?: string;
  cta_id?: string;
  target_path?: string;
  transcript_id?: string;
  topic?: string;
  case_id?: string;
  county?: string;
  scenario_type?: string;
  filter_topic?: string;
  filters?: Record<string, unknown>;
  from_page?: string;
  to_tool?: string;
}

interface TrackEnvelope {
  event_id: string;
  event_name: string;
  client_id: string;
  session_id: string;
  user_id?: string;
  page_path: string;
  section_id?: string;
  payload: Record<string, unknown>;
  attribution: {
    first_touch: AttributionData;
    last_touch: AttributionData;
    last_non_direct: AttributionData;
  };
  timestamp: string;
  user_agent: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
}

/** Detect device type from user agent */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|iphone|ipod|android.*mobile/.test(ua)) return 'mobile';
  if (/tablet|ipad|android(?!.*mobile)/.test(ua)) return 'tablet';
  return 'desktop';
}

/** Get current user ID if authenticated */
async function getCurrentUserId(): Promise<string | undefined> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

/**
 * Main tracking function - fires to both GTM dataLayer and Supabase.
 * Non-blocking; errors are swallowed.
 */
export async function track(
  event_name: string,
  payload: Omit<TrackEventPayload, 'event_name'> = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  const event_id = generateUUID();
  const client_id = getOrCreateClientId();
  const session_id = getOrCreateSessionId();
  const attribution = getFullAttributionData();
  const user_id = await getCurrentUserId();

  const envelope: TrackEnvelope = {
    event_id,
    event_name,
    client_id,
    session_id,
    user_id,
    page_path: payload.page_path || window.location.pathname,
    section_id: payload.section_id,
    payload: { ...payload },
    attribution,
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent,
    device_type: getDeviceType(),
  };

  // 1. Push to GTM dataLayer (sync, non-blocking)
  try {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: event_name,
        ...payload,
        client_id,
        session_id,
        user_id,
      });
    }
  } catch {
    // GTM push failed, ignore
  }

  // 2. POST to Supabase edge function (async, keepalive)
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Use fetch with keepalive for reliability on page unload
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track`, {
      method: 'POST',
      headers,
      body: JSON.stringify(envelope),
      keepalive: true,
    }).catch(() => {
      // Swallow errors - tracking should never block user
    });
  } catch {
    // Supabase call failed, ignore
  }
}

/**
 * Helper: Track section view (with sessionStorage dedup)
 */
export function trackSectionView(sectionId: string, pagePath: string = '/proof'): void {
  const storageKey = `wm_viewed_${pagePath}_${sectionId}`;
  if (sessionStorage.getItem(storageKey)) return;
  
  sessionStorage.setItem(storageKey, '1');
  track('wm_proof_section_view', {
    section_id: sectionId,
    page_path: pagePath,
  });
}

/**
 * Helper: Track CTA click
 */
export function trackCTAClick(
  ctaId: string,
  sectionId: string,
  targetPath: string,
  pagePath: string = '/proof'
): void {
  track('wm_proof_cta_click', {
    cta_id: ctaId,
    section_id: sectionId,
    target_path: targetPath,
    page_path: pagePath,
  });
}

/**
 * Helper: Track tool route navigation
 */
export function trackToolRoute(
  fromPage: string,
  toTool: string,
  targetPath: string
): void {
  track('wm_tool_route', {
    from_page: fromPage,
    to_tool: toTool,
    target_path: targetPath,
  } as TrackEventPayload);
}

