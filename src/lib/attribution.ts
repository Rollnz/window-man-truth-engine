/**
 * Attribution data capture and persistence for lead tracking.
 * Captures UTM parameters, click IDs, and persists them in localStorage
 * so attribution is preserved across the user's session.
 */

import { SessionData } from '@/hooks/useSessionData';
import { SourceTool } from '@/types/sourceTool';

const ATTRIBUTION_STORAGE_KEY = 'wm_attribution_data';

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
}

export interface AIContextData {
  source_form?: string;
  specific_detail?: string;
  emotional_state?: string;
  urgency_level?: string;
  insurance_carrier?: string;
  window_count?: number;
}

/**
 * Get a Facebook cookie value by name
 */
const getFbCookie = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match?.[1] || undefined;
  } catch {
    return undefined;
  }
};

/**
 * Set a first-party cookie for Facebook attribution.
 * This ensures Meta Pixel accuracy even if their script is blocked.
 */
const setFbCookie = (name: string, value: string): void => {
  if (typeof window === 'undefined' || !value) return;
  try {
    const domain = window.location.hostname;
    const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString(); // 90 days
    document.cookie = `${name}=${value}; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`;
  } catch (error) {
    console.warn('[Attribution] Failed to set FB cookie:', error);
  }
};

/**
 * Convert fbclid URL parameter to _fbc cookie format.
 * Format: fb.1.{timestamp}.{fbclid}
 */
const formatFbcValue = (fbclid: string): string => {
  return `fb.1.${Date.now()}.${fbclid}`;
};

/**
 * Get attribution parameters from URL and cookies, then persist to localStorage.
 * Also mirrors Facebook values to first-party cookies for Meta Pixel accuracy.
 */
const captureAttributionFromUrl = (): AttributionData => {
  if (typeof window === 'undefined') return {};
  
  const url = new URL(window.location.href);
  const pick = (key: string) => url.searchParams.get(key) ?? undefined;
  
  const fbclid = pick('fbclid');
  let fbc = getFbCookie('_fbc');
  const fbp = getFbCookie('_fbp');
  
  // If we have fbclid in URL, convert to _fbc format and set cookie
  if (fbclid) {
    fbc = formatFbcValue(fbclid);
    setFbCookie('_fbc', fbc);
  }
  
  // Mirror fbp to first-party cookie if it exists but cookie doesn't
  if (fbp && !getFbCookie('_fbp')) {
    setFbCookie('_fbp', fbp);
  }
  
  const urlAttribution: AttributionData = {
    utm_source: pick('utm_source'),
    utm_medium: pick('utm_medium'),
    utm_campaign: pick('utm_campaign'),
    utm_term: pick('utm_term'),
    utm_content: pick('utm_content'),
    gclid: pick('gclid'),
    msclkid: pick('msclkid'),
    fbc,
    fbp,
  };
  
  return urlAttribution;
};

/**
 * Save attribution data to localStorage (only saves non-empty values)
 */
const saveAttributionToStorage = (data: AttributionData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing data first
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

/**
 * Get stored attribution from localStorage
 */
const getStoredAttribution = (): AttributionData => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[Attribution] Failed to read:', error);
  }
  return {};
};

/**
 * Main export: Get attribution data for lead submissions.
 * Combines URL params with stored data, persisting new values.
 * Call this every time you're about to submit a lead.
 */
export const getAttributionData = (): AttributionData => {
  // Capture from current URL
  const urlData = captureAttributionFromUrl();
  
  // Save to localStorage (merges with existing)
  saveAttributionToStorage(urlData);
  
  // Return the merged result
  return getStoredAttribution();
};

/**
 * Initialize attribution capture - call once on app startup.
 * This ensures attribution is captured even if user doesn't convert immediately.
 */
export const initializeAttribution = (): void => {
  if (typeof window === 'undefined') return;
  
  const urlData = captureAttributionFromUrl();
  saveAttributionToStorage(urlData);
};

/**
 * Build AI context data from session data
 */
export const buildAIContextFromSession = (
  sessionData: Partial<SessionData>,
  sourceToolOverride?: SourceTool
): AIContextData => {
  return {
    // Prefer the explicit source tool passed in; fall back to session data
    source_form: sourceToolOverride || sessionData.sourceTool || undefined,
    window_count: typeof sessionData.windowCount === 'number' ? sessionData.windowCount : undefined,
    insurance_carrier: sessionData.insuranceCarrier || undefined,
    urgency_level: sessionData.urgencyLevel || undefined,
    emotional_state: sessionData.emotionalState || undefined,
    specific_detail: sessionData.specificDetail || undefined,
  };
};
