/**
 * Secondary Signal Events
 * 
 * Simplified signal tracking functions for high-value events.
 * These supplement lead_captured events.
 */

import { buildEventMetadata, buildGTMEvent } from './eventMetadataHelper';
import { trackEvent } from './gtm';

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

export async function trackVoiceEstimateConfirmed(params: VoiceEstimateConfirmedParams): Promise<void> {
  const metadata = buildEventMetadata({
    leadId: params.leadId || 'anonymous',
    sourceTool: 'voice-agent',
    conversionAction: 'estimate_confirmed',
  });

  const gtmEvent = buildGTMEvent('voice_estimate_confirmed', metadata, {
    phone_number: params.phone_number,
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
