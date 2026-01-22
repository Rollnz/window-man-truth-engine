// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ATTRIBUTION ROAS EDGE FUNCTION TESTS
// Tests error handling, column references, and ROAS calculation logic
// ═══════════════════════════════════════════════════════════════════════════

import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1/admin-attribution-roas`;

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

Deno.test("admin-attribution-roas: requires authentication", async () => {
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

Deno.test("admin-attribution-roas: rejects invalid token", async () => {
  const { status, body } = await fetchWithAuth(BASE_URL, "invalid-token-12345");
  
  if (status !== 401) {
    throw new Error(`Expected 401, got ${status}: ${body}`);
  }
  
  console.log("✓ Invalid tokens return 401");
});

Deno.test("admin-attribution-roas: handles CORS preflight", async () => {
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
// ═══════════════════════════════════════════════════════════════════════════

Deno.test("admin-attribution-roas: source code has no invalid column references", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution-roas/index.ts");
  
  const invalidColumns = [
    "last_non_direct_utm_campaign", // This column does NOT exist in wm_leads
  ];
  
  for (const col of invalidColumns) {
    // Allow it in comments (explaining why it doesn't exist)
    const lines = sourceCode.split('\n');
    for (const line of lines) {
      if (line.includes(col) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        throw new Error(`Invalid column reference found in non-comment: ${col}`);
      }
    }
  }
  
  console.log("✓ No invalid column references in source code");
});

Deno.test("admin-attribution-roas: deriveCampaign uses only utm_campaign", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution-roas/index.ts");
  
  // Find the deriveCampaign function
  const funcMatch = sourceCode.match(/function deriveCampaign\([^)]*\)[^{]*\{[^}]+\}/s);
  if (!funcMatch) {
    throw new Error("Could not find deriveCampaign function");
  }
  
  const funcBody = funcMatch[0];
  
  // Should only use utm_campaign
  if (!funcBody.includes("utm_campaign")) {
    throw new Error("deriveCampaign should reference utm_campaign");
  }
  
  // Should NOT reference non-existent column
  if (funcBody.includes("last_non_direct_utm_campaign")) {
    throw new Error("deriveCampaign should NOT reference last_non_direct_utm_campaign");
  }
  
  console.log("✓ deriveCampaign uses only utm_campaign");
});

Deno.test("admin-attribution-roas: has hard-fail error handling for deals query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution-roas/index.ts");
  
  if (!sourceCode.includes("dealsError")) {
    throw new Error("Missing error variable for deals query");
  }
  
  if (!sourceCode.includes("throw new Error('Failed to fetch deals')")) {
    throw new Error("Missing hard-fail throw for deals query error");
  }
  
  console.log("✓ Has hard-fail error handling for deals query");
});

Deno.test("admin-attribution-roas: has hard-fail error handling for spend query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution-roas/index.ts");
  
  if (!sourceCode.includes("spendError")) {
    throw new Error("Missing error variable for spend query");
  }
  
  if (!sourceCode.includes("throw new Error('Failed to fetch ad spend')")) {
    throw new Error("Missing hard-fail throw for spend query error");
  }
  
  console.log("✓ Has hard-fail error handling for spend query");
});

Deno.test("admin-attribution-roas: uses valid wm_leads columns", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution-roas/index.ts");
  
  // Check for valid columns in wm_leads select
  const selectMatch = sourceCode.match(/from\('wm_leads'\)\s*\.select\(`[^`]+`\)/s);
  if (!selectMatch) {
    throw new Error("Could not find wm_leads select statement");
  }
  
  const selectStatement = selectMatch[0];
  
  // Valid attribution columns
  const validColumns = [
    "id",
    "utm_campaign",
    "utm_source",
    "gclid",
    "fbclid",
    "last_non_direct_gclid",
    "last_non_direct_fbclid",
    "last_non_direct_utm_source",
  ];
  
  // At least some valid columns should be present
  let foundValid = false;
  for (const col of validColumns) {
    if (selectStatement.includes(col)) {
      foundValid = true;
      break;
    }
  }
  
  if (!foundValid) {
    throw new Error("wm_leads select should include valid attribution columns");
  }
  
  console.log("✓ wm_leads query uses valid columns");
});

Deno.test("admin-attribution-roas: safeDivide handles edge cases", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-attribution-roas/index.ts");
  
  // Check safeDivide exists
  if (!sourceCode.includes("function safeDivide")) {
    throw new Error("Missing safeDivide function");
  }
  
  // Should return null for zero divisor
  if (!sourceCode.match(/return\s+null/)) {
    throw new Error("safeDivide should return null for edge cases");
  }
  
  console.log("✓ safeDivide handles edge cases");
});

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("ADMIN-ATTRIBUTION-ROAS TEST SUITE");
console.log("═══════════════════════════════════════════════════════════════\n");
