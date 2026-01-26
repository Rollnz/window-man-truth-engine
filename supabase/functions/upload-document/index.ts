import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============= CORS Headers =============
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};

// ============= Constants =============
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
] as const;

// Hardcoded allowlist - DO NOT import from frontend
const ALLOWED_DOCUMENT_TYPES = [
  // Critical claim documents
  'purchase-invoice',
  'installation-contract',
  'noa-certificate',
  'permit-record',
  'warranty-document',
  'pre-storm-photos',
  'post-storm-photos',
  // Photo walkthrough categories (Claim Survival Kit)
  'photo-exterior',
  'photo-closeups',
  'photo-interior',
] as const;

const RATE_LIMIT_MAX = 10; // per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const COOLDOWN_SECONDS = 10;

// ============= Magic Bytes =============
const MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
};

// ============= Validation Helpers =============
function isValidUUIDv4(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
}

function isValidDocumentType(docType: string): docType is typeof ALLOWED_DOCUMENT_TYPES[number] {
  return ALLOWED_DOCUMENT_TYPES.includes(docType as typeof ALLOWED_DOCUMENT_TYPES[number]);
}

function validateMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) {
    // HEIC, HEIF, and WebP: MIME-only validation (no magic byte check)
    return mimeType === 'image/heic' || mimeType === 'image/heif' || mimeType === 'image/webp';
  }
  
  return signatures.some(signature => 
    signature.every((byte, index) => buffer[index] === byte)
  );
}

function logSafe(sessionId: string): string {
  return sessionId.substring(0, 8) + '...';
}

// ============= Rate Limiting (Degraded Mode) =============
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  degraded: boolean;
  cooldownViolation: boolean;
}

// Use 'any' for Supabase client type in Edge Functions to avoid type conflicts
// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function checkRateLimit(
  supabase: SupabaseClient,
  sessionId: string
): Promise<RateLimitResult> {
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  try {
    // Check total count in window
    const { count, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', sessionId)
      .eq('endpoint', 'upload-document')
      .gte('created_at', cutoff);
    
    if (countError) {
      console.warn(`[upload-document] Rate limit check failed for ${logSafe(sessionId)}:`, countError.message);
      // Degraded mode: attempt cooldown check
      return await checkCooldownOnly(supabase, sessionId);
    }
    
    const currentCount = count || 0;
    if (currentCount >= RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0, degraded: false, cooldownViolation: false };
    }
    
    // Check cooldown (last upload within 10 seconds)
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();
    const { count: recentCount, error: cooldownError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', sessionId)
      .eq('endpoint', 'upload-document')
      .gte('created_at', cooldownCutoff);
    
    if (cooldownError) {
      console.warn(`[upload-document] Cooldown check failed for ${logSafe(sessionId)}, allowing:`, cooldownError.message);
      // Allow but log degraded
      return { allowed: true, remaining: RATE_LIMIT_MAX - currentCount, degraded: true, cooldownViolation: false };
    }
    
    if ((recentCount || 0) > 0) {
      return { allowed: false, remaining: RATE_LIMIT_MAX - currentCount, degraded: false, cooldownViolation: true };
    }
    
    return { allowed: true, remaining: RATE_LIMIT_MAX - currentCount - 1, degraded: false, cooldownViolation: false };
  } catch (err) {
    console.error(`[upload-document] Rate limit exception for ${logSafe(sessionId)}:`, err);
    // Degraded mode: allow with logging
    return { allowed: true, remaining: 0, degraded: true, cooldownViolation: false };
  }
}

async function checkCooldownOnly(
  supabase: SupabaseClient,
  sessionId: string
): Promise<RateLimitResult> {
  try {
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();
    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', sessionId)
      .eq('endpoint', 'upload-document')
      .gte('created_at', cooldownCutoff);
    
    if (error) {
      console.warn(`[upload-document] COOLDOWN_SKIPPED for ${logSafe(sessionId)}:`, error.message);
      return { allowed: true, remaining: 0, degraded: true, cooldownViolation: false };
    }
    
    if ((count || 0) > 0) {
      return { allowed: false, remaining: 0, degraded: true, cooldownViolation: true };
    }
    
    console.warn(`[upload-document] RATE_LIMIT_DEGRADED for ${logSafe(sessionId)}`);
    return { allowed: true, remaining: 0, degraded: true, cooldownViolation: false };
  } catch {
    console.warn(`[upload-document] RATE_LIMIT_DEGRADED + COOLDOWN_SKIPPED for ${logSafe(sessionId)}`);
    return { allowed: true, remaining: 0, degraded: true, cooldownViolation: false };
  }
}

async function recordRateLimitHit(
  supabase: SupabaseClient,
  sessionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('rate_limits').insert({
      identifier: sessionId,
      endpoint: 'upload-document',
    });
    
    if (error) {
      console.warn(`[upload-document] Failed to record rate limit hit for ${logSafe(sessionId)}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[upload-document] Rate limit record exception for ${logSafe(sessionId)}:`, err);
    return false;
  }
}

// ============= Response Helpers =============
function errorResponse(
  status: number,
  errorCode: string,
  message: string
): Response {
  return new Response(
    JSON.stringify({ success: false, error_code: errorCode, message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function successResponse(data: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============= Main Handler =============
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Only POST method is allowed');
  }

  try {
    // ===== Parse Form Data =====
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;
    const documentType = formData.get('documentType') as string | null;
    
    // Identity fields from request payload (Task A/C requirement)
    const clientIdFromPayload = formData.get('client_id') as string | null;
    const leadIdFromPayload = formData.get('lead_id') as string | null;

    // ===== Validate Required Fields =====
    if (!file) {
      return errorResponse(400, 'MISSING_FILE', 'No file provided');
    }

    if (!sessionId) {
      return errorResponse(400, 'INVALID_SESSION', 'No sessionId provided');
    }

    if (!isValidUUIDv4(sessionId)) {
      console.warn(`[upload-document] Invalid sessionId format: ${sessionId?.substring(0, 20)}...`);
      return errorResponse(400, 'INVALID_SESSION', 'Invalid session format');
    }

    if (!documentType) {
      return errorResponse(400, 'INVALID_DOC_TYPE', 'No documentType provided');
    }

    if (!isValidDocumentType(documentType)) {
      console.warn(`[upload-document] Invalid documentType: ${documentType}`);
      return errorResponse(400, 'INVALID_DOC_TYPE', 'Invalid document type');
    }

    // ===== Validate File Type =====
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      return errorResponse(400, 'INVALID_MIME', `Invalid file type: ${file.type}`);
    }

    // ===== Validate File Size =====
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(413, 'FILE_TOO_LARGE', `File exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // ===== Validate Magic Bytes =====
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    
    if (!validateMagicBytes(fileBuffer, file.type)) {
      console.warn(`[upload-document] Magic byte mismatch for ${logSafe(sessionId)}, type: ${file.type}`);
      return errorResponse(400, 'INVALID_FILE_CONTENT', 'File content does not match declared type');
    }

    // ===== Initialize Supabase Client =====
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ===== Rate Limiting (Degraded Mode) =====
    const rateLimit = await checkRateLimit(supabase, sessionId);
    
    if (!rateLimit.allowed) {
      if (rateLimit.cooldownViolation) {
        return errorResponse(429, 'RATE_LIMITED', 'Please wait 10 seconds between uploads');
      }
      return errorResponse(429, 'RATE_LIMITED', 'Upload limit reached (10 per hour)');
    }

    if (rateLimit.degraded) {
      console.warn(`[upload-document] Operating in degraded mode for ${logSafe(sessionId)}`);
    }

    // ===== Generate Storage Path =====
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueId = crypto.randomUUID();
    const storagePath = `anon/${sessionId}/${documentType}/${timestamp}-${uniqueId}.${fileExtension}`;

    console.log(`[upload-document] Uploading for ${logSafe(sessionId)}: ${documentType}, size: ${file.size}`);

    // ===== Upload to Storage =====
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('claim-documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(`[upload-document] Storage error for ${logSafe(sessionId)}:`, uploadError.message);
      return errorResponse(500, 'UPLOAD_FAILED', 'Failed to store file');
    }

    console.log(`[upload-document] Upload successful: ${uploadData.path}`);

    // ===== Record Rate Limit Hit =====
    const recorded = await recordRateLimitHit(supabase, sessionId);
    if (!recorded) {
      // Log warning but do NOT delete file (per degraded mode spec)
      console.warn(`[upload-document] Rate limit record failed for ${logSafe(sessionId)}, file retained`);
    }

    // ============================================
    // LOG TO CANONICAL EVENT LEDGER (wm_event_log)
    // Uses service role client (already initialized above)
    // Non-blocking: failures do not affect upload success
    // ============================================
    try {
      // Priority: payload > session lookup > fallback
      // 1. Use identity from request payload if provided (Task A/C)
      // 2. Fall back to session lookup if not provided
      // 3. Use sessionId as last resort
      
      let resolvedClientId = clientIdFromPayload;
      let resolvedLeadId = isValidUUIDv4(leadIdFromPayload || '') ? leadIdFromPayload : null;
      
      // Try session lookup for missing identity
      if (!resolvedClientId || !resolvedLeadId) {
        const { data: sessionData } = await supabase
          .from('wm_sessions')
          .select('id, anonymous_id, lead_id')
          .eq('id', sessionId)
          .limit(1)
          .maybeSingle();
        
        if (sessionData) {
          resolvedClientId = resolvedClientId || sessionData.anonymous_id;
          resolvedLeadId = resolvedLeadId || sessionData.lead_id;
        }
      }
      
      // Final fallback for client_id
      resolvedClientId = resolvedClientId || sessionId;

      const eventId = crypto.randomUUID();
      const eventPayload = {
        event_id: eventId,
        event_name: 'scanner_document_upload_completed',
        event_type: 'signal',
        event_time: new Date().toISOString(),
        client_id: resolvedClientId,
        lead_id: resolvedLeadId,
        session_id: sessionId, // sessionId is already validated as UUID
        source_tool: 'ai_scanner',
        source_system: 'upload-document',
        ingested_by: 'upload-document',
        page_path: '/ai-scanner',
        metadata: {
          storage_path: uploadData.path,
          original_file_name: file.name,
          file_size: file.size,
          document_type: documentType,
          mime_type: file.type,
        },
      };

      // Insert using service role client (bypasses RLS)
      const { error: ledgerError } = await supabase
        .from('wm_event_log')
        .insert(eventPayload);

      if (ledgerError) {
        console.error(`[upload-document] wm_event_log insert failed (non-fatal):`, ledgerError.message);
      } else {
        console.log(`[upload-document] Logged scanner_document_upload_completed to wm_event_log: ${eventId}`, {
          client_id: resolvedClientId,
          lead_id: resolvedLeadId,
          session_id: sessionId,
        });
      }
    } catch (ledgerErr) {
      console.error(`[upload-document] wm_event_log logging exception (non-fatal):`, ledgerErr);
    }

    // ===== Return Success =====
    return successResponse({
      file_path: uploadData.path,
      original_file_name: file.name,
      file_size: file.size,
      document_type: documentType,
      remaining_uploads: rateLimit.remaining,
    });

  } catch (error) {
    console.error('[upload-document] Unexpected error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
});
