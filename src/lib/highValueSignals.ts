/**
 * High-Value Signal Logging
 * 
 * Logs only critical conversion signals to wm_event_log for attribution:
 * - scanner_upload_completed
 * - booking_confirmed
 * - voice_estimate_confirmed
 * 
 * This is NOT for every GTM event - only high-value signals that inform
 * attribution views and Meta optimization segments.
 * 
 * CRITICAL: Raw PII is sent to log-event Edge Function which handles
 * server-side hashing. This ensures PII is never stored raw in the database.
 */

import { getLeadAnchor } from './leadAnchor';
import { getOrCreateClientId, getOrCreateSessionId } from './tracking';
import { getFullAttributionData } from './attribution';
import { generateEventId } from './gtm';
import type { SourceTool } from '@/types/sourceTool';

// Signal event names (strictly controlled)
export type HighValueSignal = 
  | 'scanner_upload_completed'
  | 'booking_confirmed'
  | 'voice_estimate_confirmed'
  | 'voice_estimate_identity'; // Identity event for voice estimate

export interface SignalMetadata {
  // Common
  score?: number;
  quote_amount?: number;
  window_count?: number;
  urgency_level?: string;
  
  // Scanner-specific
  file_size?: number;
  file_type?: string;
  analysis_duration_ms?: number;
  
  // Booking-specific
  booking_time?: string;
  booking_type?: string;
  preferred_time?: string;
  
  // Voice-specific
  call_duration_sec?: number;
  call_sentiment?: string;
  provider_call_id?: string;
  
  // Generic
  [key: string]: unknown;
}

export interface LogSignalParams {
  /** Signal event name (strictly typed) */
  eventName: HighValueSignal;
  /** Source tool for attribution */
  sourceTool: SourceTool;
  /** Explicit lead ID (falls back to anchor if not provided) */
  leadId?: string;
  /** Session ID (falls back to getOrCreateSessionId) */
  sessionId?: string;
  /** Additional metadata */
  metadata?: SignalMetadata;
  /** Funnel stage for journey tracking */
  funnelStage?: string;
  /** Intent tier (1-5) */
  intentTier?: number;
  /** Raw email - will be hashed server-side */
  email?: string;
  /** Raw phone - will be hashed server-side */
  phone?: string;
}

/**
 * Log a high-value signal to wm_event_log via the log-event Edge Function.
 * 
 * This function:
 * 1. Generates a browser-side event_id for deduplication
 * 2. Resolves lead_id from anchor or explicit param
 * 3. Sends raw PII to server (server handles hashing)
 * 4. Sends to log-event with keepalive for reliability
 * 5. Never throws - logs warning on failure
 * 
 * CRITICAL: Raw email/phone can be passed - log-event handles server-side hashing
 * 
 * @example
 * ```ts
 * await logHighValueSignal({
 *   eventName: 'scanner_upload_completed',
 *   sourceTool: 'ai-quote-scanner',
 *   metadata: { score: 85, file_size: 1024000 }
 * });
 * ```
 */
export async function logHighValueSignal(params: LogSignalParams): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const {
    eventName,
    sourceTool,
    leadId,
    sessionId,
    metadata = {},
    funnelStage,
    intentTier,
    email,
    phone,
  } = params;

  try {
    // Generate browser-side event_id for deduplication
    const eventId = generateEventId();
    
    // Resolve lead linkage (anchor takes precedence, then explicit param)
    const resolvedLeadId = getLeadAnchor() || leadId || null;
    
    // Get client and session IDs
    const clientId = getOrCreateClientId();
    const resolvedSessionId = sessionId || getOrCreateSessionId();
    
    // Get attribution for traffic source tracking
    const attribution = getFullAttributionData();
    const lastTouch = attribution.last_touch || {};
    
    // Build payload matching wm_event_log schema
    // IMPORTANT: Raw email/phone are passed to server for server-side hashing
    const payload: Record<string, unknown> = {
      event_id: eventId,
      event_name: eventName,
      event_type: 'signal',
      event_time: new Date().toISOString(),
      
      // Identity linkage (critical for attribution views)
      lead_id: resolvedLeadId,
      client_id: clientId,
      session_id: resolvedSessionId,
      external_id: resolvedLeadId, // For Meta CAPI matching
      
      // RAW PII - log-event will hash server-side
      // This ensures the database ONLY stores hashed values
      email: email || null,
      phone: phone || null,
      
      // Attribution
      source_tool: sourceTool,
      page_path: window.location.pathname,
      funnel_stage: funnelStage || 'conversion',
      intent_tier: intentTier,
      
      // Traffic source (from last touch)
      traffic_source: lastTouch.utm_source || null,
      traffic_medium: lastTouch.utm_medium || null,
      campaign_id: lastTouch.utm_campaign || null,
      fbclid: lastTouch.fbc || null,
      gclid: lastTouch.gclid || null,
      
      // Metadata (no PII should be in here)
      metadata: {
        ...metadata,
        browser_event_id: eventId, // For GTM-to-CAPI matching
        user_agent: navigator.userAgent,
      },
      
      // Source system
      source_system: 'web',
      ingested_by: 'high-value-signal',
    };

    // Get the log secret from environment (only works if embedded at build time)
    const logSecret = import.meta.env.VITE_WM_LOG_SECRET as string | undefined;
    
    // Build headers - prefer secret header, fallback to anon key
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (logSecret) {
      headers['X-WM-LOG-SECRET'] = logSecret;
    } else {
      // Fallback: Use Supabase anon key auth pattern
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
      if (anonKey) {
        headers['apikey'] = anonKey;
        headers['Authorization'] = `Bearer ${anonKey}`;
      } else {
        console.warn('[highValueSignals] No auth available, skipping signal:', eventName);
        return;
      }
    }

    // Send to log-event with keepalive for reliability on page unload
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-event`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        keepalive: true,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.warn('[highValueSignals] Failed to log signal:', eventName, response.status, errorText);
      return;
    }

    const result = await response.json();
    
    if (result.duplicate) {
      console.log('[highValueSignals] Duplicate signal (already logged):', eventName, eventId.slice(0, 8));
    } else {
      console.log('[highValueSignals] Signal logged:', eventName, {
        event_id: eventId.slice(0, 8),
        lead_id: resolvedLeadId?.slice(0, 8) || 'none',
        source_tool: sourceTool,
        has_email: !!email,
        has_phone: !!phone,
      });
    }
  } catch (error) {
    // Never throw - log warning only
    console.warn('[highValueSignals] Error logging signal:', eventName, error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Pre-configured signal functions for common use cases
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log scanner upload completion signal
 */
export async function logScannerCompleted(params: {
  score?: number;
  quoteAmount?: number;
  fileSize?: number;
  fileType?: string;
  analysisDurationMs?: number;
  leadId?: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  return logHighValueSignal({
    eventName: 'scanner_upload_completed',
    sourceTool: 'quote-scanner',
    leadId: params.leadId,
    email: params.email,
    phone: params.phone,
    intentTier: 4, // High intent - actively comparing quotes
    funnelStage: 'evaluation',
    metadata: {
      score: params.score,
      quote_amount: params.quoteAmount,
      file_size: params.fileSize,
      file_type: params.fileType,
      analysis_duration_ms: params.analysisDurationMs,
    },
  });
}

/**
 * Log booking confirmation signal
 */
export async function logBookingConfirmed(params: {
  preferredTime?: string;
  bookingType?: string;
  windowCount?: number;
  projectValue?: number;
  urgencyLevel?: string;
  leadId?: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  return logHighValueSignal({
    eventName: 'booking_confirmed',
    sourceTool: 'expert-system', // Default consultation source
    leadId: params.leadId,
    email: params.email,
    phone: params.phone,
    intentTier: 5, // Highest intent - ready to talk
    funnelStage: 'decision',
    metadata: {
      preferred_time: params.preferredTime,
      booking_type: params.bookingType || 'consultation',
      window_count: params.windowCount,
      quote_amount: params.projectValue,
      urgency_level: params.urgencyLevel,
    },
  });
}

/**
 * Log voice estimate confirmation signal
 * 
 * This function:
 * 1. Logs to the database ledger with identity (email/phone sent for server-side hashing)
 * 2. Fires the GTM event with client-side hashed PII for Enhanced Conversions
 * 
 * CRITICAL: Raw email/phone are passed to log-event for server-side hashing.
 * GTM event uses client-side hashing for immediate browser-side tracking.
 * 
 * @param params.email - Lead's email for identity matching
 * @param params.phone - Lead's phone for identity matching
 */
export async function logVoiceEstimateConfirmed(params: {
  callDurationSec?: number;
  callSentiment?: string;
  providerCallId?: string;
  leadId?: string;
  email?: string;
  phone?: string;
  agentId?: string;
  agentConfidence?: number;
}): Promise<void> {
  // 1. Log to database ledger with raw PII (server will hash)
  await logHighValueSignal({
    eventName: 'voice_estimate_confirmed',
    sourceTool: 'expert-system', // Voice AI uses expert-system as base
    leadId: params.leadId,
    email: params.email,    // Raw - server will hash
    phone: params.phone,    // Raw - server will hash
    intentTier: 5, // Highest intent - engaged with voice AI
    funnelStage: 'decision',
    metadata: {
      call_duration_sec: params.callDurationSec,
      call_sentiment: params.callSentiment,
      provider_call_id: params.providerCallId,
      agent_id: params.agentId,
      agent_confidence: params.agentConfidence,
    },
  });

  // 2. Fire GTM event with CLIENT-SIDE hashed PII for Enhanced Conversions
  // Import dynamically to avoid circular dependencies
  const { trackVoiceEstimateConfirmed } = await import('./secondarySignalEvents');
  await trackVoiceEstimateConfirmed({
    leadId: params.leadId,
    email: params.email,           // Will be hashed client-side in secondarySignalEvents
    phone_number: params.phone,    // Will be hashed client-side in secondarySignalEvents
    call_duration: params.callDurationSec || 0,
    agent_id: params.agentId,
    agent_confidence: params.agentConfidence || 0,
    sentiment_score: params.callSentiment === 'positive' ? 1 : params.callSentiment === 'negative' ? -1 : 0,
  });
}
