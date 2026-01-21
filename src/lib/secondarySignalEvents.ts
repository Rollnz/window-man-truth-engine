/**
 * Secondary Signal Events
 * 
 * High-intent signals that complement the canonical lead_captured event.
 * These are used for:
 * - Training elite lookalike audiences in Meta
 * - Identifying highest-quality leads for sales routing
 * - Building behavior-based audiences for retargeting
 * 
 * RULE: These DO NOT replace lead_captured. They supplement it.
 * Every secondary signal should also fire lead_captured if it's a new lead.
 */

import type { EventMetadata } from './eventMetadataHelper';
import { buildGTMEvent } from './eventMetadataHelper';
import { trackEvent } from './gtm';

/**
 * EVENT 1: Scanner Upload Completed
 * 
 * Fired when user successfully uploads a quote/document to the AI Quote Scanner.
 * This is an extreme intent signal - user is actively comparing quotes.
 * 
 * Fires on: Browser + Server
 * Intent Tier: 5 (Buying Now)
 * Purpose: Elite lookalike seed, high-quality audience
 */
export interface ScannerUploadCompletedData extends EventMetadata {
  file_name?: string;
  file_size: number; // in bytes
  file_type?: string; // e.g., 'pdf', 'image'
  upload_duration: number; // in milliseconds
  upload_success: boolean;
  page_count?: number; // for PDFs
  extraction_confidence?: number; // 0-100, AI confidence in extraction
}

export async function trackScannerUploadCompleted(data: ScannerUploadCompletedData): Promise<void> {
  // Build GTM event
  const gtmEvent = buildGTMEvent('scanner_upload_completed', data, {
    file_name: data.file_name,
    file_size: data.file_size,
    file_type: data.file_type,
    upload_duration: data.upload_duration,
    upload_success: data.upload_success,
    page_count: data.page_count,
    extraction_confidence: data.extraction_confidence,
  });

  // Push to GTM
  trackEvent('scanner_upload_completed', gtmEvent);

  console.log('[GTM] scanner_upload_completed event pushed:', {
    external_id: data.external_id,
    visitor_id: data.visitor_id,
    file_size: data.file_size,
    upload_duration: data.upload_duration,
    intent_tier: data.intent_tier,
  });
}

/**
 * EVENT 2: Voice Estimate Confirmed
 * 
 * Fired when voice agent successfully completes an estimate call.
 * This is the HIGHEST intent signal - user has spoken to agent and received estimate.
 * 
 * Fires on: Server-side only (triggered from voice system webhook)
 * Intent Tier: 5 (Buying Now)
 * Purpose: Elite lookalike seed, highest-quality audience, sales routing
 * 
 * NOTE: This is typically triggered server-side from voice automation system.
 * The webhook receiver will handle this.
 */
export interface VoiceEstimateConfirmedData extends EventMetadata {
  phone_number?: string; // Hashed phone number (E.164 + SHA-256)
  call_duration: number; // in seconds
  agent_id?: string;
  agent_confidence: number; // 0-100, AI confidence in estimate
  estimate_value?: number; // Estimated project value in dollars
  estimate_currency?: string; // e.g., 'USD'
  call_transcript_length?: number; // Number of words in transcript
  sentiment_score?: number; // -1 to 1 (negative to positive)
  next_step?: string; // e.g., 'schedule_site_visit', 'send_proposal'
}

export async function trackVoiceEstimateConfirmed(data: VoiceEstimateConfirmedData): Promise<void> {
  // Build GTM event
  const gtmEvent = buildGTMEvent('voice_estimate_confirmed', data, {
    phone_number: data.phone_number,
    call_duration: data.call_duration,
    agent_id: data.agent_id,
    agent_confidence: data.agent_confidence,
    estimate_value: data.estimate_value,
    estimate_currency: data.estimate_currency,
    call_transcript_length: data.call_transcript_length,
    sentiment_score: data.sentiment_score,
    next_step: data.next_step,
  });

  // Push to GTM (this will be forwarded to server container)
  trackEvent('voice_estimate_confirmed', gtmEvent);

  console.log('[GTM] voice_estimate_confirmed event pushed:', {
    external_id: data.external_id,
    visitor_id: data.visitor_id,
    call_duration: data.call_duration,
    agent_confidence: data.agent_confidence,
    estimate_value: data.estimate_value,
    intent_tier: data.intent_tier,
  });
}

/**
 * EVENT 3: Booking Confirmed (Optional)
 * 
 * Fired when user successfully books a consultation or site visit.
 * This is also a very high intent signal.
 * 
 * Fires on: Browser + Server
 * Intent Tier: 5 (Buying Now)
 * Purpose: Highest-value signal for optimization
 */
export interface BookingConfirmedData extends EventMetadata {
  booking_id: string;
  booking_type: string; // e.g., 'consultation', 'site_visit', 'estimate_call'
  booking_datetime: string; // ISO 8601 format
  booking_duration_minutes?: number;
  calendar_system?: string; // e.g., 'calendly', 'google_calendar'
  confirmation_sent: boolean;
}

export async function trackBookingConfirmed(data: BookingConfirmedData): Promise<void> {
  // Build GTM event
  const gtmEvent = buildGTMEvent('booking_confirmed', data, {
    booking_id: data.booking_id,
    booking_type: data.booking_type,
    booking_datetime: data.booking_datetime,
    booking_duration_minutes: data.booking_duration_minutes,
    calendar_system: data.calendar_system,
    confirmation_sent: data.confirmation_sent,
  });

  // Push to GTM
  trackEvent('booking_confirmed', gtmEvent);

  console.log('[GTM] booking_confirmed event pushed:', {
    external_id: data.external_id,
    visitor_id: data.visitor_id,
    booking_type: data.booking_type,
    booking_datetime: data.booking_datetime,
    intent_tier: data.intent_tier,
  });
}

/**
 * EVENT 4: Tool Completion (Analytics Only)
 * 
 * Fired when user completes a tool (regardless of whether they submit a lead).
 * This is for analytics and remarketing, NOT for optimization.
 * 
 * Fires on: Browser only
 * Purpose: Analytics, remarketing audiences, funnel analysis
 */
export interface ToolCompletedData extends EventMetadata {
  completion_time: number; // in milliseconds
  interaction_count: number; // number of interactions within tool
  tool_result?: string; // e.g., 'high_savings_potential', 'low_risk'
  user_action_after?: string; // e.g., 'submitted_lead', 'left_page', 'shared_result'
}

export async function trackToolCompleted(data: ToolCompletedData): Promise<void> {
  // Build GTM event
  const gtmEvent = buildGTMEvent('tool_completed', data, {
    completion_time: data.completion_time,
    interaction_count: data.interaction_count,
    tool_result: data.tool_result,
    user_action_after: data.user_action_after,
  });

  // Push to GTM
  trackEvent('tool_completed', gtmEvent);

  console.log('[GTM] tool_completed event pushed:', {
    tool_name: data.tool_name,
    completion_time: data.completion_time,
    interaction_count: data.interaction_count,
  });
}

/**
 * Webhook Handler: Voice Estimate Confirmed (Server-side)
 * 
 * This is called from the voice automation system webhook.
 * It receives the call details and sends to Facebook CAPI.
 * 
 * Endpoint: POST /api/webhooks/voice-estimate-confirmed
 * 
 * Payload:
 * {
 *   phone_number: "+1-555-123-4567",
 *   call_duration: 420,
 *   agent_confidence: 0.92,
 *   estimate_value: 8500,
 *   call_transcript: "...",
 *   next_step: "schedule_site_visit"
 * }
 */
export interface VoiceWebhookPayload {
  phone_number: string;
  call_duration: number;
  agent_id?: string;
  agent_confidence: number;
  estimate_value?: number;
  estimate_currency?: string;
  call_transcript?: string;
  sentiment_score?: number;
  next_step?: string;
}

/**
 * Process voice webhook and send to Facebook CAPI
 * This would be called from your API route handler
 */
export async function processVoiceWebhook(
  payload: VoiceWebhookPayload,
  leadId: string,
  visitorId?: string
): Promise<void> {
  // Hash phone number for matching
  const hashedPhone = await hashPhoneForFacebook(payload.phone_number);

  // Build event data
  const eventData: VoiceEstimateConfirmedData = {
    external_id: leadId,
    event_id: leadId,
    visitor_id: visitorId || 'unknown',
    lead_source: 'voice_agent',
    tool_name: 'Voice Agent - Estimate Confirmed',
    page_path: '/voice-agent',
    funnel_stage: 'high',
    intent_tier: 5,
    interaction_type: 'voice',
    phone_number: hashedPhone,
    call_duration: payload.call_duration,
    agent_id: payload.agent_id,
    agent_confidence: payload.agent_confidence,
    estimate_value: payload.estimate_value,
    estimate_currency: payload.estimate_currency,
    sentiment_score: payload.sentiment_score,
    next_step: payload.next_step,
    event_timestamp: Date.now(),
  };

  // Track the event
  await trackVoiceEstimateConfirmed(eventData);
}

/**
 * Hash phone number for Facebook matching
 * E.164 format + SHA-256
 */
async function hashPhoneForFacebook(phoneNumber: string): Promise<string> {
  // Normalize to E.164 format
  const normalized = normalizeToE164(phoneNumber);

  // Hash with SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Normalize phone to E.164 format
 * E.164 format: +[country code][number]
 * Example: +15551234567
 */
function normalizeToE164(phoneNumber: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phoneNumber.replace(/\D/g, '');

  // If no leading +, assume US (+1)
  if (!phoneNumber.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned; // US number without country code
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // Already has US country code
    }
  }

  // Add + if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}
