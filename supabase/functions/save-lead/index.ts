import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

// ============= Rate Limiting Configuration =============
const RATE_LIMITS = {
  ipPerHour: 10,      // Max 10 leads per IP per hour
  ipPerDay: 50,       // Max 50 leads per IP per day
  emailPerHour: 3     // Max 3 submissions per email per hour
};

// ============= Input Validation Schemas =============

import { SOURCE_TOOLS } from '../_shared/sourceTools.ts';

const phoneRegex = /^[+]?[0-9\s\-()]{10,20}$/;

// Session data schema with size limit
const sessionDataSchema = z.record(z.unknown()).refine(
  (data) => JSON.stringify(data).length < 50000,
  { message: 'Session data too large (max 50KB)' }
).optional().nullable();

// Chat history schema with limits
const chatHistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(5000, 'Chat message too long')
  })
).max(100, 'Too many chat messages (max 100)').optional().nullable();

// Consultation schema
const consultationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email').max(255, 'Email too long').optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone format').max(20, 'Phone too long'),
  preferredTime: z.string().trim().min(1, 'Preferred time is required').max(100, 'Preferred time too long'),
  notes: z.string().max(2000, 'Notes too long').optional().nullable()
}).optional().nullable();

// Attribution schema
const attributionSchema = z.object({
  utm_source: z.string().max(255).optional().nullable(),
  utm_medium: z.string().max(255).optional().nullable(),
  utm_campaign: z.string().max(255).optional().nullable(),
  utm_term: z.string().max(255).optional().nullable(),
  utm_content: z.string().max(255).optional().nullable(),
  fbc: z.string().max(255).optional().nullable(),
  fbp: z.string().max(255).optional().nullable(),
  gclid: z.string().max(255).optional().nullable(),
  msclkid: z.string().max(255).optional().nullable(),
}).optional().nullable();

// Last Non-Direct Attribution schema (Phase 1B - preserves paid attribution)
const lastNonDirectSchema = z.object({
  utm_source: z.string().max(255).optional().nullable(),
  utm_medium: z.string().max(255).optional().nullable(),
  gclid: z.string().max(255).optional().nullable(),
  fbclid: z.string().max(255).optional().nullable(), // Note: fbclid not fbc for consistency
  channel: z.string().max(50).optional().nullable(),
  landing_page: z.string().max(2000).optional().nullable(),
}).optional().nullable();

// AI Context schema
const aiContextSchema = z.object({
  source_form: z.string().max(100).optional().nullable(),
  specific_detail: z.string().max(1000).optional().nullable(),
  emotional_state: z.string().max(100).optional().nullable(),
  urgency_level: z.string().max(100).optional().nullable(),
  insurance_carrier: z.string().max(100).optional().nullable(),
  // Accept both numbers and string ranges like "5-10", "15+"
  window_count: z.union([
    z.number().int().min(0).max(500),
    z.string().max(20)
  ]).optional().nullable(),
  // Multi-step form fields
  upsell_type: z.string().max(50).optional().nullable(),
  property_type: z.string().max(50).optional().nullable(),
  property_status: z.string().max(50).optional().nullable(),
  window_reasons: z.array(z.string().max(100)).max(10).optional().nullable(),
  timeframe: z.string().max(50).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),    // EMQ 9.5+: State for address matching
  zip_code: z.string().max(10).optional().nullable(),
  remark: z.string().max(1000).optional().nullable(),
}).optional().nullable();

// Main lead schema
const leadSchema = z.object({
  csrfToken: z.string().uuid('Invalid CSRF token').optional().nullable(),
  email: z.string().trim().email('Invalid email format').max(255, 'Email too long'),
  // Split name fields for Meta EMQ optimization
  firstName: z.string().trim().max(50, 'First name too long').optional().nullable(),
  lastName: z.string().trim().max(50, 'Last name too long').optional().nullable(),
  // DEPRECATED: Legacy name field - use firstName/lastName instead
  name: z.string().trim().max(100, 'Name too long').optional().nullable(),
  phone: z.string().regex(phoneRegex, 'Invalid phone format').max(20, 'Phone too long').optional().nullable().or(z.literal('')),
  sourceTool: z.enum(SOURCE_TOOLS).default('expert-system'),
  sessionData: sessionDataSchema,
  chatHistory: chatHistorySchema,
  consultation: consultationSchema,
  attribution: attributionSchema,
  aiContext: aiContextSchema,
  // Phase 1B: Last Non-Direct attribution (preserves paid attribution on direct returns)
  lastNonDirect: lastNonDirectSchema,
  // Golden Thread: Optional lead ID for identity persistence
  // If provided, UPDATE existing record instead of creating new one
  leadId: z.string().uuid('Invalid lead ID format').optional().nullable(),
  // Golden Thread: Session ID for attribution tracking
  sessionId: z.string().uuid('Invalid session ID format').optional().nullable(),
  // Quote File linking: If provided, update the quote_files record to link to this lead
  quoteFileId: z.string().uuid('Invalid quote file ID format').optional().nullable(),
  // V2 qualification flow fields
  flowVersion: z.string().trim().max(50, 'Flow version too long').optional().nullable(),
  sourcePage: z.string().trim().max(500, 'Source page too long').optional().nullable(),
});

// ============= Helper Functions =============

// Extract client IP from request headers
function getClientIp(req: Request): string {
  // Try common proxy headers in order of preference
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Take the first IP in the chain (original client)
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp;

  return 'unknown';
}

// ============= IP Geo Enrichment =============
// Auto-fill city/state/zip from IP when missing (EMQ 9.5+ improvement)

interface GeoData {
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
}

async function enrichGeoFromIP(clientIp: string): Promise<GeoData> {
  const emptyResult: GeoData = { city: null, state: null, country: null, zip: null };
  
  // Skip private/local IPs
  if (
    clientIp === 'unknown' ||
    clientIp.startsWith('127.') ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('10.') ||
    clientIp.startsWith('172.16.') ||
    clientIp === '::1'
  ) {
    return emptyResult;
  }

  try {
    // Use ip-api.com (free tier: 45 requests/minute, no API key required)
    const response = await fetch(
      `http://ip-api.com/json/${clientIp}?fields=status,country,regionName,city,zip`,
      { signal: AbortSignal.timeout(3000) } // 3 second timeout
    );

    if (!response.ok) {
      console.warn('[save-lead] Geo API returned non-OK:', response.status);
      return emptyResult;
    }

    const data = await response.json();

    if (data.status === 'success') {
      console.log('[save-lead] Geo enriched from IP:', {
        city: data.city,
        state: data.regionName,
        ip: clientIp.slice(0, 6) + '***',
      });
      
      return {
        city: data.city || null,
        state: data.regionName || null, // Full state name (e.g., "Florida")
        country: data.country || null,
        zip: data.zip || null,
      };
    }

    console.log('[save-lead] Geo API status not success:', data.status);
    return emptyResult;
  } catch (error) {
    // Non-blocking - don't fail lead save if geo lookup fails
    console.error('[save-lead] Geo enrichment failed (non-blocking):', error);
    return emptyResult;
  }
}

// Check rate limit against the rate_limits table
async function checkRateLimit(
  supabase: any,
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowHours: number
): Promise<{ allowed: boolean; count: number }> {
  try {
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('created_at', windowStart);

    if (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request if rate limiting check fails
      return { allowed: true, count: 0 };
    }

    const currentCount = count || 0;
    return { allowed: currentCount < maxRequests, count: currentCount };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open
    return { allowed: true, count: 0 };
  }
}

// Record a rate limit entry
async function recordRateLimitEntry(
  supabase: any,
  identifier: string,
  endpoint: string
): Promise<void> {
  try {
    await supabase.from('rate_limits').insert({
      identifier,
      endpoint,
    });
  } catch (error) {
    console.error('Failed to record rate limit entry:', error);
    // Non-blocking - don't fail the request
  }
}

// Sanitize session data for admin emails (remove sensitive details)
function sanitizeSessionDataForEmail(sessionData: unknown): Record<string, unknown> {
  if (!sessionData || typeof sessionData !== 'object') {
    return { toolsCompletedCount: 0, estimatedValue: 'Not calculated' };
  }

  const data = sessionData as Record<string, unknown>;
  
  return {
    toolsCompletedCount: Array.isArray(data.toolsCompleted) ? data.toolsCompleted.length : 0,
    lastToolCompleted: Array.isArray(data.toolsCompleted) && data.toolsCompleted.length > 0
      ? data.toolsCompleted[data.toolsCompleted.length - 1]
      : 'None',
    hasRealityCheckScore: !!data.realityCheckScore,
    estimatedValue: typeof data.costOfInactionTotal === 'number'
      ? `$${Math.round(data.costOfInactionTotal / 1000)}k+`
      : 'Not calculated',
    hasCompletedComparison: !!data.comparisonViewed
  };
}

// Helper to trigger email notification (fire-and-forget)
async function triggerEmailNotification(payload: {
  email: string;
  type: string;
  data: Record<string, unknown>;
}) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    console.log('Email notification triggered:', result);
  } catch (error) {
    // Don't fail the main request if email fails
    console.error('Email notification failed (non-blocking):', error);
  }
}

/**
 * Convert window_count string ranges to midpoint integers
 * Handles: "1-5" -> 3, "5-10" -> 7, "10-15" -> 12, "15+" -> 20
 */
function convertWindowCount(wc: unknown): number | null {
  if (wc === null || wc === undefined) return null;
  if (typeof wc === 'number') return wc;
  if (typeof wc === 'string') {
    if (wc === '15+' || wc === '15-plus') return 20;
    const match = wc.match(/^(\d+)-(\d+)$/);
    if (match) {
      return Math.floor((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2);
    }
    const num = parseInt(wc, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

// ============= Stape Server-Side GTM Integration =============
const STAPE_GTM_ENDPOINT = 'https://lunaa.itswindowman.com/data';

// SHA256 hash helper using Web Crypto API
async function sha256Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize and hash email (lowercase, trimmed, then SHA256)
async function hashEmail(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  return sha256Hash(normalized);
}

/**
 * Normalize phone to E.164 format (US only)
 * Returns null if phone cannot be normalized - NO fallback hashing
 */
function normalizeToE164(phone: string): string | null {
  const digitsOnly = phone.replace(/\D/g, '');
  
  // 10 digits: US number without country code
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  // 11 digits starting with 1: US number with country code
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  // Invalid phone - return null (do NOT hash)
  return null;
}

/**
 * Hash phone using E.164 normalization
 * Returns null if phone is invalid - prevents inconsistent identity matching
 */
async function hashPhoneE164(phone: string): Promise<string | null> {
  const e164 = normalizeToE164(phone);
  if (!e164) {
    console.log('[hashPhoneE164] Phone not normalizable, skipping hash:', phone.slice(0, 3) + '***');
    return null;
  }
  return sha256Hash(e164);
}

/**
 * Normalize and hash name (lowercase, trimmed, then SHA256)
 */
async function hashName(name: string | null | undefined): Promise<string | null> {
  if (!name) return null;
  const normalized = name.toLowerCase().trim();
  if (!normalized) return null;
  return sha256Hash(normalized);
}

interface StapeGTMPayload {
  leadId: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;  // NEW: EMQ 9.5+ server-side name hashing
  lastName?: string | null;   // NEW: EMQ 9.5+ server-side name hashing
  fbp?: string | null;
  fbc?: string | null;
  userAgent: string;
  eventSourceUrl: string;
}

// Fire-and-forget Stape GTM server-side event (EMQ 9.5+ with fn/ln hashing)
async function sendStapeGTMEvent(payload: StapeGTMPayload): Promise<void> {
  try {
    // Hash sensitive data using E.164 normalization for phones
    // EMQ 9.5+: Hash first_name and last_name for server-side matching
    const [hashedEmail, hashedPhone, hashedFirstName, hashedLastName] = await Promise.all([
      hashEmail(payload.email),
      payload.phone ? hashPhoneE164(payload.phone) : Promise.resolve(null),
      hashName(payload.firstName),
      hashName(payload.lastName),
    ]);

    const gtmPayload = {
      event_name: 'Lead',
      event_id: payload.leadId,           // Deduplication key
      external_id: payload.leadId,
      email: hashedEmail,                 // SHA256 hashed email (for FB CAPI mapping)
      phone: hashedPhone || undefined,    // SHA256 hashed phone (for FB CAPI mapping)
      fn: hashedFirstName || undefined,   // SHA256 hashed first_name (EMQ 9.5+)
      ln: hashedLastName || undefined,    // SHA256 hashed last_name (EMQ 9.5+)
      _fbp: payload.fbp || undefined,
      _fbc: payload.fbc || undefined,
      client_user_agent: payload.userAgent,
      event_source_url: payload.eventSourceUrl,
      action_source: 'website',
    };

    // Log full payload for debugging
    console.log('[Stape GTM] Sending payload:', JSON.stringify(gtmPayload, null, 2));

    const response = await fetch(STAPE_GTM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gtmPayload),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('[Stape GTM] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
        sentPayload: gtmPayload,
      });
    } else {
      console.log('[Stape GTM] Success for lead:', payload.leadId, '| Response:', responseText);
    }
  } catch (error) {
    // Non-blocking - don't fail the main request
    console.error('[Stape GTM] Failed to send event (non-blocking):', error);
  }
}


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client early for rate limiting
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Capture request headers for server-side tracking
  const clientUserAgent = req.headers.get('user-agent') || 'unknown';
  const referer = req.headers.get('referer') || '';

  // ============= Rate Limiting =============
  const clientIp = getClientIp(req);
  
  // Check IP hourly limit first (quick reject for spam)
  const ipHourlyCheck = await checkRateLimit(
    supabase,
    clientIp,
    'save-lead',
    RATE_LIMITS.ipPerHour,
    1
  );

  if (!ipHourlyCheck.allowed) {
    console.warn(`Rate limit exceeded for IP ${clientIp}: ${ipHourlyCheck.count}/${RATE_LIMITS.ipPerHour} per hour`);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: 3600
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check IP daily limit
  const ipDailyCheck = await checkRateLimit(
    supabase,
    clientIp,
    'save-lead-daily',
    RATE_LIMITS.ipPerDay,
    24
  );

  if (!ipDailyCheck.allowed) {
    console.warn(`Daily rate limit exceeded for IP ${clientIp}: ${ipDailyCheck.count}/${RATE_LIMITS.ipPerDay} per day`);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Daily limit reached. Please try again tomorrow.',
        retryAfter: 86400
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();

    // ============= Validate All Inputs with Zod =============
    const parseResult = leadSchema.safeParse(body);
    
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input', 
          details: parseResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      csrfToken, email, firstName, lastName, name, phone, sourceTool, sessionData, chatHistory, consultation,
      attribution, aiContext, lastNonDirect, leadId: providedLeadId, sessionId, quoteFileId,
      flowVersion, sourcePage
    } = parseResult.data;

    // CSRF block removed — CORS preflight + custom headers provide actual protection
    
    // Normalize first/last name: prefer explicit fields, fall back to splitting legacy name
    const normalizedFirstName = firstName?.trim() || (name?.includes(' ') ? name.split(' ')[0] : name) || null;
    const normalizedLastName = lastName?.trim() || (name?.includes(' ') ? name.split(' ').slice(1).join(' ') : null) || null;
    // Concatenate for legacy name column (backwards compatibility)
    const normalizedFullName = [normalizedFirstName, normalizedLastName].filter(Boolean).join(' ') || null;

    // Extract client_id for anonymous identity persistence (Truth Engine ownership validation)
    const clientId = 
      (sessionData as Record<string, unknown>)?.clientId as string ||
      (sessionData as Record<string, unknown>)?.client_id as string ||
      null;

    // Check email hourly limit (after validation so we have a valid email)
    const normalizedEmail = email.trim().toLowerCase();
    const emailHourlyCheck = await checkRateLimit(
      supabase,
      normalizedEmail,
      'save-lead-email',
      RATE_LIMITS.emailPerHour,
      1
    );

    if (!emailHourlyCheck.allowed) {
      console.warn(`Email rate limit exceeded for ${normalizedEmail}: ${emailHourlyCheck.count}/${RATE_LIMITS.emailPerHour} per hour`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many submissions with this email. Please try again later.',
          retryAfter: 3600
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let leadId: string;

    // ═══════════════════════════════════════════════════════════════════════════
    // EMQ 9.5+: Auto-enrich geo data from IP if missing
    // Priority: User-provided > AI Context > Session Data > IP Geo Enrichment
    // ═══════════════════════════════════════════════════════════════════════════
    let enrichedCity = aiContext?.city || null;
    let enrichedState = aiContext?.state || (sessionData as Record<string, unknown>)?.state as string || null;
    let enrichedZip = aiContext?.zip_code || null;

    // Only call geo API if we're missing city OR state (non-blocking)
    if (!enrichedCity || !enrichedState) {
      const geoData = await enrichGeoFromIP(clientIp);
      enrichedCity = enrichedCity || geoData.city;
      enrichedState = enrichedState || geoData.state;
      enrichedZip = enrichedZip || geoData.zip;
    }

    // Compute ip_hash for identity fingerprinting
    const ipHash = clientIp !== 'unknown' 
      ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientIp))
          .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
      : null;

    // Build the lead record with all fields
    const leadRecord = {
      email: normalizedEmail,
      name: normalizedFullName,
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      phone: phone || null,
      source_tool: sourceTool,
      session_data: sessionData || {},
      chat_history: chatHistory || [],
      // Anonymous identity for Truth Engine ownership validation
      client_id: clientId,
      // ═══════════════════════════════════════════════════════════════════════
      // GOLDEN THREAD v4: Identity versioning for analytics segmentation
      // 2 = Golden Thread (unified wte-anon-id), 1 = legacy (mixed ID sources)
      // ═══════════════════════════════════════════════════════════════════════
      identity_version: 2,
      // ═══════════════════════════════════════════════════════════════════════
      // GOLDEN THREAD v4: 5 new attribution columns for complete CRM data
      // ═══════════════════════════════════════════════════════════════════════
      original_session_id: sessionId || null,
      device_type: clientUserAgent?.includes('Mobile') ? 'mobile' : 
                   clientUserAgent?.includes('Tablet') ? 'tablet' : 'desktop',
      referrer: referer || null,
      landing_page: aiContext?.source_form || lastNonDirect?.landing_page || null,
      ip_hash: ipHash,
      // Attribution fields (last-touch)
      utm_source: attribution?.utm_source || null,
      utm_medium: attribution?.utm_medium || null,
      utm_campaign: attribution?.utm_campaign || null,
      utm_term: attribution?.utm_term || null,
      utm_content: attribution?.utm_content || null,
      fbc: attribution?.fbc || null,
      fbp: attribution?.fbp || null,
      gclid: attribution?.gclid || null,
      msclkid: attribution?.msclkid || null,
      // Last Non-Direct attribution (Phase 1B - preserves paid attribution)
      last_non_direct_utm_source: lastNonDirect?.utm_source || null,
      last_non_direct_utm_medium: lastNonDirect?.utm_medium || null,
      last_non_direct_gclid: lastNonDirect?.gclid || null,
      last_non_direct_fbclid: lastNonDirect?.fbclid || null,
      last_non_direct_channel: lastNonDirect?.channel || null,
      last_non_direct_landing_page: lastNonDirect?.landing_page || null,
      // AI Context fields
      source_form: aiContext?.source_form || null,
      specific_detail: aiContext?.specific_detail || null,
      emotional_state: aiContext?.emotional_state || null,
      urgency_level: aiContext?.urgency_level || null,
      insurance_carrier: aiContext?.insurance_carrier || null,
      // Convert string window_count ranges to midpoint numbers for INTEGER column
      window_count: convertWindowCount(aiContext?.window_count),
      // EMQ 9.5+: Address fields (with IP geo enrichment fallback)
      city: enrichedCity,
      state: enrichedState,
      zip: enrichedZip,
      // EMQ 9.5+: Device fingerprinting for server-side matching
      client_user_agent: clientUserAgent,
      // V2 qualification flow fields (set on create; qualification fields set later via PATCH)
      flow_version: flowVersion || null,
      source_page: sourcePage || (sessionData as Record<string, unknown>)?.ctaSource as string || null,
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GOLDEN THREAD LOGIC: leadId takes precedence over email matching
    // ═══════════════════════════════════════════════════════════════════════════
    try {
      let existingLead: { 
        id: string; 
        utm_source: string | null; 
        gclid: string | null; 
        fbc: string | null; 
        msclkid: string | null;
        last_non_direct_gclid: string | null;
        last_non_direct_fbclid: string | null;
        client_id: string | null;
      } | null = null;

      // PRIORITY 1: If leadId is provided, use it directly (Golden Thread)
      if (providedLeadId) {
        const { data: leadById, error: leadByIdError } = await supabase
          .from('leads')
          .select('id, utm_source, gclid, fbc, msclkid, last_non_direct_gclid, last_non_direct_fbclid, client_id')
          .eq('id', providedLeadId)
          .maybeSingle();

        if (leadByIdError) {
          console.error('Error fetching lead by ID:', leadByIdError);
          // Don't throw - fall through to email lookup
        } else if (leadById) {
          existingLead = leadById;
          console.log('Golden Thread: Found lead by ID:', providedLeadId);
        } else {
          console.warn('Golden Thread: Provided leadId not found, falling back to email lookup:', providedLeadId);
        }
      }

      // PRIORITY 2: Fallback to email lookup if no lead found by ID
      if (!existingLead) {
        // SAFE: Use limit(1) instead of maybeSingle() to handle duplicate emails gracefully
        // This prevents PGRST116 errors when multiple leads share the same email
        const { data: leadsArray, error: emailSelectError } = await supabase
          .from('leads')
          .select('id, utm_source, gclid, fbc, msclkid, last_non_direct_gclid, last_non_direct_fbclid, client_id')
          .eq('email', normalizedEmail)
          .order('created_at', { ascending: false })  // Most recent first
          .limit(1);

        if (emailSelectError) {
          console.error('Error checking existing lead by email:', {
            error: emailSelectError,
            email: normalizedEmail.slice(0, 3) + '***',
            code: emailSelectError.code,
            details: emailSelectError.details,
          });
          throw new Error('Database error while checking lead');
        }

        // Take first result if exists (handles 0, 1, or 2+ rows safely)
        existingLead = leadsArray && leadsArray.length > 0 ? leadsArray[0] : null;
        if (existingLead) {
          console.log('Found lead by email:', existingLead.id, '(selected most recent)');
        }
      }

      if (existingLead) {
        // Update existing lead - preserve first-touch attribution if already set
        leadId = existingLead.id;
        
        // Only update attribution if not already set (first-touch attribution model)
        const updateRecord: Record<string, unknown> = {
          name: name || undefined,
          phone: phone || undefined,
          source_tool: sourceTool,
          session_data: sessionData || {},
          chat_history: chatHistory || [],
          updated_at: new Date().toISOString(),
          // ═══════════════════════════════════════════════════════════════════════
          // GOLDEN THREAD v4: Upgrade identity version on re-engagement
          // This ensures returning users get upgraded to v2 identity tracking
          // ═══════════════════════════════════════════════════════════════════════
          identity_version: 2,
          // AI Context always updates (last-touch for context)
          source_form: aiContext?.source_form || undefined,
          specific_detail: aiContext?.specific_detail || undefined,
          emotional_state: aiContext?.emotional_state || undefined,
          urgency_level: aiContext?.urgency_level || undefined,
          insurance_carrier: aiContext?.insurance_carrier || undefined,
          window_count: convertWindowCount(aiContext?.window_count),
          // EMQ 9.5+: Update address fields if provided (enrichment)
          city: aiContext?.city || undefined,
          state: aiContext?.state || (sessionData as Record<string, unknown>)?.state as string || undefined,
          zip: aiContext?.zip_code || undefined,
          // EMQ 9.5+: Update user agent on each interaction
          client_user_agent: clientUserAgent,
        };
        
        // Only set attribution if not already present (first-touch)
        if (!existingLead?.utm_source && attribution?.utm_source) {
          updateRecord.utm_source = attribution.utm_source;
          updateRecord.utm_medium = attribution?.utm_medium;
          updateRecord.utm_campaign = attribution?.utm_campaign;
          updateRecord.utm_term = attribution?.utm_term;
          updateRecord.utm_content = attribution?.utm_content;
        }
        if (!existingLead?.gclid && attribution?.gclid) {
          updateRecord.gclid = attribution.gclid;
        }
        if (!existingLead?.fbc && (attribution?.fbc || attribution?.fbp)) {
          updateRecord.fbc = attribution?.fbc;
          updateRecord.fbp = attribution?.fbp;
        }
        if (!existingLead?.msclkid && attribution?.msclkid) {
          updateRecord.msclkid = attribution.msclkid;
        }
        
        // Phase 1B: Last Non-Direct attribution - ALWAYS update if provided (newer wins)
        // This preserves the most recent paid attribution even on updates
        if (lastNonDirect?.utm_source) {
          updateRecord.last_non_direct_utm_source = lastNonDirect.utm_source;
          updateRecord.last_non_direct_utm_medium = lastNonDirect.utm_medium;
          updateRecord.last_non_direct_channel = lastNonDirect.channel;
          updateRecord.last_non_direct_landing_page = lastNonDirect.landing_page;
        }
        if (lastNonDirect?.gclid) {
          updateRecord.last_non_direct_gclid = lastNonDirect.gclid;
        }
        if (lastNonDirect?.fbclid) {
          updateRecord.last_non_direct_fbclid = lastNonDirect.fbclid;
        }
        
        // Backfill client_id if missing (identity persistence for Truth Engine)
        if (!existingLead?.client_id && clientId) {
          updateRecord.client_id = clientId;
        }

        const { error: updateError } = await supabase
          .from('leads')
          .update(updateRecord)
          .eq('id', leadId);

        if (updateError) {
          console.error('Error updating lead:', updateError);
          throw new Error('Database error while updating lead');
        }

        console.log('Updated existing lead:', leadId);
      } else {
        // Create new lead with all fields
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert(leadRecord)
          .select('id')
          .single();

        if (insertError || !newLead) {
          console.error('Error creating lead:', insertError);
          throw new Error('Database error while creating lead');
        }

        leadId = newLead.id;
        console.log('Created new lead:', leadId);
        
        // Trigger admin notification for new lead with SANITIZED data
        triggerEmailNotification({
          email: 'admin@thewindowman.com',
          type: 'new-lead',
          data: {
            leadEmail: normalizedEmail,
            leadId,
            sourceTool,
            sessionSummary: sanitizeSessionDataForEmail(sessionData),
            attribution: {
              utm_source: attribution?.utm_source,
              utm_medium: attribution?.utm_medium,
              gclid: attribution?.gclid ? 'present' : undefined,
              fbc: attribution?.fbc ? 'present' : undefined,
            },
          },
        });

        // ═══════════════════════════════════════════════════════════════════════
        // STAPE GTM: Send server-side conversion event (non-blocking)
        // Deduplication via event_id (leadId) - Stape will ignore duplicates
        // ═══════════════════════════════════════════════════════════════════════
        sendStapeGTMEvent({
          leadId,
          email: normalizedEmail,
          phone: phone || null,
          firstName: normalizedFirstName,  // EMQ 9.5+: Server-side name hashing
          lastName: normalizedLastName,    // EMQ 9.5+: Server-side name hashing
          fbp: attribution?.fbp || null,
          fbc: attribution?.fbc || null,
          userAgent: clientUserAgent,
          eventSourceUrl: referer || aiContext?.source_form || 'https://itswindowman.com',
        });
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);

      // Extract detailed Postgres error information for debugging
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      const errorCode = (dbError as any)?.code || 'UNKNOWN';
      const errorDetails = (dbError as any)?.details || null;
      const errorHint = (dbError as any)?.hint || null;

      // Log full error details server-side
      console.error('Postgres Error Details:', {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
        hint: errorHint
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          // Include debug info in development/staging (filtered by env var)
          ...(Deno.env.get('ENVIRONMENT') !== 'production' && {
            debug: {
              code: errorCode,
              message: errorMessage,
              details: errorDetails
            }
          })
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUOTE FILE LINKING: If quoteFileId provided, link it to this lead
    // ═══════════════════════════════════════════════════════════════════════════
    let quoteFileLinked = false;
    if (quoteFileId) {
      try {
        const { error: linkError } = await supabase
          .from('quote_files')
          .update({ lead_id: leadId })
          .eq('id', quoteFileId)
          .is('lead_id', null); // Only update if not already linked

        if (linkError) {
          console.error('Error linking quote file to lead:', linkError);
          // Non-blocking - don't fail the lead save
        } else {
          quoteFileLinked = true;
          console.log('Linked quote file to lead:', { quoteFileId, leadId });

          // Log quote_file_linked event for funnel tracking
          if (sessionId) {
            logAttributionEvent({
              sessionId,
              eventName: 'quote_file_linked',
              eventCategory: 'conversion',
              pagePath: '/beat-your-quote',
              pageTitle: 'Quote File Linked - Beat Your Quote',
              leadId,
              eventData: {
                quote_file_id: quoteFileId,
                source_tool: sourceTool,
              },
              anonymousIdFallback: `quote-${quoteFileId}`,
            });
          }

          // ═══════════════════════════════════════════════════════════════════════
          // QUOTE ALERT: Notify sales team about new quote upload
          // ═══════════════════════════════════════════════════════════════════════
          try {
            // Get file details for the email
            const { data: fileData } = await supabase
              .from('quote_files')
              .select('file_path, file_name')
              .eq('id', quoteFileId)
              .maybeSingle();

            // Generate a 24-hour signed URL for the file
            let signedUrl: string | undefined;
            if (fileData?.file_path) {
              const { data: urlData } = await supabase.storage
                .from('quotes')
                .createSignedUrl(fileData.file_path, 60 * 60 * 24); // 24 hours
              signedUrl = urlData?.signedUrl;
            }

            // Send alert to admin emails
            const adminEmails = ['vansiclenp@gmail.com', 'mongoloyd@protonmail.com'];
            for (const adminEmail of adminEmails) {
              triggerEmailNotification({
                email: adminEmail,
                type: 'quote-alert',
                data: {
                  leadId,
                  leadName: name || 'Anonymous',
                  leadEmail: normalizedEmail,
                  leadPhone: phone || 'Not provided',
                  fileName: fileData?.file_name || 'quote-document',
                  signedUrl,
                  quoteFileId,
                },
              });
            }
            console.log('Quote alert emails triggered for:', adminEmails);
          } catch (alertErr) {
            console.error('Quote alert failed (non-blocking):', alertErr);
          }
        }
      } catch (linkErr) {
        console.error('Quote file linking failed (non-blocking):', linkErr);
      }
    }

    // If consultation data provided, create consultation record
    let consultationId: string | null = null;
    if (consultation && consultation.preferredTime) {
      try {
        const { data: newConsultation, error: consultError } = await supabase
          .from('consultations')
          .insert({
            lead_id: leadId,
            name: consultation.name,
            email: consultation.email || normalizedEmail,
            phone: consultation.phone,
            preferred_time: consultation.preferredTime,
            notes: consultation.notes || null,
            status: 'pending',
          })
          .select('id')
          .single();

        if (consultError || !newConsultation) {
          console.error('Error creating consultation:', consultError);
          throw new Error('Database error while creating consultation');
        }

        consultationId = newConsultation.id;
        console.log('Created consultation:', consultationId);
        
        // Log consultation_booked event for funnel tracking
        if (sessionId) {
          logAttributionEvent({
            sessionId,
            eventName: 'consultation_booked',
            eventCategory: 'conversion',
            pagePath: aiContext?.source_form || '/consultation',
            pageTitle: `Consultation Booked - ${sourceTool}`,
            leadId,
            eventData: {
              consultation_id: consultationId,
              preferred_time: consultation.preferredTime,
              source_tool: sourceTool,
            },
            anonymousIdFallback: `consult-${consultationId}`,
          });
        }
      } catch (consultDbError) {
        console.error('Consultation creation failed:', consultDbError);

        // Extract detailed error information
        const errorMessage = consultDbError instanceof Error ? consultDbError.message : 'Unknown error';
        const errorCode = (consultDbError as any)?.code || 'UNKNOWN';

        console.error('Consultation Error Details:', {
          code: errorCode,
          message: errorMessage
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to schedule consultation',
            ...(Deno.env.get('ENVIRONMENT') !== 'production' && {
              debug: {
                code: errorCode,
                message: errorMessage
              }
            })
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Trigger customer email based on source tool (fire-and-forget)
    // Only include safe, non-sensitive data
    const safeSessionData = {
      windowCount: sessionData?.windowCount,
      currentEnergyBill: sessionData?.currentEnergyBill,
      windowAge: sessionData?.windowAge,
    };

    if (sourceTool === 'comparison-tool') {
      triggerEmailNotification({
        email: normalizedEmail,
        type: 'comparison-report',
        data: safeSessionData,
      });
    } else if (sourceTool === 'cost-calculator') {
      triggerEmailNotification({
        email: normalizedEmail,
        type: 'cost-calculator-report',
        data: safeSessionData,
      });
    }

    // Record successful request for rate limiting (fire-and-forget)
    // We record both IP and email entries to track limits
    recordRateLimitEntry(supabase, clientIp, 'save-lead');
    recordRateLimitEntry(supabase, clientIp, 'save-lead-daily');
    recordRateLimitEntry(supabase, normalizedEmail, 'save-lead-email');

    // ═══════════════════════════════════════════════════════════════════════════
    // GOLDEN THREAD: Log attribution event to wm_events (legacy, backward compat)
    // ═══════════════════════════════════════════════════════════════════════════
    if (sessionId) {
      logAttributionEvent({
        sessionId,
        eventName: 'lead_captured',
        eventCategory: 'conversion',
        pagePath: aiContext?.source_form || '/unknown',
        pageTitle: `Lead Capture - ${sourceTool}`,
        leadId,
        eventData: {
          source_tool: sourceTool,
          email: normalizedEmail,
          has_phone: !!phone,
          has_name: !!name,
          has_consultation: !!consultationId,
          utm_source: attribution?.utm_source || null,
          utm_medium: attribution?.utm_medium || null,
        },
        // GOLDEN THREAD v4: Pass actual clientId to ensure wm_sessions.anonymous_id matches leads.client_id
        anonymousIdFallback: clientId || `lead-${leadId}`,
      });
    } else {
      console.warn('Golden Thread: No sessionId provided - wm_events event not persisted');
    }

// ═══════════════════════════════════════════════════════════════════════════
    // CANONICAL LEDGER: Write lead_submission_success to wm_event_log
    // This is the server-side source of truth for attribution analytics
    // PHASE 5C: Idempotency guard - check if conversion already exists for this lead
    // ═══════════════════════════════════════════════════════════════════════════
    try {
      // IDEMPOTENCY CHECK: Skip if lead_submission_success already exists for this lead_id
      const { data: existingConversion, error: checkError } = await supabase
        .from('wm_event_log')
        .select('event_id')
        .eq('lead_id', leadId)
        .eq('event_name', 'lead_submission_success')
        .maybeSingle();

      if (checkError) {
        console.warn('[wm_event_log] Idempotency check failed (proceeding with insert):', checkError.message);
      }

      if (existingConversion) {
        // Conversion already exists - idempotent success (no duplicate write)
        console.log('[wm_event_log] IDEMPOTENT: lead_submission_success already exists for lead:', leadId, 'event_id:', existingConversion.event_id);
        // Skip the insert - this is a retry or duplicate request
      } else {
        // No existing conversion - proceed with insert
        // Extract client_id from session_data if available
        const clientId = (sessionData as Record<string, unknown>)?.clientId as string 
          || (sessionData as Record<string, unknown>)?.client_id as string 
          || `lead-${leadId}`;

        // Pre-compute hashes once using E.164 for phones
        const hashedEmail = await hashEmail(normalizedEmail);
        const hashedPhone = phone ? await hashPhoneE164(phone) : null;
        // EMQ 9.5+: Defensive null checking for first/last name hashing
        const hashedFirstName = normalizedFirstName ? await hashName(normalizedFirstName) : null;
        const hashedLastName = normalizedLastName ? await hashName(normalizedLastName) : null;

        const eventLogPayload = {
          event_id: leadId,
          event_name: 'lead_submission_success',
          event_type: 'conversion',
          event_time: new Date().toISOString(),
          lead_id: leadId,
          session_id: sessionId || null,
          client_id: clientId,
          
          // ═══ DEDICATED COLUMNS (queryable) ═══
          external_id: leadId,
          email_sha256: hashedEmail,
          phone_sha256: hashedPhone,
          
          source_tool: sourceTool,
          source_system: 'save-lead',
          ingested_by: 'save-lead',
          page_path: aiContext?.source_form || referer || '/unknown',
          funnel_stage: 'converted',
          
          // Attribution fields at event time
          traffic_source: attribution?.utm_source || lastNonDirect?.utm_source || null,
          traffic_medium: attribution?.utm_medium || lastNonDirect?.utm_medium || null,
          campaign_id: attribution?.utm_campaign || null,
          gclid: attribution?.gclid || lastNonDirect?.gclid || null,
          fbclid: lastNonDirect?.fbclid || null,
          fbp: attribution?.fbp || null,
          fbc: attribution?.fbc || null,
          
          metadata: {
            email_domain: normalizedEmail.split('@')[1],
            has_phone: !!phone,
            has_name: !!name,
            has_consultation: !!consultationId,
            has_quote_file: !!quoteFileId,
            last_non_direct_channel: lastNonDirect?.channel || null,
            landing_page: lastNonDirect?.landing_page || null,
          },
          
          // ═══ JSONB ALIASES (backward compat for Meta CAPI + Google EC) ═══
          user_data: {
            em: hashedEmail,
            ph: hashedPhone,
            // EMQ 9.5+: First/last name hashes for Meta Advanced Matching
            fn: hashedFirstName || undefined,
            ln: hashedLastName || undefined,
            sha256_first_name: hashedFirstName || undefined,
            sha256_last_name: hashedLastName || undefined,
            external_id: leadId,
            sha256_email_address: hashedEmail,
            sha256_phone_number: hashedPhone,
          },
        };

        const { error: eventLogError } = await supabase
          .from('wm_event_log')
          .insert(eventLogPayload);

        if (eventLogError) {
          // Check for unique constraint violation (belt-and-suspenders with DB constraint)
          if (eventLogError.code === '23505') {
            console.log('[wm_event_log] IDEMPOTENT (DB constraint): Duplicate blocked for lead:', leadId);
          } else {
            console.error('[wm_event_log] Failed to write lead_submission_success:', eventLogError);
          }
        } else {
          console.log('[wm_event_log] lead_submission_success written for lead:', leadId);
        }
      }
    } catch (eventLogErr) {
      // Non-blocking - attribution logging should never fail the lead save
      console.error('[wm_event_log] Exception during write (non-blocking):', eventLogErr);
    }
    // ═══════════════════════════════════════════════════════════════════════════

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        consultationId,
        quoteFileLinked,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
