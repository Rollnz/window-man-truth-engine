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
 */

import { getLeadAnchor } from './leadAnchor';
import { getOrCreateClientId, getOrCreateSessionId } from './tracking';
import { getAttributionData, getFullAttributionData } from './attribution';
import type { SourceTool } from '@/types/sourceTool';

// Signal event names (strictly controlled)
export type HighValueSignal = 
  | 'scanner_upload_completed'
  | 'booking_confirmed'
  | 'voice_estimate_confirmed';

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
}

/**
 * Log a high-value signal to wm_event_log via the log-event Edge Function.
 * 
 * This function:
 * 1. Generates a browser-side event_id for deduplication
 * 2. Resolves lead_id from anchor or explicit param
 * 3. Sends to log-event with keepalive for reliability
 * 4. Never throws - logs warning on failure
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
  } = params;

  try {
    // Generate browser-side event_id for deduplication
    const eventId = crypto.randomUUID();
    
    // Resolve lead linkage (anchor takes precedence, then explicit param)
    const resolvedLeadId = getLeadAnchor() || leadId || null;
    
    // Get client and session IDs
    const clientId = getOrCreateClientId();
    const resolvedSessionId = sessionId || getOrCreateSessionId();
    
    // Get attribution for traffic source tracking
    const attribution = getFullAttributionData();
    const lastTouch = attribution.last_touch || {};
    
    // Build payload matching wm_event_log schema
    const payload = {
      event_id: eventId,
      event_name: eventName,
      event_type: 'signal',
      event_time: new Date().toISOString(),
      
      // Identity linkage (critical for attribution views)
      lead_id: resolvedLeadId,
      client_id: clientId,
      session_id: resolvedSessionId,
      
      // Attribution
      source_tool: sourceTool,
      page_path: window.location.pathname,
      funnel_stage: funnelStage || 'conversion',
      intent_tier: intentTier,
      
      // Traffic source (from last touch)
      traffic_source: lastTouch.utm_source || null,
      traffic_medium: lastTouch.utm_medium || null,
      campaign_id: lastTouch.utm_campaign || null,
      fbclid: lastTouch.fbc || null, // fbc contains fbclid
      gclid: lastTouch.gclid || null,
      
      // Metadata
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
}): Promise<void> {
  return logHighValueSignal({
    eventName: 'scanner_upload_completed',
    sourceTool: 'quote-scanner',
    leadId: params.leadId,
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
}): Promise<void> {
  return logHighValueSignal({
    eventName: 'booking_confirmed',
    sourceTool: 'expert-system', // Default consultation source
    leadId: params.leadId,
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
 * This function logs to the database ledger AND fires the GTM event
 * with hashed PII for Enhanced Conversions.
 * 
 * @param params.email - Lead's email for Enhanced Conversions matching
 * @param params.phone - Lead's phone for Enhanced Conversions matching
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
  // Log to database ledger
  await logHighValueSignal({
    eventName: 'voice_estimate_confirmed',
    sourceTool: 'expert-system', // Voice AI uses expert-system as base
    leadId: params.leadId,
    intentTier: 5, // Highest intent - engaged with voice AI
    funnelStage: 'decision',
    metadata: {
      call_duration_sec: params.callDurationSec,
      call_sentiment: params.callSentiment,
      provider_call_id: params.providerCallId,
    },
  });

  // Also fire GTM event with hashed PII for Enhanced Conversions
  // Import dynamically to avoid circular dependencies
  const { trackVoiceEstimateConfirmed } = await import('./secondarySignalEvents');
  await trackVoiceEstimateConfirmed({
    leadId: params.leadId,
    email: params.email,
    phone_number: params.phone,
    call_duration: params.callDurationSec || 0,
    agent_id: params.agentId,
    agent_confidence: params.agentConfidence || 0,
    sentiment_score: params.callSentiment === 'positive' ? 1 : params.callSentiment === 'negative' ? -1 : 0,
  });
}
