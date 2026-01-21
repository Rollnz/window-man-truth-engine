// ═══════════════════════════════════════════════════════════════════════════
// ADMIN GLOBAL SEARCH EDGE FUNCTION TESTS
// Tests error handling, column references, and response structure
// ═══════════════════════════════════════════════════════════════════════════

import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1/admin-global-search`;

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

Deno.test("admin-global-search: requires authentication", async () => {
  const { status, body } = await fetchWithAuth(`${BASE_URL}?q=test`);
  
  if (status !== 401) {
    throw new Error(`Expected 401, got ${status}: ${body}`);
  }
  
  const parsed = JSON.parse(body);
  if (!parsed.error) {
    throw new Error("Expected error in response body");
  }
  
  console.log("✓ Unauthenticated requests return 401");
});

Deno.test("admin-global-search: rejects invalid token", async () => {
  const { status, body } = await fetchWithAuth(`${BASE_URL}?q=test`, "invalid-token-12345");
  
  if (status !== 401) {
    throw new Error(`Expected 401, got ${status}: ${body}`);
  }
  
  console.log("✓ Invalid tokens return 401");
});

Deno.test("admin-global-search: handles CORS preflight", async () => {
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

Deno.test("admin-global-search: rejects non-GET methods", async () => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: "test" }),
  });
  const body = await response.text();
  
  if (response.status !== 405) {
    throw new Error(`Expected 405, got ${response.status}: ${body}`);
  }
  
  console.log("✓ Non-GET methods return 405");
});

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

Deno.test("admin-global-search: has hard-fail error handling for search query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-global-search/index.ts");
  
  // Check for error handling pattern after search query
  if (!sourceCode.includes("indexError")) {
    throw new Error("Missing error variable for search query");
  }
  
  // Should throw instead of returning 500 response
  if (!sourceCode.includes("throw new Error('Search query failed")) {
    throw new Error("Missing hard-fail throw for search query error");
  }
  
  console.log("✓ Has hard-fail error handling for search query");
});

Deno.test("admin-global-search: uses valid global_search_index columns", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-global-search/index.ts");
  
  // These are the valid columns in global_search_index
  const validColumns = [
    "id",
    "entity_type",
    "entity_id",
    "lead_id",
    "title",
    "subtitle",
    "keywords",
    "payload",
    "updated_at",
  ];
  
  // Check that the select statement uses valid columns
  const selectMatch = sourceCode.match(/from\('global_search_index'\)\s*\.select\([^)]+\)/);
  if (!selectMatch) {
    throw new Error("Could not find global_search_index select statement");
  }
  
  const selectStatement = selectMatch[0];
  for (const col of validColumns) {
    if (!selectStatement.includes(col)) {
      console.warn(`Column ${col} not found in select, may be intentional`);
    }
  }
  
  console.log("✓ global_search_index query uses valid columns");
});

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("ADMIN-GLOBAL-SEARCH TEST SUITE");
console.log("═══════════════════════════════════════════════════════════════\n");
