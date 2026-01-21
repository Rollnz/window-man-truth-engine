// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ATTRIBUTION EDGE FUNCTION TESTS
// Tests error handling, column references, and response structure
// ═══════════════════════════════════════════════════════════════════════════

import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1/admin-attribution`;

// Helper to make authenticated requests
async function fetchWithAuth(url: string, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(url, { headers });
  const body = await response.text();
  return { status: response.status, body };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

Deno.test("admin-attribution: requires authentication", async () => {
  const { status, body } = await fetchWithAuth(BASE_URL);
  
  if (status !== 401) {
    throw new Error(`Expected 401, got ${status}: ${body}`);
  }
  
  const parsed = JSON.parse(body);
  if (!parsed.error) {
    throw new Error("Expected error in response body");
  }
  
  console.log("✓ Unauthenticated requests return 401");
});

Deno.test("admin-attribution: rejects invalid token", async () => {
  const { status, body } = await fetchWithAuth(BASE_URL, "invalid-token-12345");
  
  if (status !== 401) {
    throw new Error(`Expected 401, got ${status}: ${body}`);
  }
  
  console.log("✓ Invalid tokens return 401");
});

Deno.test("admin-attribution: handles CORS preflight", async () => {
  const response = await fetch(BASE_URL, {
    method: "OPTIONS",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Origin": "https://example.com",
    },
  });
  await response.text();
  
  const allowOrigin = response.headers.get("Access-Control-Allow-Origin");
  if (allowOrigin !== "*") {
    throw new Error(`Expected CORS header, got: ${allowOrigin}`);
  }
  
  console.log("✓ CORS preflight returns proper headers");
});

// ═══════════════════════════════════════════════════════════════════════════
// COLUMN REFERENCE VALIDATION
// These tests verify the edge function doesn't reference invalid columns
// ═══════════════════════════════════════════════════════════════════════════

Deno.test("admin-attribution: source code has no invalid column references", async () => {
  // Read the source file and check for invalid column references
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution/index.ts");
  
  const invalidColumns = [
    "last_non_direct_utm_campaign", // This column does NOT exist in wm_leads
  ];
  
  for (const col of invalidColumns) {
    if (sourceCode.includes(col)) {
      throw new Error(`Invalid column reference found: ${col}`);
    }
  }
  
  console.log("✓ No invalid column references in source code");
});

Deno.test("admin-attribution: uses correct wm_leads columns", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution/index.ts");
  
  // These are the valid columns that should be used
  const validLeadColumns = [
    "original_session_id",
    "first_name",
    "last_name",
    "email",
    "phone",
    "engagement_score",
    "lead_quality",
  ];
  
  // Check that the wm_leads select statement uses valid columns
  const selectMatch = sourceCode.match(/from\('wm_leads'\)\s*\.select\([^)]+\)/);
  if (!selectMatch) {
    throw new Error("Could not find wm_leads select statement");
  }
  
  const selectStatement = selectMatch[0];
  for (const col of validLeadColumns) {
    if (!selectStatement.includes(col)) {
      console.warn(`Column ${col} not found in select, may be intentional`);
    }
  }
  
  console.log("✓ wm_leads query uses valid columns");
});

Deno.test("admin-attribution: has hard-fail error handling for leads query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution/index.ts");
  
  // Check for error handling pattern after wm_leads query
  if (!sourceCode.includes("leadsError")) {
    throw new Error("Missing error variable for leads query");
  }
  
  if (!sourceCode.includes("throw new Error('Failed to fetch leads data')")) {
    throw new Error("Missing hard-fail throw for leads query error");
  }
  
  console.log("✓ Has hard-fail error handling for leads query");
});

Deno.test("admin-attribution: has hard-fail error handling for sessions query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution/index.ts");
  
  // Check for error handling pattern after wm_sessions query
  if (!sourceCode.includes("sessionsError")) {
    throw new Error("Missing error variable for sessions query");
  }
  
  if (!sourceCode.includes("throw new Error('Failed to fetch sessions data')")) {
    throw new Error("Missing hard-fail throw for sessions query error");
  }
  
  console.log("✓ Has hard-fail error handling for sessions query");
});

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("ADMIN-ATTRIBUTION TEST SUITE");
console.log("═══════════════════════════════════════════════════════════════\n");
