/**
 * Event Metadata Helper
 * 
 * Standardizes metadata collection and propagation across all tools.
 * Ensures consistent parameter structure for:
 * - GTM dataLayer
 * - Facebook CAPI custom_data
 * - Supabase lead records
 * - Analytics and reporting
 * 
 * RULE: Every lead_captured event must include these 15+ parameters.
 */

import type { IntentTier, FunnelStage, InteractionType } from './intentTierMapping';
import { getIntentTier, getFunnelStage, getInteractionType, getToolName } from './intentTierMapping';
import { getVisitorIdFromCookie } from '@/hooks/useVisitorIdentity';

export interface EventMetadata {
  // DEDUPLICATION & IDENTITY
  external_id: string; // Lead UUID (permanent)
  event_id: string; // Same as external_id for dedup
  visitor_id: string; // Visitor UUID (persistent, 400 days)

  // EVENT TAXONOMY
  lead_source: string; // Machine ID of tool (ai_quote_scanner, fair_price_calc, etc.)
  tool_name: string; // Human-readable tool name
  page_path: string; // Current page path for attribution
  funnel_stage: FunnelStage; // cold / mid / high
  intent_tier: IntentTier; // 1-5 buyer readiness scale
  interaction_type: InteractionType; // form / upload / voice / booking

  // TOOL CONTEXT
  tool_version?: string; // Version of tool (if applicable)
  tool_variant?: string; // A/B test variant (if applicable)
  tool_instance_id?: string; // Unique instance ID for multi-instance tools
  conversion_action?: string; // Specific action within tool (e.g., "form_submit", "upload_complete")

  // TRAFFIC & CAMPAIGN
  traffic_source?: string; // utm_source or referrer
  campaign_id?: string; // utm_campaign
  utm_medium?: string; // utm_medium
  utm_content?: string; // utm_content

  // TIMESTAMP
  event_timestamp?: number; // Unix timestamp in milliseconds
}

export interface EventMetadataInput {
  leadId: string; // Lead UUID
  sourceTool: string; // Tool identifier (lead_source)
  visitorId?: string; // Optional visitor ID (will fetch from cookie if not provided)
  toolVersion?: string;
  toolVariant?: string;
  toolInstanceId?: string;
  conversionAction?: string;
  trafficSource?: string;
  campaignId?: string;
  utmMedium?: string;
  utmContent?: string;
}

/**
 * Build complete event metadata from input parameters
 * 
 * This is the single source of truth for all event metadata.
 * Use this for every lead_captured, scanner_upload_completed, voice_estimate_confirmed event.
 */
export function buildEventMetadata(input: EventMetadataInput): EventMetadata {
  // Get visitor ID from cookie if not provided
  const visitorId = input.visitorId || getVisitorIdFromCookie() || 'unknown';

  // Get intent tier mapping from lead_source
  const intentTier = getIntentTier(input.sourceTool) || 3;
  const funnelStage = getFunnelStage(input.sourceTool) || 'mid';
  const interactionType = getInteractionType(input.sourceTool) || 'form';
  const toolName = getToolName(input.sourceTool) || input.sourceTool;

  // Get current page path
  const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/';

  // Get traffic source from URL or referrer
  const trafficSource = input.trafficSource || getTrafficSource();
  const campaignId = input.campaignId || getCampaignId();

  return {
    // DEDUPLICATION & IDENTITY
    external_id: input.leadId,
    event_id: input.leadId,
    visitor_id: visitorId,

    // EVENT TAXONOMY
    lead_source: input.sourceTool,
    tool_name: toolName,
    page_path: pagePath,
    funnel_stage: funnelStage,
    intent_tier: intentTier,
    interaction_type: interactionType,

    // TOOL CONTEXT
    tool_version: input.toolVersion,
    tool_variant: input.toolVariant,
    tool_instance_id: input.toolInstanceId,
    conversion_action: input.conversionAction,

    // TRAFFIC & CAMPAIGN
    traffic_source: trafficSource,
    campaign_id: campaignId,
    utm_medium: input.utmMedium,
    utm_content: input.utmContent,

    // TIMESTAMP
    event_timestamp: Date.now(),
  };
}

/**
 * Extract traffic source from URL parameters or referrer
 */
function getTrafficSource(): string {
  if (typeof window === 'undefined') return 'unknown';

  // Check utm_source parameter
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  if (utmSource) return utmSource;

  // Check referrer
  const referrer = document.referrer;
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      const domain = referrerUrl.hostname.replace('www.', '');
      if (domain === 'google.com') return 'google';
      if (domain === 'facebook.com') return 'facebook';
      if (domain.includes('instagram')) return 'instagram';
      if (domain.includes('linkedin')) return 'linkedin';
      return domain;
    } catch {
      return 'referral';
    }
  }

  return 'direct';
}

/**
 * Extract campaign ID from URL parameters
 */
function getCampaignId(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const params = new URLSearchParams(window.location.search);
  return params.get('utm_campaign') || undefined;
}

/**
 * Get Facebook Click ID (fbclid) from URL
 * Used for better matching in Facebook CAPI
 */
export function getFacebookClickId(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const params = new URLSearchParams(window.location.search);
  return params.get('fbclid') || undefined;
}

/**
 * Get Facebook Pixel ID from cookie (set by Meta Pixel)
 * Used for browser + server event matching
 */
export function getFacebookPixelId(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  // Meta Pixel stores this in _fbp cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbp' && value) {
      return decodeURIComponent(value);
    }
  }
  return undefined;
}

/**
 * Get Facebook Click ID from cookie (set by Meta Pixel)
 * Used for browser + server event matching
 */
export function getFacebookClickIdFromCookie(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  // Meta Pixel stores this in _fbc cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbc' && value) {
      return decodeURIComponent(value);
    }
  }
  return undefined;
}

/**
 * Build Facebook CAPI custom_data object from event metadata
 * This is what gets sent to Facebook Conversions API
 */
export function buildFacebookCustomData(metadata: EventMetadata): Record<string, any> {
  return {
    // Event taxonomy (for custom conversions and analysis)
    lead_source: metadata.lead_source,
    tool_name: metadata.tool_name,
    funnel_stage: metadata.funnel_stage,
    intent_tier: metadata.intent_tier,
    interaction_type: metadata.interaction_type,

    // Tool context
    tool_version: metadata.tool_version,
    tool_variant: metadata.tool_variant,
    tool_instance_id: metadata.tool_instance_id,
    conversion_action: metadata.conversion_action,

    // Traffic & campaign
    traffic_source: metadata.traffic_source,
    campaign_id: metadata.campaign_id,
    utm_medium: metadata.utm_medium,
    utm_content: metadata.utm_content,

    // Visitor tracking
    visitor_id: metadata.visitor_id,
    page_path: metadata.page_path,
  };
}

/**
 * Build GTM dataLayer event from event metadata
 * This is what gets pushed to the dataLayer for GTM processing
 */
export function buildGTMEvent(
  eventName: string,
  metadata: EventMetadata,
  additionalData?: Record<string, any>
): Record<string, any> {
  return {
    event: eventName,

    // DEDUPLICATION & IDENTITY
    event_id: metadata.event_id,
    external_id: metadata.external_id,
    visitor_id: metadata.visitor_id,

    // EVENT TAXONOMY
    lead_source: metadata.lead_source,
    tool_name: metadata.tool_name,
    page_path: metadata.page_path,
    funnel_stage: metadata.funnel_stage,
    intent_tier: metadata.intent_tier,
    interaction_type: metadata.interaction_type,

    // TOOL CONTEXT
    tool_version: metadata.tool_version,
    tool_variant: metadata.tool_variant,
    tool_instance_id: metadata.tool_instance_id,
    conversion_action: metadata.conversion_action,

    // TRAFFIC & CAMPAIGN
    traffic_source: metadata.traffic_source,
    campaign_id: metadata.campaign_id,
    utm_medium: metadata.utm_medium,
    utm_content: metadata.utm_content,

    // TIMESTAMP
    event_timestamp: metadata.event_timestamp,

    // Additional data
    ...additionalData,
  };
}

/**
 * Validate event metadata for completeness
 * Returns array of missing required fields
 */
export function validateEventMetadata(metadata: EventMetadata): string[] {
  const required = [
    'external_id',
    'event_id',
    'visitor_id',
    'lead_source',
    'tool_name',
    'page_path',
    'funnel_stage',
    'intent_tier',
    'interaction_type',
  ];

  const missing: string[] = [];
  for (const field of required) {
    if (!metadata[field as keyof EventMetadata]) {
      missing.push(field);
    }
  }

  return missing;
}

/**
 * Example: How to use this helper in a tool
 * 
 * ```typescript
 * import { buildEventMetadata, buildGTMEvent } from '@/lib/eventMetadataHelper';
 * import { trackEvent } from '@/lib/gtm';
 * 
 * // In your form submission handler:
 * const metadata = buildEventMetadata({
 *   leadId: result.leadId,
 *   sourceTool: 'ai_quote_scanner',
 *   conversionAction: 'upload_complete',
 *   toolVariant: 'v2_improved',
 * });
 * 
 * // Push to GTM
 * const gtmEvent = buildGTMEvent('lead_captured', metadata, {
 *   email: userEmail,
 *   phone: userPhone,
 * });
 * trackEvent('lead_captured', gtmEvent);
 * ```
 */
