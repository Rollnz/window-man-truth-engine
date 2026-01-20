/**
 * Attribution data capture and persistence for lead tracking.
 * 
 * PHASE 1B: Three-Tier Attribution System
 * 
 * 1. first_touch - Captured on very first visit, never overwritten
 * 2. last_touch - Updated on every session (including direct)
 * 3. last_non_direct - ONLY updated when isMeaningfulTouch === true
 * 
 * This prevents paid attribution from being destroyed by direct returns.
 */

import { SessionData } from '@/hooks/useSessionData';
import { SourceTool } from '@/types/sourceTool';

const ATTRIBUTION_STORAGE_KEY = 'wm_attribution_data';
const FIRST_TOUCH_KEY = 'wm_first_touch';
const LAST_NON_DIRECT_KEY = 'wm_last_non_direct';

export interface AttributionData {
  // UTM Parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  // Click IDs
  fbc?: string;  // Facebook click ID (from URL or cookie)
  fbp?: string;  // Facebook browser ID (from cookie)
  gclid?: string; // Google click ID
  msclkid?: string; // Microsoft/Bing click ID
  // Channel classification
  channel?: string;
  landing_page?: string;
}

export interface AIContextData {
  source_form?: string;
  specific_detail?: string;
  emotional_state?: string;
  urgency_level?: string;
  insurance_carrier?: string;
  window_count?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Meaningful Touch Detection (Phase 1B)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if the referrer is from the same site (internal navigation)
 */
function isSameSiteReferrer(referrer: string): boolean {
  if (!referrer) return true;
  try {
    const refUrl = new URL(referrer);
    const currentHost = window.location.hostname;
    return refUrl.hostname === currentHost;
  } catch {
    return true;
  }
}

/**
 * Determine the channel type from attribution data
 */
function determineChannel(data: AttributionData): string {
  if (data.gclid) return 'google_ads';
  if (data.fbc || data.fbp) return 'meta_ads';
  if (data.msclkid) return 'microsoft_ads';
  
  const source = data.utm_source?.toLowerCase();
  const medium = data.utm_medium?.toLowerCase();
  
  if (source === 'facebook' || source === 'instagram' || source === 'meta') {
    return medium === 'cpc' || medium === 'paid' ? 'meta_ads' : 'organic_social';
  }
  if (source === 'google') {
    return medium === 'cpc' || medium === 'paid' ? 'google_ads' : 'organic_search';
  }
  if (medium === 'email') return 'email';
  if (medium === 'referral' || data.utm_source) return 'referral';
  if (medium === 'organic' || medium === 'social') return 'organic_social';
  
  return 'direct';
}

/**
 * Check if the current touch is a "meaningful" (non-direct) touch
 * 
 * A touch is meaningful if ANY of these are true:
 * - Has gclid (Google Ads click)
 * - Has fbclid (Meta Ads click)
 * - Has msclkid (Microsoft Ads click)
 * - Has utm_source AND utm_medium (campaign parameters)
 * - Has referrer from a different site
 */
export function isMeaningfulTouch(data: AttributionData): boolean {
  // Click IDs are always meaningful
  if (data.gclid || data.fbc || data.msclkid) {
    return true;
  }
  
  // UTM parameters indicate a tracked campaign
  if (data.utm_source && data.utm_medium) {
    return true;
  }
  
  // External referrer is meaningful
  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  if (referrer && !isSameSiteReferrer(referrer)) {
    return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// Cookie Utilities
// ═══════════════════════════════════════════════════════════════════════════

const getFbCookie = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match?.[1] || undefined;
  } catch {
    return undefined;
  }
};

const setFbCookie = (name: string, value: string): void => {
  if (typeof window === 'undefined' || !value) return;
  try {
    const domain = window.location.hostname;
    const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`;
  } catch (error) {
    console.warn('[Attribution] Failed to set FB cookie:', error);
  }
};

const formatFbcValue = (fbclid: string): string => {
  return `fb.1.${Date.now()}.${fbclid}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// Attribution Capture
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Capture attribution from current URL and cookies
 */
const captureAttributionFromUrl = (): AttributionData => {
  if (typeof window === 'undefined') return {};
  
  const url = new URL(window.location.href);
  const pick = (key: string) => url.searchParams.get(key) ?? undefined;
  
  const fbclid = pick('fbclid');
  let fbc = getFbCookie('_fbc');
  const fbp = getFbCookie('_fbp');
  
  // Convert fbclid to _fbc format
  if (fbclid) {
    fbc = formatFbcValue(fbclid);
    setFbCookie('_fbc', fbc);
  }
  
  // Mirror fbp to first-party cookie
  if (fbp && !getFbCookie('_fbp')) {
    setFbCookie('_fbp', fbp);
  }
  
  const data: AttributionData = {
    utm_source: pick('utm_source'),
    utm_medium: pick('utm_medium'),
    utm_campaign: pick('utm_campaign'),
    utm_term: pick('utm_term'),
    utm_content: pick('utm_content'),
    gclid: pick('gclid'),
    msclkid: pick('msclkid'),
    fbc,
    fbp,
    landing_page: window.location.pathname + window.location.search,
  };
  
  // Add channel classification
  data.channel = determineChannel(data);
  
  return data;
};

// ═══════════════════════════════════════════════════════════════════════════
// Three-Tier Storage (Phase 1B)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get stored first touch (never overwritten)
 */
const getFirstTouch = (): AttributionData => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(FIRST_TOUCH_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Set first touch (only if not already set)
 */
const setFirstTouch = (data: AttributionData): void => {
  if (typeof window === 'undefined') return;
  try {
    if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(data));
    }
  } catch {
    console.warn('[Attribution] Failed to save first touch');
  }
};

/**
 * Get stored last non-direct touch
 */
const getLastNonDirect = (): AttributionData => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LAST_NON_DIRECT_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Set last non-direct touch (only if meaningful)
 */
const setLastNonDirect = (data: AttributionData): void => {
  if (typeof window === 'undefined') return;
  
  // CRITICAL: Only update if this is a meaningful touch
  if (!isMeaningfulTouch(data)) {
    return; // Don't overwrite paid attribution with direct
  }
  
  try {
    localStorage.setItem(LAST_NON_DIRECT_KEY, JSON.stringify(data));
  } catch {
    console.warn('[Attribution] Failed to save last non-direct');
  }
};

/**
 * Get stored last touch (always updated)
 */
const getStoredAttribution = (): AttributionData => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Save last touch to storage (always updates)
 */
const saveAttributionToStorage = (data: AttributionData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getStoredAttribution();
    
    // Merge - new non-empty values override existing
    const merged: AttributionData = { ...existing };
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        merged[key as keyof AttributionData] = value;
      }
    });
    
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.warn('[Attribution] Failed to save:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main export: Get attribution data for lead submissions.
 * Returns the last_touch data (most recent session).
 */
export const getAttributionData = (): AttributionData => {
  const urlData = captureAttributionFromUrl();
  
  // Always update last_touch
  saveAttributionToStorage(urlData);
  
  // Set first_touch only once
  setFirstTouch(urlData);
  
  // Update last_non_direct only if meaningful
  setLastNonDirect(urlData);
  
  return getStoredAttribution();
};

/**
 * Get all three attribution tiers for comprehensive tracking
 */
export const getFullAttributionData = (): {
  first_touch: AttributionData;
  last_touch: AttributionData;
  last_non_direct: AttributionData;
} => {
  // Ensure current session is captured
  getAttributionData();
  
  return {
    first_touch: getFirstTouch(),
    last_touch: getStoredAttribution(),
    last_non_direct: getLastNonDirect(),
  };
};

/**
 * Get last non-direct attribution specifically
 * This is what should be used for billing/attribution decisions
 */
export const getLastNonDirectAttribution = (): AttributionData => {
  // Ensure current session is captured
  getAttributionData();
  
  return getLastNonDirect();
};

/**
 * Initialize attribution capture - call once on app startup.
 */
export const initializeAttribution = (): void => {
  if (typeof window === 'undefined') return;
  
  const urlData = captureAttributionFromUrl();
  
  // Update all three tiers appropriately
  saveAttributionToStorage(urlData);
  setFirstTouch(urlData);
  setLastNonDirect(urlData);
  
  if (import.meta.env.DEV) {
    const isMeaningful = isMeaningfulTouch(urlData);
    console.log('[Attribution] Initialized:', {
      channel: urlData.channel,
      is_meaningful: isMeaningful,
      has_gclid: !!urlData.gclid,
      has_fbc: !!urlData.fbc,
    });
  }
};

/**
 * Build AI context data from session data
 */
export const buildAIContextFromSession = (
  sessionData: Partial<SessionData>,
  sourceToolOverride?: SourceTool
): AIContextData => {
  return {
    source_form: sourceToolOverride || sessionData.sourceTool || undefined,
    window_count: typeof sessionData.windowCount === 'number' ? sessionData.windowCount : undefined,
    insurance_carrier: sessionData.insuranceCarrier || undefined,
    urgency_level: sessionData.urgencyLevel || undefined,
    emotional_state: sessionData.emotionalState || undefined,
    specific_detail: sessionData.specificDetail || undefined,
  };
};
