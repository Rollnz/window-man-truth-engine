// Google Tag Manager utilities with Enhanced Conversion Support
// Phase 1-4: Professional-grade conversion tracking system with Persistent Identity

export const GTM_ID = 'GTM-NHVFR5QZ';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Imports
// ═══════════════════════════════════════════════════════════════════════════

import type { SourceTool } from '@/types/sourceTool';
import type { LeadQuality } from '@/lib/leadQuality';
import { normalizeToE164 } from '@/lib/phoneFormat';
import { calculateLeadScore, getRoutingAction, getCRMTags } from '@/lib/leadScoringEngine';
import { buildEventMetadata, buildGTMEvent, type EventMetadataInput } from './eventMetadataHelper';

// ═══════════════════════════════════════════════════════════════════════════
// SHA-256 Hashing for Enhanced Conversions (GA4 + Meta CAPI)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SHA-256 hash function for Enhanced Conversions
 * Hashes PII (email, phone) for privacy-safe server matching
 * 
 * NORMALIZATION: Email is lowercased and trimmed before hashing
 */
export async function sha256(text: string): Promise<string> {
  if (!text) return '';
  try {
    const encoder = new TextEncoder();
    // Normalize: lowercase and trim (Google requirement)
    const data = encoder.encode(text.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.warn('[GTM] SHA-256 hashing failed:', error);
    return '';
  }
}

/**
 * Safe hash wrapper that never throws
 * Returns undefined on any failure instead of throwing
 */
async function safeHash(text: string | undefined | null): Promise<string | undefined> {
  if (!text) return undefined;
  try {
    const hash = await sha256(text);
    return hash || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Hash phone number with E.164 normalization
 * 
 * IMPORTANT: Google expects E.164 format (+1XXXXXXXXXX) for phone hashing
 * Invalid phone numbers return undefined to avoid match quality issues
 */
export async function hashPhone(phone: string | undefined | null): Promise<string | undefined> {
  if (!phone) return undefined;
  
  // Normalize to E.164 first (returns undefined if invalid)
  const e164 = normalizeToE164(phone);
  if (!e164) {
    if (import.meta.env.DEV) {
      console.warn('[GTM] Phone number could not be normalized to E.164:', phone);
    }
    return undefined;
  }
  
  // Hash the E.164 formatted number
  return safeHash(e164);
}

// ═══════════════════════════════════════════════════════════════════════════
// Core Event Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Push an event to the GTM dataLayer
 */
export const trackEvent = (eventName: string, eventData?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }
};

export const trackPageView = (url: string) => {
  trackEvent('page_view', { page_path: url });
};

// ═══════════════════════════════════════════════════════════════════════════
// Standardized Lead Capture Tracking (Phase 4)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track lead capture (email submitted) - PHASE 4 PERSISTENT IDENTITY + METADATA
 * 
 * CRITICAL: This is the canonical lead tracking function.
 * It uses buildEventMetadata to ensure all 15+ parameters are included.
 * Handles PII hashing and GTM dataLayer push.
 */
export const trackLeadCapture = async (
  input: EventMetadataInput,
  email: string,
  phone?: string,
  additionalData?: {
    hasAddress?: boolean;
    hasProjectDetails?: boolean;
    hasName?: boolean;
  }
) => {
  try {
    // 1. Build standardized metadata (includes visitor_id, intent_tier, funnel_stage, etc.)
    const metadata = buildEventMetadata(input);

    // 2. Hash PII for Meta CAPI (Phase 2 requirement - EMQ ≥ 8.0)
    const hashedEmail = await safeHash(email);
    const hashedPhone = phone ? await hashPhone(phone) : undefined;

    // 3. Calculate lead score for internal routing (Phase 3 requirement)
    const leadScoreData = calculateLeadScore({
      intentTier: metadata.intent_tier,
      leadSource: metadata.lead_source as SourceTool,
      hasEmail: !!email,
      hasPhone: !!phone,
      hasAddress: additionalData?.hasAddress,
      hasProjectDetails: additionalData?.hasProjectDetails,
      hasName: additionalData?.hasName,
    });

    // 4. Get routing and tags
    const routingAction = getRoutingAction(leadScoreData.finalScore);
    const crmTags = getCRMTags({
      intentTier: metadata.intent_tier,
      leadSource: metadata.lead_source as SourceTool,
      hasEmail: !!email,
      hasPhone: !!phone,
      hasAddress: additionalData?.hasAddress,
      hasProjectDetails: additionalData?.hasProjectDetails,
      hasName: additionalData?.hasName,
      finalScore: leadScoreData.finalScore,
    });

    // 5. Build final GTM event payload (Phase 4 requirement - 15+ parameters)
    const gtmEvent = buildGTMEvent('lead_captured', metadata, {
      // Lead Scoring
      lead_score: leadScoreData.finalScore,
      lead_score_breakdown: {
        base_score: leadScoreData.baseScore,
        tool_multiplier: leadScoreData.toolMultiplier,
        data_bonus: leadScoreData.dataBonus,
      },
      routing_action: routingAction.action,
      routing_priority: routingAction.priority,
      crm_tags: crmTags,

      // User Data for EMQ
      user_data: {
        external_id: metadata.external_id,
        em: hashedEmail,
        ph: hashedPhone,
      },

      // Legacy fields for backward compatibility
      source_tool: metadata.lead_source,
      email_domain: email.split('@')[1] || 'unknown',
      has_phone: !!phone,
      conversion_type: 'lead',
      lead_id: metadata.external_id,
    });

    // 6. Push to dataLayer
    trackEvent('lead_captured', gtmEvent);

    console.log('[GTM] lead_captured event pushed with full metadata:', {
      leadId: metadata.external_id,
      visitorId: metadata.visitor_id,
      sourceTool: metadata.lead_source,
      intentTier: metadata.intent_tier,
      leadScore: leadScoreData.finalScore,
      routing: routingAction.action
    });
  } catch (error) {
    console.error('[GTM] Error tracking lead capture:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Legacy & Specialized Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track consultation booking
 */
export const trackConsultationBooked = async (params: {
  leadId: string;
  email: string;
  phone: string;
  metadata?: any;
}) => {
  const hashedEmail = await safeHash(params.email);
  const hashedPhone = await hashPhone(params.phone);
  
  trackEvent('consultation_booked', {
    lead_id: params.leadId,
    event_id: params.leadId,
    external_id: params.leadId,
    user_data: {
      sha256_email_address: hashedEmail,
      sha256_phone_number: hashedPhone,
      external_id: params.leadId,
    },
    conversion_metadata: params.metadata,
  });
};

/**
 * Track AI Scan results
 */
export const trackScanResult = (params: {
  scanType: 'quote' | 'evidence' | 'claim';
  status: 'success' | 'error' | 'partial';
  quoteAmount?: number;
  errorReason?: string;
}) => {
  trackEvent('ai_scan_complete', {
    scan_type: params.scanType,
    scan_status: params.status,
    quote_amount: params.quoteAmount,
    error_reason: params.errorReason,
  });
};
