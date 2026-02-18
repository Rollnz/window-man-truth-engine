/**
 * Secondary Signal Events
 *
 * Analytical signal tracking functions for high-value behavioral events.
 * These supplement lead_captured events for internal reporting only.
 *
 * IMPORTANT: These events are NOT OPT conversion events and must never carry
 * value or currency. Monetary signals are exclusively managed by wmTracking.ts.
 *
 * GTM Firewall: All events include meta.category: 'internal' — ad-platform
 * conversion tags must require meta.category === 'opt' and will never fire here.
 */

import { buildEventMetadata, buildGTMEvent } from './eventMetadataHelper';
import { trackEvent, sha256, hashPhone } from './gtm';
import { normalizeToE164 } from './phoneFormat';

// ═══════════════════════════════════════════════════════════════════════════
// Scanner Upload Completed
// ═══════════════════════════════════════════════════════════════════════════

export interface ScannerUploadCompletedParams {
  leadId?: string;
  file_name?: string;
  file_size: number;
  file_type?: string;
  upload_duration: number;
  upload_success?: boolean;
  page_count?: number;
  extraction_confidence?: number;
}

export async function trackScannerUploadCompleted(params: ScannerUploadCompletedParams): Promise<void> {
  const metadata = buildEventMetadata({
    leadId: params.leadId || 'anonymous',
    sourceTool: 'quote-scanner',
    conversionAction: 'upload_complete',
  });

  const gtmEvent = buildGTMEvent('scanner_upload_completed', metadata, {
    file_name: params.file_name,
    file_size: params.file_size,
    file_type: params.file_type,
    upload_duration: params.upload_duration,
    upload_success: params.upload_success ?? true,
    page_count: params.page_count,
    extraction_confidence: params.extraction_confidence,
  });

  trackEvent('scanner_upload_completed', gtmEvent);
}

// ═══════════════════════════════════════════════════════════════════════════
// Voice Estimate Confirmed
// ═══════════════════════════════════════════════════════════════════════════

export interface VoiceEstimateConfirmedParams {
  leadId?: string;
  email?: string;
  phone_number?: string;
  call_duration: number;
  agent_id?: string;
  agent_confidence: number;
  estimate_value?: number;
  estimate_currency?: string;
  call_transcript_length?: number;
  sentiment_score?: number;
  next_step?: string;
}

/**
 * Track voice estimate confirmed — internal analytics event only.
 *
 * IMPORTANT: This event is intentionally category='internal'.
 * It must NOT carry value or currency — monetary signals belong exclusively
 * in wmTracking.ts OPT events. Adding value here would corrupt ad-platform
 * bidding if a GTM tag were accidentally misconfigured to fire on this event.
 *
 * Includes:
 * - event_id for deduplication
 * - user_data with hashed email (em) and phone (ph) for internal analytics
 * - meta.category: 'internal' — GTM firewall blocks all ad-platform tags
 */
export async function trackVoiceEstimateConfirmed(params: VoiceEstimateConfirmedParams): Promise<void> {
  const event_id = crypto.randomUUID();

  // Build user_data with hashed PII for internal analytics
  const [hashedEmail, hashedPhone] = await Promise.all([
    params.email ? sha256(params.email.toLowerCase().trim()) : Promise.resolve(undefined),
    params.phone_number ? hashPhone(params.phone_number) : Promise.resolve(undefined),
  ]);

  const user_data: Record<string, string | undefined> = {
    external_id: params.leadId,
  };

  // Add hashed email (Google: sha256_email_address, Meta: em)
  if (hashedEmail) {
    user_data.sha256_email_address = hashedEmail;
    user_data.em = hashedEmail;
  }

  // Add hashed phone (Google: sha256_phone_number, Meta: ph)
  if (hashedPhone) {
    user_data.sha256_phone_number = hashedPhone;
    user_data.ph = hashedPhone;
  }

  const metadata = buildEventMetadata({
    leadId: params.leadId || 'anonymous',
    sourceTool: 'voice-agent',
    conversionAction: 'estimate_confirmed',
  });

  const gtmEvent = buildGTMEvent('voice_estimate_confirmed', metadata, {
    event_id,
    // P0-D: NO value or currency — this is an internal analytics event, not an OPT conversion
    meta: {
      send: false,
      category: 'internal',
      wm_tracking_version: '1.0.0',
    },
    user_data,
    // Normalized phone for display (not hashed)
    phone_e164: params.phone_number ? normalizeToE164(params.phone_number) : undefined,
    call_duration: params.call_duration,
    agent_id: params.agent_id,
    agent_confidence: params.agent_confidence,
    estimate_value: params.estimate_value,
    estimate_currency: params.estimate_currency,
    call_transcript_length: params.call_transcript_length,
    sentiment_score: params.sentiment_score,
    next_step: params.next_step,
  });

  trackEvent('voice_estimate_confirmed', gtmEvent);

  if (import.meta.env.DEV) {
    console.log('[GTM] voice_estimate_confirmed pushed with user_data:', { 
      event_id, 
      hasEmail: !!hashedEmail, 
      hasPhone: !!hashedPhone 
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Booking Confirmed
// ═══════════════════════════════════════════════════════════════════════════

export interface BookingConfirmedParams {
  leadId?: string;
  booking_id: string;
  booking_type: string;
  booking_datetime: string;
  booking_duration_minutes?: number;
  calendar_system?: string;
  confirmation_sent?: boolean;
}

export async function trackBookingConfirmed(params: BookingConfirmedParams): Promise<void> {
  const metadata = buildEventMetadata({
    leadId: params.leadId || params.booking_id,
    sourceTool: 'consultation-booking',
    conversionAction: 'booking_confirmed',
  });

  const gtmEvent = buildGTMEvent('booking_confirmed', metadata, {
    booking_id: params.booking_id,
    booking_type: params.booking_type,
    booking_datetime: params.booking_datetime,
    booking_duration_minutes: params.booking_duration_minutes,
    calendar_system: params.calendar_system,
    confirmation_sent: params.confirmation_sent ?? true,
  });

  trackEvent('booking_confirmed', gtmEvent);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tool Completed
// ═══════════════════════════════════════════════════════════════════════════

export interface ToolCompletedParams {
  leadId?: string;
  toolName: string;
  completion_time: number;
  interaction_count: number;
  tool_result?: string;
  user_action_after?: string;
}

export async function trackToolCompleted(params: ToolCompletedParams): Promise<void> {
  const metadata = buildEventMetadata({
    leadId: params.leadId || 'anonymous',
    sourceTool: params.toolName,
    conversionAction: 'tool_completed',
  });

  const gtmEvent = buildGTMEvent('tool_completed', metadata, {
    tool_name: params.toolName,
    completion_time: params.completion_time,
    interaction_count: params.interaction_count,
    tool_result: params.tool_result,
    user_action_after: params.user_action_after,
  });

  trackEvent('tool_completed', gtmEvent);
}
