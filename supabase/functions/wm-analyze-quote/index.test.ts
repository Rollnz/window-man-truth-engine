// ═══════════════════════════════════════════════════════════════════════════
// WM-ANALYZE-QUOTE END-TO-END TESTS
// Validates auth, validation, and full AI pipeline via live HTTP calls
// ═══════════════════════════════════════════════════════════════════════════

import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SECRET = Deno.env.get("WM_ANALYZE_QUOTE_SECRET");

const BASE_URL = `${SUPABASE_URL}/functions/v1/wm-analyze-quote`;
const TRACE_ID = "8f42b1c3-5d9e-4a7b-b2e1-9c3f4d5a6e7b";

// A public image that is NOT a window quote (expect 422 INVALID_QUOTE)
const TEST_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/300px-PNG_transparency_demonstration_1.png";

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1: 401 on missing auth
// ═══════════════════════════════════════════════════════════════════════════
Deno.test("wm-analyze-quote: 401 on missing auth", async () => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify({ file_url: TEST_IMAGE_URL, mime_type: "image/png", trace_id: TRACE_ID }),
  });
  const body = await res.json();
  if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}: ${JSON.stringify(body)}`);
  if (body.error?.code !== "AUTH_FAILED") throw new Error(`Expected AUTH_FAILED, got ${body.error?.code}`);
  console.log("✓ Missing auth → 401 AUTH_FAILED");
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2: 401 on wrong auth
// ═══════════════════════════════════════════════════════════════════════════
Deno.test("wm-analyze-quote: 401 on wrong auth", async () => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer wrong-secret-value",
    },
    body: JSON.stringify({ file_url: TEST_IMAGE_URL, mime_type: "image/png", trace_id: TRACE_ID }),
  });
  const body = await res.json();
  if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}: ${JSON.stringify(body)}`);
  if (body.error?.code !== "AUTH_FAILED") throw new Error(`Expected AUTH_FAILED, got ${body.error?.code}`);
  console.log("✓ Wrong auth → 401 AUTH_FAILED");
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3: 400 on invalid body (missing trace_id)
// ═══════════════════════════════════════════════════════════════════════════
Deno.test({ name: "wm-analyze-quote: 400 on invalid body", ignore: !SECRET, fn: async () => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SECRET}`,
    },
    body: JSON.stringify({ file_url: TEST_IMAGE_URL }), // missing mime_type and trace_id
  });
  const body = await res.json();
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(body)}`);
  if (body.error?.code !== "VALIDATION_ERROR") throw new Error(`Expected VALIDATION_ERROR, got ${body.error?.code}`);
  console.log("✓ Invalid body → 400 VALIDATION_ERROR");
}});

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4: Full pipeline (expect 200 or 422)
// ═══════════════════════════════════════════════════════════════════════════
Deno.test({ name: "wm-analyze-quote: full pipeline returns envelope or INVALID_QUOTE", ignore: !SECRET, fn: async () => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SECRET}`,
    },
    body: JSON.stringify({
      file_url: TEST_IMAGE_URL,
      mime_type: "image/png",
      trace_id: TRACE_ID,
      opening_count: 5,
      area_name: "South Florida",
    }),
  });
  const body = await res.json();

  if (res.status === 422) {
    if (body.error?.code !== "INVALID_QUOTE") throw new Error(`Expected INVALID_QUOTE on 422, got ${body.error?.code}`);
    console.log("✓ Full pipeline → 422 INVALID_QUOTE (correct — test image is not a quote)");
    return;
  }

  if (res.status !== 200) throw new Error(`Expected 200 or 422, got ${res.status}: ${JSON.stringify(body)}`);

  // Validate AnalysisEnvelope structure
  const { meta, preview, full } = body;

  if (meta.trace_id !== TRACE_ID) throw new Error(`trace_id mismatch: ${meta.trace_id}`);
  if (meta.analysis_version !== "wm_rubric_v3.0") throw new Error(`version mismatch: ${meta.analysis_version}`);
  if (typeof meta.model_used !== "string") throw new Error("meta.model_used not string");
  if (typeof meta.processing_time_ms !== "number") throw new Error("meta.processing_time_ms not number");

  if (typeof preview.score !== "number" || preview.score < 0 || preview.score > 100) throw new Error(`Invalid preview.score: ${preview.score}`);
  if (!["critical", "high", "moderate", "acceptable"].includes(preview.risk_level)) throw new Error(`Invalid risk_level: ${preview.risk_level}`);

  if (typeof full.dashboard.overall_score !== "number") throw new Error("dashboard.overall_score not number");
  if (!Array.isArray(full.dashboard.warnings)) throw new Error("dashboard.warnings not array");
  if (!Array.isArray(full.dashboard.missing_items)) throw new Error("dashboard.missing_items not array");

  if (!Array.isArray(full.forensic.statute_citations)) throw new Error("forensic.statute_citations not array");
  if (typeof full.forensic.hard_cap_applied !== "boolean") throw new Error("forensic.hard_cap_applied not boolean");

  if (!Array.isArray(full.extracted_identity.noa_numbers)) throw new Error("extracted_identity.noa_numbers not array");

  console.log(`✓ Full pipeline → 200 OK | Score: ${preview.score} | Grade: ${preview.grade} | ${meta.processing_time_ms}ms`);
}});

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("WM-ANALYZE-QUOTE END-TO-END TEST SUITE");
console.log("═══════════════════════════════════════════════════════════════\n");
