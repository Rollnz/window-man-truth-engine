import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type JsonRecord = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_MIME = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg"]);
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

// ============= Rate Limiting Configuration =============
const RATE_LIMITS = {
  sessionPerIpPerHour: 5,      // Max 5 sessions per IP per hour
  eventPerSessionPerHour: 100, // Max 100 events per session per hour
};

const getSupabase = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment not configured");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sanitizeFilename = (name: string) => name.replace(/[^\w.-]+/g, "_").slice(0, 200);

// ============= Helper Functions =============

// Extract client IP from request headers
function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp;

  return 'unknown';
}

// Check rate limit against the rate_limits table
async function checkRateLimit(
  supabase: SupabaseClient,
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
      return { allowed: true, count: 0 }; // Fail open
    }

    const currentCount = count || 0;
    return { allowed: currentCount < maxRequests, count: currentCount };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, count: 0 }; // Fail open
  }
}

// Record a rate limit entry
async function recordRateLimitEntry(
  supabase: SupabaseClient,
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
  }
}

const ensureSession = async (supabase: SupabaseClient, sessionId?: string) => {
  if (!sessionId) return null;
  const { data, error } = await supabase
    .from("wm_sessions")
    .select("id")
    .eq("id", sessionId)
    .single();
  if (error || !data) {
    return null;
  }
  return data.id as string;
};

const upsertSession = async (supabase: SupabaseClient, payload: JsonRecord & { session_id?: string }) => {
  const existingId = await ensureSession(supabase, payload.session_id as string | undefined);
  const now = new Date().toISOString();

  if (existingId) {
    await supabase
      .from("wm_sessions")
      .update({ last_seen_at: now })
      .eq("id", existingId);
    return existingId;
  }

  const insertData = {
    entry_point: payload.entry_point,
    device_type: payload.device_type,
    user_agent: payload.user_agent,
    referrer: payload.referrer,
    utm_source: payload.utm_source,
    utm_medium: payload.utm_medium,
    utm_campaign: payload.utm_campaign,
    utm_term: payload.utm_term,
    utm_content: payload.utm_content,
    gclid: payload.gclid,
    fbclid: payload.fbclid,
    msclkid: payload.msclkid,
  };

  const { data, error } = await supabase
    .from("wm_sessions")
    .insert(insertData)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Failed to create session");
  }
  return data.id as string;
};

const handleSession = async (supabase: SupabaseClient, reqBody: JsonRecord, clientIp: string) => {
  // Rate limit: 5 sessions per IP per hour
  const rateLimitCheck = await checkRateLimit(
    supabase,
    clientIp,
    'wm-api:/session',
    RATE_LIMITS.sessionPerIpPerHour,
    1
  );

  if (!rateLimitCheck.allowed) {
    console.warn(`Rate limit exceeded for IP ${clientIp} on /session (${rateLimitCheck.count} requests)`);
    return jsonResponse(
      {
        error: 'Rate limit exceeded. Please try again later.',
        limit: RATE_LIMITS.sessionPerIpPerHour,
        window: '1 hour'
      },
      429
    );
  }

  // Record this request
  await recordRateLimitEntry(supabase, clientIp, 'wm-api:/session');

  const sessionId = await upsertSession(supabase, reqBody);
  return jsonResponse({ session_id: sessionId });
};

const handleEvent = async (supabase: SupabaseClient, reqBody: JsonRecord) => {
  const sessionId = reqBody.session_id as string | undefined;
  if (!sessionId) return jsonResponse({ error: "session_id required" }, 400);

  const validSession = await ensureSession(supabase, sessionId);
  if (!validSession) return jsonResponse({ error: "invalid session_id" }, 400);

  // Rate limit: 100 events per session per hour
  const rateLimitCheck = await checkRateLimit(
    supabase,
    sessionId,
    'wm-api:/event',
    RATE_LIMITS.eventPerSessionPerHour,
    1
  );

  if (!rateLimitCheck.allowed) {
    console.warn(`Rate limit exceeded for session ${sessionId} on /event (${rateLimitCheck.count} events)`);
    return jsonResponse(
      {
        error: 'Rate limit exceeded. Too many events for this session.',
        limit: RATE_LIMITS.eventPerSessionPerHour,
        window: '1 hour'
      },
      429
    );
  }

  // Record this event request
  await recordRateLimitEntry(supabase, sessionId, 'wm-api:/event');

  const eventName = reqBody.event_name as string | undefined;
  if (!eventName) return jsonResponse({ error: "event_name required" }, 400);

  const insertData = {
    session_id: validSession,
    lead_id: reqBody.lead_id ?? null,
    event_name: eventName,
    event_source: (reqBody.event_source as string | undefined) ?? "server",
    page_path: reqBody.page_path ?? null,
    tool_name: reqBody.tool_name ?? null,
    params: (reqBody.params as JsonRecord | undefined) ?? {},
  };

  const { error } = await supabase.from("wm_events").insert(insertData);
  if (error) {
    return jsonResponse({ error: "failed to log event" }, 500);
  }
  return jsonResponse({ ok: true });
};

const validateUploadInput = (input: JsonRecord) => {
  const sessionId = input.session_id as string | undefined;
  const fileName = input.file_name as string | undefined;
  const mimeType = input.mime_type as string | undefined;
  const sizeBytes = input.size_bytes as number | undefined;
  if (!sessionId) throw new Error("session_id required");
  if (!fileName) throw new Error("file_name required");
  if (!mimeType || !ALLOWED_MIME.has(mimeType)) throw new Error("invalid mime_type");
  if (typeof sizeBytes !== "number" || sizeBytes <= 0 || sizeBytes > MAX_SIZE_BYTES) {
    throw new Error("invalid size_bytes");
  }
  return { sessionId, fileName, mimeType, sizeBytes };
};

const handleUploadUrl = async (supabase: SupabaseClient, reqBody: JsonRecord) => {
  const { sessionId, fileName, mimeType, sizeBytes } = validateUploadInput(reqBody);
  const validSession = await ensureSession(supabase, sessionId);
  if (!validSession) return jsonResponse({ error: "invalid session_id" }, 400);

  let quoteId = reqBody.quote_id as string | undefined;
  if (!quoteId) {
    const { data, error } = await supabase
      .from("wm_quotes")
      .insert({ session_id: validSession, status: "open", source: "quote_upload" })
      .select("id")
      .single();
    if (error || !data) return jsonResponse({ error: "failed to create quote" }, 500);
    quoteId = data.id as string;
  }

  const sanitized = sanitizeFilename(fileName);
  const timestamp = Date.now();
  const random = crypto.randomUUID();
  const storagePath = `quotes/${validSession}/${timestamp}-${random}-${sanitized}`;

const { data: urlData, error: urlError } = await supabase.storage
      .from("quotes")
      .createSignedUploadUrl(storagePath, { upsert: false });

  if (urlError || !urlData) {
    return jsonResponse({ error: "failed to create upload url" }, 500);
  }

  const { signedUrl, path, token } = urlData;

  const { data: fileRow, error: fileError } = await supabase
    .from("wm_files")
    .insert({
      session_id: validSession,
      lead_id: reqBody.lead_id ?? null,
      quote_id: quoteId,
      kind: "quote_upload",
      storage_bucket: "quotes",
      storage_path: storagePath,
      file_name: sanitized,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      meta: { client_provided_name: fileName, token },
    })
    .select("id")
    .single();

  if (fileError || !fileRow) {
    return jsonResponse({ error: "failed to register file" }, 500);
  }

  return jsonResponse({
    quote_id: quoteId,
    file_id: fileRow.id,
    upload_url: signedUrl,
    storage_path: path ?? storagePath,
  });
};

const handleUploadComplete = async (supabase: SupabaseClient, reqBody: JsonRecord) => {
  const sessionId = reqBody.session_id as string | undefined;
  const fileId = reqBody.file_id as string | undefined;
  const sha256 = reqBody.sha256 as string | undefined;
  if (!sessionId || !fileId) return jsonResponse({ error: "session_id and file_id required" }, 400);

  const validSession = await ensureSession(supabase, sessionId);
  if (!validSession) return jsonResponse({ error: "invalid session_id" }, 400);

  const { data: fileRow, error: fileFetchError } = await supabase
    .from("wm_files")
    .select("id, quote_id, mime_type, size_bytes, session_id")
    .eq("id", fileId)
    .eq("session_id", validSession)
    .single();

  if (fileFetchError || !fileRow) {
    return jsonResponse({ error: "file not found for session" }, 404);
  }

  if (sha256) {
    await supabase.from("wm_files").update({ sha256 }).eq("id", fileId);
  }

  await supabase.from("wm_events").insert({
    session_id: validSession,
    lead_id: reqBody.lead_id ?? null,
    event_name: "wm_quote_upload_success",
    event_source: "server",
    tool_name: "quote_scanner",
    params: {
      file_id: fileId,
      quote_id: fileRow.quote_id,
      mime_type: fileRow.mime_type,
      size_bytes: fileRow.size_bytes,
    },
  });

  return jsonResponse({ ok: true });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const supabase = getSupabase();
    const body = (await req.json().catch(() => ({}))) as JsonRecord;
    const clientIp = getClientIp(req);

    if (req.method === "POST" && path.endsWith("/session")) {
      return await handleSession(supabase, body, clientIp);
    }

    if (req.method === "POST" && path.endsWith("/event")) {
      return await handleEvent(supabase, body);
    }

    if (req.method === "POST" && path.endsWith("/upload-url")) {
      return await handleUploadUrl(supabase, body);
    }

    if (req.method === "POST" && path.endsWith("/upload-complete")) {
      return await handleUploadComplete(supabase, body);
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    console.error("wm-api error", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
