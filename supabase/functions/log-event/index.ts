import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wm-log-secret",
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & REGEX
// ═══════════════════════════════════════════════════════════════════════════

// UUID v4 regex for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// SHA-256 hash detection (64 hex characters)
const HASH_64_HEX_REGEX = /^[a-f0-9]{64}$/i;

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function isValidUUID(val: unknown): val is string {
  return typeof val === "string" && UUID_REGEX.test(val);
}

function isAlreadyHashed(value: string): boolean {
  return HASH_64_HEX_REGEX.test(value);
}

// ═══════════════════════════════════════════════════════════════════════════
// PII HASHING UTILITIES (MUST MATCH CLIENT-SIDE BEHAVIOR)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SHA-256 hash with lowercase/trim normalization
 * MUST match client-side sha256() behavior exactly
 */
async function sha256Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Normalize phone to E.164 format
 * MUST match client-side normalizeToE164() behavior exactly
 * Returns null if invalid (not undefined for consistency with server types)
 */
function normalizeToE164(phone: string): string | null {
  const digitsOnly = phone.replace(/\D/g, "");
  
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}`;
  }
  
  // Invalid phone - return null (we'll still hash for matching purposes)
  return null;
}

/**
 * Hash phone with E.164 normalization
 * Returns null if phone is invalid or hashing fails
 */
async function hashPhone(phone: string): Promise<string | null> {
  const e164 = normalizeToE164(phone);
  if (!e164) {
    // Still hash the digits-only version for best-effort matching
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length >= 7) {
      return sha256Hash(digitsOnly);
    }
    return null;
  }
  return sha256Hash(e164);
}

// ═══════════════════════════════════════════════════════════════════════════
// PII EXTRACTION & SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════

interface ExtractedPII {
  rawEmail: string | null;
  rawPhone: string | null;
  emailWasHashed: boolean;
  phoneWasHashed: boolean;
}

/**
 * Extract PII from all possible payload locations
 * Detects if values are already hashed (64-char hex)
 */
function extractPII(body: Record<string, unknown>): ExtractedPII {
  // Check all possible locations for email
  const emailSources = [
    body.email,
    (body.user_data as Record<string, unknown>)?.email,
    (body.metadata as Record<string, unknown>)?.email,
  ];
  
  // Check all possible locations for phone
  const phoneSources = [
    body.phone,
    (body.user_data as Record<string, unknown>)?.phone,
    (body.metadata as Record<string, unknown>)?.phone,
    body.phone_number,
    (body.user_data as Record<string, unknown>)?.phone_number,
    (body.metadata as Record<string, unknown>)?.phone_number,
  ];
  
  let rawEmail: string | null = null;
  let emailWasHashed = false;
  
  for (const src of emailSources) {
    if (typeof src === "string" && src.length > 0) {
      rawEmail = src;
      emailWasHashed = isAlreadyHashed(src);
      break;
    }
  }
  
  let rawPhone: string | null = null;
  let phoneWasHashed = false;
  
  for (const src of phoneSources) {
    if (typeof src === "string" && src.length > 0) {
      rawPhone = src;
      phoneWasHashed = isAlreadyHashed(src);
      break;
    }
  }
  
  return { rawEmail, rawPhone, emailWasHashed, phoneWasHashed };
}

/**
 * Sanitize object by removing PII keys
 * Returns a new object with email/phone keys removed
 */
function sanitizePIIKeys(obj: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!obj || typeof obj !== "object") return {};
  
  const sanitized = { ...obj };
  
  // Remove all possible PII keys
  delete sanitized.email;
  delete sanitized.phone;
  delete sanitized.phone_number;
  
  return sanitized;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════════════

  const providedSecret = req.headers.get("x-wm-log-secret");
  const expectedSecret = Deno.env.get("WM_LOG_SECRET");
  const authHeader = req.headers.get("authorization");
  const apiKeyHeader = req.headers.get("apikey");
  
  const expectedAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const knownAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6dWxxZXhsZ2F2Z2djeWl6YWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODQwNjgsImV4cCI6MjA4MjY2MDA2OH0.QvwUD5ScBk2DrD8yKiS3NBSeOuGAikQ3XT5TKn6Hf5U";
  
  const secretValid = expectedSecret && providedSecret && providedSecret === expectedSecret;
  const anonKeyValid = (
    (expectedAnonKey && (apiKeyHeader === expectedAnonKey || authHeader === `Bearer ${expectedAnonKey}`)) ||
    (apiKeyHeader === knownAnonKey || authHeader === `Bearer ${knownAnonKey}`)
  );
  
  if (!secretValid && !anonKeyValid) {
    console.warn("[log-event] Auth failed:", {
      hasSecretHeader: !!providedSecret,
      hasApiKey: !!apiKeyHeader,
      hasAuthHeader: !!authHeader,
    });
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  console.log("[log-event] Auth succeeded via:", secretValid ? "secret" : "anon-key");

  try {
    const body = await req.json();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════

    if (!body.event_name || typeof body.event_name !== "string") {
      return new Response(JSON.stringify({ error: "event_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // event_id: use provided if valid UUID, otherwise generate
    let eventId: string;
    if (isValidUUID(body.event_id)) {
      eventId = body.event_id;
    } else {
      eventId = crypto.randomUUID();
    }

    // Validate optional UUID fields
    const leadId = isValidUUID(body.lead_id) ? body.lead_id : null;
    const sessionId = isValidUUID(body.session_id) ? body.session_id : null;

    // ═══════════════════════════════════════════════════════════════════════════
    // PII FIREWALL: Extract → Hash → Sanitize
    // ═══════════════════════════════════════════════════════════════════════════

    const extractedPII = extractPII(body);
    
    // Build processed user_data with hashed PII
    let processedUserData: Record<string, unknown> = sanitizePIIKeys(
      body.user_data as Record<string, unknown>
    );
    
    // Hash email if present and not already hashed
    let emailSha256: string | null = null;
    if (extractedPII.rawEmail) {
      if (extractedPII.emailWasHashed) {
        emailSha256 = extractedPII.rawEmail;
      } else {
        emailSha256 = await sha256Hash(extractedPII.rawEmail);
      }
      // Add to user_data in both Google and Meta formats
      processedUserData.email_sha256 = emailSha256;
      processedUserData.sha256_email_address = emailSha256;
      processedUserData.em = emailSha256;
    }
    
    // Hash phone if present and not already hashed
    let phoneSha256: string | null = null;
    if (extractedPII.rawPhone) {
      if (extractedPII.phoneWasHashed) {
        phoneSha256 = extractedPII.rawPhone;
      } else {
        phoneSha256 = await hashPhone(extractedPII.rawPhone);
      }
      if (phoneSha256) {
        // Add to user_data in both Google and Meta formats
        processedUserData.phone_sha256 = phoneSha256;
        processedUserData.sha256_phone_number = phoneSha256;
        processedUserData.ph = phoneSha256;
      }
    }
    
    // Preserve external_id from various sources
    const externalId = 
      (body.user_data as Record<string, unknown>)?.external_id ||
      body.external_id ||
      leadId ||
      null;
    
    if (externalId && typeof externalId === "string") {
      processedUserData.external_id = externalId;
    }
    
    // Sanitize metadata - remove any PII keys
    const sanitizedMetadata = sanitizePIIKeys(body.metadata as Record<string, unknown>);
    
    // Log PII processing (NEVER log raw values)
    console.log("[log-event] PII processed:", {
      event_name: body.event_name,
      has_email: !!extractedPII.rawEmail,
      has_phone: !!extractedPII.rawPhone,
      email_was_hashed: extractedPII.emailWasHashed,
      phone_was_hashed: extractedPII.phoneWasHashed,
      email_hash_length: emailSha256?.length || 0,
      phone_hash_length: phoneSha256?.length || 0,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // BUILD INSERT PAYLOAD
    // ═══════════════════════════════════════════════════════════════════════════

    const insertPayload = {
      event_id: eventId,
      event_name: body.event_name,
      event_type: typeof body.event_type === "string" ? body.event_type : "unknown",
      event_time: body.event_time || new Date().toISOString(),
      client_id: typeof body.client_id === "string" ? body.client_id : null,
      lead_id: leadId,
      session_id: sessionId,
      external_id: typeof externalId === "string" ? externalId : null,
      source_tool: typeof body.source_tool === "string" ? body.source_tool : null,
      page_path: typeof body.page_path === "string" ? body.page_path : null,
      funnel_stage: typeof body.funnel_stage === "string" ? body.funnel_stage : null,
      intent_tier: typeof body.intent_tier === "number" ? body.intent_tier : null,
      traffic_source: typeof body.traffic_source === "string" ? body.traffic_source : null,
      traffic_medium: typeof body.traffic_medium === "string" ? body.traffic_medium : null,
      campaign_id: typeof body.campaign_id === "string" ? body.campaign_id : null,
      fbclid: typeof body.fbclid === "string" ? body.fbclid : null,
      gclid: typeof body.gclid === "string" ? body.gclid : null,
      fbp: typeof body.fbp === "string" ? body.fbp : null,
      fbc: typeof body.fbc === "string" ? body.fbc : null,
      lead_score: typeof body.lead_score === "number" ? body.lead_score : null,
      
      // SANITIZED: user_data contains only hashed identifiers
      user_data: Object.keys(processedUserData).length > 0 ? processedUserData : null,
      
      // SANITIZED: metadata contains no PII keys
      metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : {},
      
      // DEDICATED COLUMNS: For fast identity matching queries
      email_sha256: emailSha256,
      phone_sha256: phoneSha256,
      
      source_system: typeof body.source_system === "string" ? body.source_system : "web",
      ingested_by: typeof body.ingested_by === "string" ? body.ingested_by : "log-event",
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // DATABASE INSERT
    // ═══════════════════════════════════════════════════════════════════════════

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("wm_event_log")
      .insert(insertPayload)
      .select("id, event_id")
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate event_id)
      if (error.code === "23505" && error.message.includes("uix_wm_event_log_event_id")) {
        console.log(`[log-event] Duplicate event_id: ${eventId}`);
        return new Response(
          JSON.stringify({ ok: true, event_id: eventId, duplicate: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.error("[log-event] Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[log-event] Logged: ${body.event_name} (${eventId.slice(0, 8)}...)`, {
      has_email_hash: !!emailSha256,
      has_phone_hash: !!phoneSha256,
      has_external_id: !!externalId,
    });
    
    return new Response(
      JSON.stringify({ ok: true, event_id: eventId, duplicate: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[log-event] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
