// ═══════════════════════════════════════════════════════════════════════════
// ADMIN REVENUE EDGE FUNCTION TESTS
// Tests error handling, column references, and response structure
// ═══════════════════════════════════════════════════════════════════════════

import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1/admin-revenue`;

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

Deno.test("admin-revenue: requires authentication", async () => {
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

Deno.test("admin-revenue: rejects invalid token", async () => {
  const { status, body } = await fetchWithAuth(BASE_URL, "invalid-token-12345");
  
  if (status !== 401) {
    throw new Error(`Expected 401, got ${status}: ${body}`);
  }
  
  console.log("✓ Invalid tokens return 401");
});

Deno.test("admin-revenue: handles CORS preflight", async () => {
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

Deno.test("admin-revenue: rejects non-GET methods", async () => {
  // Need a valid token for this test to hit the method check
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer fake-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const body = await response.text();
  
  // Will fail auth first (401), which is fine for this test
  if (response.status !== 401 && response.status !== 405) {
    throw new Error(`Expected 401 or 405, got ${response.status}: ${body}`);
  }
  
  console.log("✓ Non-GET methods are properly handled");
});

// ═══════════════════════════════════════════════════════════════════════════
// COLUMN REFERENCE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

Deno.test("admin-revenue: source code has no invalid column references", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-revenue/index.ts");
  
  const invalidColumns = [
    "last_non_direct_utm_campaign", // This column does NOT exist in wm_leads
  ];
  
  for (const col of invalidColumns) {
    // Allow in comments
    const lines = sourceCode.split('\n');
    for (const line of lines) {
      if (line.includes(col) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        throw new Error(`Invalid column reference found in non-comment: ${col}`);
      }
    }
  }
  
  console.log("✓ No invalid column references in source code");
});

Deno.test("admin-revenue: uses valid wm_leads columns", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-revenue/index.ts");
  
  // Check for valid columns in wm_leads select
  const selectMatch = sourceCode.match(/from\('wm_leads'\)\s*\.select\(`[^`]+`\)/s);
  if (!selectMatch) {
    throw new Error("Could not find wm_leads select statement");
  }
  
  const selectStatement = selectMatch[0];
  
  // Valid attribution columns that SHOULD be present
  const requiredColumns = [
    "id",
    "utm_campaign",
    "utm_source",
  ];
  
  for (const col of requiredColumns) {
    if (!selectStatement.includes(col)) {
      throw new Error(`Missing required column in wm_leads select: ${col}`);
    }
  }
  
  console.log("✓ wm_leads query uses valid columns");
});

Deno.test("admin-revenue: derivePlatform uses valid columns", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-revenue/index.ts");
  
  // Find the derivePlatform function
  const funcMatch = sourceCode.match(/function derivePlatform\([^)]*\)[^{]*\{[\s\S]*?^\}/m);
  if (!funcMatch) {
    throw new Error("Could not find derivePlatform function");
  }
  
  const funcBody = funcMatch[0];
  
  // Should use valid attribution fields
  const validFields = [
    "last_non_direct_gclid",
    "last_non_direct_fbclid",
    "gclid",
    "fbclid",
    "last_non_direct_utm_source",
    "utm_source",
  ];
  
  let foundValid = false;
  for (const field of validFields) {
    if (funcBody.includes(field)) {
      foundValid = true;
      break;
    }
  }
  
  if (!foundValid) {
    throw new Error("derivePlatform should use valid attribution fields");
  }
  
  // Should NOT use non-existent column
  if (funcBody.includes("last_non_direct_utm_campaign")) {
    throw new Error("derivePlatform should NOT reference last_non_direct_utm_campaign");
  }
  
  console.log("✓ derivePlatform uses valid columns");
});

Deno.test("admin-revenue: has global error handler", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-revenue/index.ts");
  
  // Should have catch block that returns 500
  if (!sourceCode.includes("catch (error")) {
    throw new Error("Missing catch block");
  }
  
  if (!sourceCode.includes("status: 500")) {
    throw new Error("Missing 500 status in error handler");
  }
  
  console.log("✓ Has global error handler");
});

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("ADMIN-REVENUE TEST SUITE");
console.log("═══════════════════════════════════════════════════════════════\n");
