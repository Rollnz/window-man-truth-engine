import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Allowed file types with their magic bytes
const ALLOWED_TYPES: Record<string, { mimeTypes: string[]; magicBytes: number[][] }> = {
  pdf: {
    mimeTypes: ["application/pdf"],
    magicBytes: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  },
  jpeg: {
    mimeTypes: ["image/jpeg", "image/jpg"],
    magicBytes: [[0xff, 0xd8, 0xff]], // JPEG SOI marker
  },
  png: {
    mimeTypes: ["image/png"],
    magicBytes: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], // PNG signature
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const RATE_LIMIT_MAX = 5; // Max uploads per session per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Validate file magic bytes to prevent MIME spoofing
 */
function validateMagicBytes(buffer: ArrayBuffer): { valid: boolean; detectedType: string | null } {
  const bytes = new Uint8Array(buffer);

  for (const [type, config] of Object.entries(ALLOWED_TYPES)) {
    for (const magic of config.magicBytes) {
      if (magic.every((byte, index) => bytes[index] === byte)) {
        return { valid: true, detectedType: type };
      }
    }
  }

  return { valid: false, detectedType: null };
}

/**
 * Validate MIME type from Content-Type header
 */
function validateMimeType(mimeType: string): boolean {
  const normalizedMime = mimeType.toLowerCase().split(";")[0].trim();
  return Object.values(ALLOWED_TYPES).some((config) => config.mimeTypes.includes(normalizedMime));
}

/**
 * Sanitize filename to prevent path traversal and special character issues
 */
function sanitizeFilename(filename: string): string {
  // Remove path components
  let sanitized = filename.replace(/^.*[\\\/]/, "");

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, "");

  // Replace dangerous characters
  sanitized = sanitized.replace(/[<>:"\/\\|?*]/g, "_");

  // Limit length (keep extension)
  const ext = sanitized.split(".").pop() || "";
  const name = sanitized.slice(0, -(ext.length + 1));
  const truncatedName = name.slice(0, 50);

  return `${truncatedName}.${ext}`.toLowerCase();
}

/**
 * Get file extension from detected type
 */
function getExtension(detectedType: string): string {
  const extMap: Record<string, string> = {
    pdf: "pdf",
    jpeg: "jpg",
    png: "png",
  };
  return extMap[detectedType] || "bin";
}

/**
 * Check rate limit for session
 */
async function checkRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  sessionId: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  // Count recent uploads for this session
  const { count, error } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("identifier", sessionId)
    .eq("endpoint", "upload-quote")
    .gte("created_at", cutoff);

  if (error) {
    console.error("Rate limit check error:", error);
    // Fail open but log the issue
    return { allowed: true, remaining: RATE_LIMIT_MAX };
  }

  const currentCount = count || 0;
  return {
    allowed: currentCount < RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - currentCount),
  };
}

/**
 * Record rate limit hit
 */
async function recordRateLimitHit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  sessionId: string,
): Promise<void> {
  await supabase.from("rate_limits").insert({
    identifier: sessionId,
    endpoint: "upload-quote",
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error_code: "METHOD_NOT_ALLOWED", message: "Only POST allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // Initialize Supabase Admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("session_id") as string | null;
    const sourcePage = (formData.get("source_page") as string) || "beat-your-quote";
    const utmSource = formData.get("utm_source") as string | null;
    const utmMedium = formData.get("utm_medium") as string | null;
    const utmCampaign = formData.get("utm_campaign") as string | null;

    // Validate required fields
    if (!file) {
      return new Response(JSON.stringify({ success: false, error_code: "NO_FILE", message: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sessionId || sessionId.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error_code: "INVALID_SESSION", message: "Valid session_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(supabase, sessionId);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "RATE_LIMITED",
          message: "Too many uploads. Please try again later.",
          remaining: 0,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "FILE_TOO_LARGE",
          message: `File exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (file.size === 0) {
      return new Response(JSON.stringify({ success: false, error_code: "EMPTY_FILE", message: "File is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate MIME type from header
    if (!validateMimeType(file.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "INVALID_MIME",
          message: "Only PDF, JPEG, and PNG files are allowed",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Read file buffer and validate magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const magicValidation = validateMagicBytes(arrayBuffer);

    if (!magicValidation.valid || !magicValidation.detectedType) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "INVALID_FILE_CONTENT",
          message: "File content does not match allowed types (PDF, JPEG, PNG)",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate safe file path
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const extension = getExtension(magicValidation.detectedType);
    const sanitizedOriginalName = sanitizeFilename(file.name);
    const storagePath = `${sessionId}/${timestamp}-${uuid}.${extension}`;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage.from("quotes").upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "UPLOAD_FAILED",
          message: "Failed to store file",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Insert metadata into quote_files table
    const { data: insertData, error: insertError } = await supabase
      .from("quote_files")
      .insert({
        session_id: sessionId,
        file_path: storagePath,
        file_name: sanitizedOriginalName,
        file_size: file.size,
        mime_type: file.type,
        source_page: sourcePage,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      // Attempt to clean up the uploaded file
      await supabase.storage.from("quotes").remove([storagePath]);

      return new Response(
        JSON.stringify({
          success: false,
          error_code: "DB_INSERT_FAILED",
          message: "Failed to record file metadata",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Record rate limit hit
    await recordRateLimitHit(supabase, sessionId);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        file_id: insertData.id,
        file_path: storagePath,
        file_name: sanitizedOriginalName,
        file_size: file.size,
        remaining_uploads: rateLimit.remaining - 1,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("upload-quote error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error_code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
