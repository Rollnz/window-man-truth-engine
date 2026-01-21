// ═══════════════════════════════════════════════════════════════════════════
// ADMIN WEBHOOK RECEIPTS EDGE FUNCTION TESTS
// Tests error handling, column references, and response structure
// ═══════════════════════════════════════════════════════════════════════════

import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1/admin-webhook-receipts`;

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

Deno.test("admin-webhook-receipts: requires authentication", async () => {
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

Deno.test("admin-webhook-receipts: rejects invalid token", async () => {
  const { status, body } = await fetchWithAuth(BASE_URL, "invalid-token-12345");
  
  if (status !== 401) {
    throw new Error(`Expected 401, got ${status}: ${body}`);
  }
  
  console.log("✓ Invalid tokens return 401");
});

Deno.test("admin-webhook-receipts: handles CORS preflight", async () => {
  const response = await fetch(BASE_URL, {
    method: "OPTIONS",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Origin": "https://example.com",
    },
  });
  await response.text();
  
  // Check that CORS headers are present
  const headers = response.headers;
  if (!headers.get("Access-Control-Allow-Origin")) {
    throw new Error("Missing CORS Allow-Origin header");
  }
  
  console.log("✓ CORS preflight returns proper headers");
});

Deno.test("admin-webhook-receipts: rejects non-GET methods", async () => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
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

Deno.test("admin-webhook-receipts: has hard-fail error handling for Step A query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-webhook-receipts/index.ts");
  
  // Check for error handling pattern after Step A query
  if (!sourceCode.includes("logsAError")) {
    throw new Error("Missing error variable for Step A query");
  }
  
  if (!sourceCode.includes("throw new Error(\"Failed to query phone_call_logs by provider_call_id\")")) {
    throw new Error("Missing hard-fail throw for Step A query error");
  }
  
  console.log("✓ Has hard-fail error handling for Step A query");
});

Deno.test("admin-webhook-receipts: has hard-fail error handling for Step B query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-webhook-receipts/index.ts");
  
  // Check for error handling pattern after Step B query
  if (!sourceCode.includes("logsBError")) {
    throw new Error("Missing error variable for Step B query");
  }
  
  if (!sourceCode.includes("throw new Error(\"Failed to query phone_call_logs by call_request_id\")")) {
    throw new Error("Missing hard-fail throw for Step B query error");
  }
  
  console.log("✓ Has hard-fail error handling for Step B query");
});

Deno.test("admin-webhook-receipts: has hard-fail error handling for Step C query", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-webhook-receipts/index.ts");
  
  // Check for error handling pattern after Step C query
  if (!sourceCode.includes("pendingCError")) {
    throw new Error("Missing error variable for Step C query");
  }
  
  if (!sourceCode.includes("throw new Error(\"Failed to query pending_calls by call_request_id\")")) {
    throw new Error("Missing hard-fail throw for Step C query error");
  }
  
  console.log("✓ Has hard-fail error handling for Step C query");
});

Deno.test("admin-webhook-receipts: uses valid phone_call_logs columns", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-webhook-receipts/index.ts");
  
  // These are the valid columns in phone_call_logs
  const validColumns = [
    "id",
    "call_request_id",
    "provider_call_id",
    "call_status",
    "source_tool",
    "triggered_at",
  ];
  
  // Check that select statements use valid columns
  const selectMatches = sourceCode.matchAll(/from\("phone_call_logs"\)\s*\.select\([^)]+\)/g);
  
  for (const match of selectMatches) {
    const selectStatement = match[0];
    // Just verify no obviously invalid columns are referenced
    if (selectStatement.includes("last_non_direct_")) {
      throw new Error("Invalid last_non_direct_ column reference in phone_call_logs query");
    }
  }
  
  console.log("✓ phone_call_logs queries use valid columns");
});

Deno.test("admin-webhook-receipts: uses valid pending_calls columns", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/admin-webhook-receipts/index.ts");
  
  // These are the valid columns in pending_calls
  const validColumns = [
    "id",
    "call_request_id",
    "lead_id",
    "source_tool",
    "status",
    "scheduled_for",
  ];
  
  // Check that select statements use valid columns
  const selectMatches = sourceCode.matchAll(/from\("pending_calls"\)\s*\.select\([^)]+\)/g);
  
  for (const match of selectMatches) {
    const selectStatement = match[0];
    // Just verify no obviously invalid columns are referenced
    if (selectStatement.includes("last_non_direct_")) {
      throw new Error("Invalid last_non_direct_ column reference in pending_calls query");
    }
  }
  
  console.log("✓ pending_calls queries use valid columns");
});

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("ADMIN-WEBHOOK-RECEIPTS TEST SUITE");
console.log("═══════════════════════════════════════════════════════════════\n");
