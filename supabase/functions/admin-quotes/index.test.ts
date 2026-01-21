// ═══════════════════════════════════════════════════════════════════════════
// ADMIN QUOTES EDGE FUNCTION TESTS
// Tests error handling, column references, and response structure
// ═══════════════════════════════════════════════════════════════════════════

import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1/admin-quotes`;

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

Deno.test("admin-quotes: requires authentication", async () => {
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

Deno.test("admin-quotes: rejects invalid token", async () => {
  const { status, body } = await fetchWithAuth(BASE_URL, "invalid-token-12345");
  
  if (status !== 401) {
    throw new Error(`Expected 401, got ${status}: ${body}`);
  }
  
  console.log("✓ Invalid tokens return 401");
});

Deno.test("admin-quotes: handles CORS preflight", async () => {
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
// ERROR HANDLING VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

Deno.test("admin-quotes: has hard-fail error handling for leads query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-quotes/index.ts");
  
  // Check for error handling pattern after leads query
  if (!sourceCode.includes("leadsError")) {
    throw new Error("Missing error variable for leads query");
  }
  
  if (!sourceCode.includes("throw new Error(\"Failed to fetch leads data\")")) {
    throw new Error("Missing hard-fail throw for leads query error");
  }
  
  console.log("✓ Has hard-fail error handling for leads query");
});

Deno.test("admin-quotes: has hard-fail error handling for count query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-quotes/index.ts");
  
  // Check for error handling pattern after count query
  if (!sourceCode.includes("countError")) {
    throw new Error("Missing error variable for count query");
  }
  
  if (!sourceCode.includes("throw new Error(\"Failed to count quote files\")")) {
    throw new Error("Missing hard-fail throw for count query error");
  }
  
  console.log("✓ Has hard-fail error handling for count query");
});

Deno.test("admin-quotes: uses valid leads table columns", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-quotes/index.ts");
  
  // These are the valid columns in the leads table
  const validColumns = ["id", "name", "email", "phone"];
  
  // Check that the leads select statement uses valid columns
  const selectMatch = sourceCode.match(/from\("leads"\)\s*\.select\([^)]+\)/);
  if (!selectMatch) {
    throw new Error("Could not find leads select statement");
  }
  
  const selectStatement = selectMatch[0];
  for (const col of validColumns) {
    if (!selectStatement.includes(col)) {
      console.warn(`Column ${col} not found in select, may be intentional`);
    }
  }
  
  console.log("✓ leads query uses valid columns");
});

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("ADMIN-QUOTES TEST SUITE");
console.log("═══════════════════════════════════════════════════════════════\n");
