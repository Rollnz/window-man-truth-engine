import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===== Config =====
// Database-driven admin check via user_roles table
// deno-lint-ignore no-explicit-any
async function hasAdminRole(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[admin-smoke-test] Error checking admin role:", error.message);
    return false;
  }
  return !!data;
}

// ===== CORS =====
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== Types =====
type ExpectedKind = "list" | "aggregate" | "error";

interface InvariantResult {
  name: string;
  passed: boolean;
  detail?: string;
}

interface TestResult {
  function_name: string;
  test_name: string;
  passed: boolean;
  expected_http: number;
  actual_http: number;
  expected_kind: ExpectedKind;
  shape_signature: string[];
  invariants: InvariantResult[];
  error?: string;
  duration_ms: number;
}

interface SmokeTestReport {
  ok: boolean;
  timestamp: string;
  total_tests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  markdown_report: string;
}

interface TestScenario {
  name: string;
  test_name: string;
  url: string;
  method: string;
  body: unknown | null;
  expectedKind: ExpectedKind;
  expectedHttp: number;
}

// ===== Response helpers =====
function errorResponse(status: number, code: string, message: string) {
  return new Response(JSON.stringify({ 
    ok: false, 
    code, 
    error: message,
    timestamp: new Date().toISOString(),
  }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// isAdminEmail is no longer used - we use hasAdminRole instead
// (keeping function stub for backwards compatibility with type checks)

// ===== Invariant Checkers =====

function checkEnvelopeInvariants(json: unknown): InvariantResult[] {
  const results: InvariantResult[] = [];
  
  if (typeof json !== "object" || json === null) {
    results.push({ name: "valid_json_object", passed: false, detail: "Response is not a JSON object" });
    return results;
  }
  
  results.push({ name: "valid_json_object", passed: true });
  
  const obj = json as Record<string, unknown>;
  
  // If `ok` exists, must be boolean
  if ("ok" in obj) {
    const okIsBoolean = typeof obj.ok === "boolean";
    results.push({ 
      name: "ok_is_boolean", 
      passed: okIsBoolean, 
      detail: okIsBoolean ? undefined : `ok is ${typeof obj.ok}` 
    });
  }
  
  // If `code` exists, must be string
  if ("code" in obj) {
    const codeIsString = typeof obj.code === "string";
    results.push({ 
      name: "code_is_string", 
      passed: codeIsString, 
      detail: codeIsString ? undefined : `code is ${typeof obj.code}` 
    });
  }
  
  // If `timestamp` exists, must be string
  if ("timestamp" in obj) {
    const tsIsString = typeof obj.timestamp === "string";
    results.push({ 
      name: "timestamp_is_string", 
      passed: tsIsString, 
      detail: tsIsString ? undefined : `timestamp is ${typeof obj.timestamp}` 
    });
  }
  
  return results;
}

function checkListInvariants(json: unknown): InvariantResult[] {
  const results: InvariantResult[] = [];
  
  if (typeof json !== "object" || json === null) {
    results.push({ name: "list_has_collection", passed: false, detail: "Not an object" });
    return results;
  }
  
  const obj = json as Record<string, unknown>;
  const collectionKeys = ["items", "rows", "results", "receipts", "events", "quotes"];
  
  let foundCollection: string | null = null;
  let collectionValue: unknown = null;
  
  for (const key of collectionKeys) {
    if (key in obj) {
      foundCollection = key;
      collectionValue = obj[key];
      break;
    }
  }
  
  if (!foundCollection) {
    // Check nested (e.g., grouped.leads)
    if ("grouped" in obj && typeof obj.grouped === "object" && obj.grouped !== null) {
      results.push({ name: "list_has_collection", passed: true, detail: "Found grouped object" });
      return results;
    }
    results.push({ 
      name: "list_has_collection", 
      passed: false, 
      detail: `No collection key found. Keys: ${Object.keys(obj).join(", ")}` 
    });
    return results;
  }
  
  results.push({ name: "list_has_collection", passed: true, detail: `Found: ${foundCollection}` });
  
  // Collection must be an array
  const isArray = Array.isArray(collectionValue);
  results.push({ 
    name: "collection_is_array", 
    passed: isArray, 
    detail: isArray ? `${foundCollection} has ${(collectionValue as unknown[]).length} items` : `${foundCollection} is not an array` 
  });
  
  // === WM_LEAD_ID INVARIANT ===
  // For collections with lead-related items, verify wm_lead_id is present for routing
  // This applies to: quotes, items (global search), events (attribution)
  if (isArray && (foundCollection === "quotes" || foundCollection === "items" || foundCollection === "events")) {
    const arr = collectionValue as Record<string, unknown>[];
    
    // For quotes/items: check items that have lead_id
    // For events: check items that have lead contact info (lead_first_name, lead_email, etc.)
    let itemsWithLeadLink: Record<string, unknown>[] = [];
    
    if (foundCollection === "events") {
      // Attribution events: if we have lead info, we must have wm_lead_id
      itemsWithLeadLink = arr.filter(item => 
        item.lead_first_name || item.lead_last_name || item.lead_email
      );
    } else {
      // Quotes/items: if we have lead_id, we must have wm_lead_id
      itemsWithLeadLink = arr.filter(item => item.lead_id !== null && item.lead_id !== undefined);
    }
    
    if (itemsWithLeadLink.length > 0) {
      const allHaveWmLeadId = itemsWithLeadLink.every(item => 
        typeof item.wm_lead_id === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.wm_lead_id as string)
      );
      results.push({
        name: "wm_lead_id_present",
        passed: allHaveWmLeadId,
        detail: allHaveWmLeadId 
          ? `All ${itemsWithLeadLink.length} linked items have valid wm_lead_id` 
          : `Some ${foundCollection} items with lead info missing valid wm_lead_id for routing`
      });
    }
  }
  
  // === DEALS WM_LEAD_ID INVARIANT ===
  // For recentDeals in admin-revenue, verify wm_lead_id is present
  if ("recentDeals" in obj && Array.isArray(obj.recentDeals)) {
    const deals = obj.recentDeals as Record<string, unknown>[];
    if (deals.length > 0) {
      const allHaveWmLeadId = deals.every(deal => 
        typeof deal.wm_lead_id === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deal.wm_lead_id as string)
      );
      results.push({
        name: "deals_wm_lead_id_present",
        passed: allHaveWmLeadId,
        detail: allHaveWmLeadId 
          ? `All ${deals.length} deals have valid wm_lead_id` 
          : "Some deals missing valid wm_lead_id for routing"
      });
    }
  }
  
  // Check pagination metadata (optional, but if present must be valid)
  const hasMeta = "meta" in obj && typeof obj.meta === "object" && obj.meta !== null;
  const hasTotal = "total" in obj && typeof obj.total === "number";
  const hasNextCursor = "next_cursor" in obj;
  const metaHasCount = hasMeta && "count" in (obj.meta as Record<string, unknown>);
  
  if (hasMeta || hasTotal || hasNextCursor) {
    const validPagination = hasTotal || hasNextCursor || metaHasCount;
    results.push({ 
      name: "valid_pagination", 
      passed: validPagination, 
      detail: validPagination ? "Pagination metadata present" : "Invalid pagination format" 
    });
  }
  
  return results;
}

function checkAggregateInvariants(json: unknown): InvariantResult[] {
  const results: InvariantResult[] = [];
  
  if (typeof json !== "object" || json === null) {
    results.push({ name: "aggregate_has_summary", passed: false, detail: "Not an object" });
    return results;
  }
  
  const obj = json as Record<string, unknown>;
  // Object-based summary keys
  const objectSummaryKeys = ["summary", "kpis", "globalKpi"];
  
  let foundSummary: string | null = null;
  
  // First check for object-based summary keys
  for (const key of objectSummaryKeys) {
    if (key in obj && typeof obj[key] === "object" && obj[key] !== null) {
      foundSummary = key;
      break;
    }
  }
  
  // For health-check endpoints: accept "ok" as boolean as valid aggregate
  if (!foundSummary && "ok" in obj && typeof obj.ok === "boolean") {
    foundSummary = "ok";
  }
  
  if (!foundSummary) {
    results.push({ 
      name: "aggregate_has_summary", 
      passed: false, 
      detail: `No summary key found. Keys: ${Object.keys(obj).join(", ")}` 
    });
    return results;
  }
  
  results.push({ name: "aggregate_has_summary", passed: true, detail: `Found: ${foundSummary}` });
  
  // ROAS-style: if summary exists, rows must exist and be array
  if (foundSummary === "summary" && "rows" in obj) {
    const rowsIsArray = Array.isArray(obj.rows);
    results.push({ 
      name: "roas_rows_array", 
      passed: rowsIsArray, 
      detail: rowsIsArray ? `rows has ${(obj.rows as unknown[]).length} items` : "rows is not an array" 
    });
  }
  
  // Revenue-style: if kpis exists, recentDeals must exist and be array
  if (foundSummary === "kpis" && "recentDeals" in obj) {
    const dealsIsArray = Array.isArray(obj.recentDeals);
    results.push({ 
      name: "revenue_deals_array", 
      passed: dealsIsArray, 
      detail: dealsIsArray ? `recentDeals has ${(obj.recentDeals as unknown[]).length} items` : "recentDeals is not an array" 
    });
  }
  
  return results;
}

function checkErrorInvariants(json: unknown): InvariantResult[] {
  const results: InvariantResult[] = [];
  
  if (typeof json !== "object" || json === null) {
    results.push({ name: "error_response_valid", passed: false, detail: "Not an object" });
    return results;
  }
  
  const obj = json as Record<string, unknown>;
  
  // Must have ok: false OR error string
  const hasOkFalse = "ok" in obj && obj.ok === false;
  const hasErrorString = "error" in obj && typeof obj.error === "string";
  
  const isValidError = hasOkFalse || hasErrorString;
  results.push({ 
    name: "error_response_valid", 
    passed: isValidError, 
    detail: isValidError ? (hasOkFalse ? "ok=false" : "error string present") : "No ok:false or error string" 
  });
  
  // Must NOT have ok: true
  if ("ok" in obj && obj.ok === true) {
    results.push({ 
      name: "not_success_envelope", 
      passed: false, 
      detail: "Response has ok=true but expected error" 
    });
  } else {
    results.push({ name: "not_success_envelope", passed: true });
  }
  
  return results;
}

function getShapeSignature(json: unknown): string[] {
  if (typeof json !== "object" || json === null) {
    return ["(not an object)"];
  }
  return Object.keys(json as Record<string, unknown>).sort();
}

// ===== Test Runner =====
async function runTest(
  scenario: TestScenario,
  headers: Record<string, string>
): Promise<TestResult> {
  const start = Date.now();
  const invariants: InvariantResult[] = [];
  
  try {
    const fetchOptions: RequestInit = {
      method: scenario.method,
      headers: { ...headers, "Content-Type": "application/json" },
    };
    if (scenario.body) {
      fetchOptions.body = JSON.stringify(scenario.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(scenario.url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    
    const actualHttp = response.status;
    const text = await response.text();
    
    // Check HTTP status
    const httpMatch = actualHttp === scenario.expectedHttp;
    invariants.push({ 
      name: "http_status", 
      passed: httpMatch, 
      detail: httpMatch ? `${actualHttp} as expected` : `Expected ${scenario.expectedHttp}, got ${actualHttp}` 
    });
    
    // Parse JSON
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      invariants.push({ name: "valid_json", passed: false, detail: `Not JSON: ${text.slice(0, 80)}` });
      return {
        function_name: scenario.name,
        test_name: scenario.test_name,
        passed: false,
        expected_http: scenario.expectedHttp,
        actual_http: actualHttp,
        expected_kind: scenario.expectedKind,
        shape_signature: [],
        invariants,
        error: "Response not valid JSON",
        duration_ms: Date.now() - start,
      };
    }
    
    invariants.push({ name: "valid_json", passed: true });
    
    // Envelope invariants (all tests)
    invariants.push(...checkEnvelopeInvariants(json));
    
    // Kind-specific invariants
    switch (scenario.expectedKind) {
      case "list":
        invariants.push(...checkListInvariants(json));
        break;
      case "aggregate":
        invariants.push(...checkAggregateInvariants(json));
        break;
      case "error":
        invariants.push(...checkErrorInvariants(json));
        break;
    }
    
    const allPassed = invariants.every(inv => inv.passed);
    
    return {
      function_name: scenario.name,
      test_name: scenario.test_name,
      passed: allPassed,
      expected_http: scenario.expectedHttp,
      actual_http: actualHttp,
      expected_kind: scenario.expectedKind,
      shape_signature: getShapeSignature(json),
      invariants,
      duration_ms: Date.now() - start,
    };
  } catch (err) {
    invariants.push({ name: "fetch_error", passed: false, detail: err instanceof Error ? err.message : "Unknown" });
    return {
      function_name: scenario.name,
      test_name: scenario.test_name,
      passed: false,
      expected_http: scenario.expectedHttp,
      actual_http: 0,
      expected_kind: scenario.expectedKind,
      shape_signature: [],
      invariants,
      error: err instanceof Error ? err.message : "Unknown error",
      duration_ms: Date.now() - start,
    };
  }
}

// ===== Generate markdown report =====
function generateMarkdownReport(results: TestResult[]): string {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const passRate = results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : "0";

  let md = `# Admin Edge Functions Smoke Test Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tests | ${results.length} |\n`;
  md += `| Passed | ✅ ${passed} |\n`;
  md += `| Failed | ❌ ${failed} |\n`;
  md += `| Pass Rate | ${passRate}% |\n\n`;

  md += `## Results by Function\n\n`;

  // Group by function
  const byFunction = new Map<string, TestResult[]>();
  for (const r of results) {
    if (!byFunction.has(r.function_name)) {
      byFunction.set(r.function_name, []);
    }
    byFunction.get(r.function_name)!.push(r);
  }

  for (const [funcName, tests] of byFunction) {
    const funcPassed = tests.every(t => t.passed);
    md += `### ${funcPassed ? "✅" : "❌"} ${funcName}\n\n`;
    
    for (const t of tests) {
      const status = t.passed ? "✅ PASS" : "❌ FAIL";
      md += `#### ${status} ${t.test_name}\n\n`;
      md += `| Property | Value |\n`;
      md += `|----------|-------|\n`;
      md += `| Expected Kind | \`${t.expected_kind}\` |\n`;
      md += `| HTTP | Expected: ${t.expected_http} / Actual: ${t.actual_http} |\n`;
      md += `| Duration | ${t.duration_ms}ms |\n`;
      md += `| Shape | \`[${t.shape_signature.join(", ")}]\` |\n\n`;
      
      if (t.invariants.length > 0) {
        md += `**Invariants:**\n\n`;
        md += `| Check | Status | Detail |\n`;
        md += `|-------|--------|--------|\n`;
        for (const inv of t.invariants) {
          const invStatus = inv.passed ? "✅" : "❌";
          md += `| ${inv.name} | ${invStatus} | ${inv.detail || "-"} |\n`;
        }
        md += "\n";
      }
      
      if (t.error) {
        md += `**Error:** ${t.error}\n\n`;
      }
    }
  }

  return md;
}

// ===== Main handler =====
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "Method not allowed");
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!supabaseUrl || !anonKey) {
      return errorResponse(500, "config_error", "Server configuration error");
    }

    // Extract bearer token
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return errorResponse(401, "unauthorized", "Missing bearer token");
    }

    // Validate JWT
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
    const user = userRes?.user;

    if (userErr || !user) {
      return errorResponse(401, "unauthorized", "Unauthorized");
    }

    // Check admin role in database
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const isAdmin = await hasAdminRole(supabaseAdmin, user.id);
    if (!isAdmin) {
      return errorResponse(403, "forbidden", "Access denied");
    }

    // ===== BUILD TEST SCENARIOS =====
    const baseUrl = supabaseUrl.replace(/\/$/, "");
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    };

    const scenarios: TestScenario[] = [
      // 1. admin-attribution (list)
      {
        name: "admin-attribution",
        test_name: "GET returns events array",
        url: `${baseUrl}/functions/v1/admin-attribution`,
        method: "GET",
        body: null,
        expectedKind: "list",
        expectedHttp: 200,
      },
      // 2. admin-attribution-roas (aggregate)
      {
        name: "admin-attribution-roas",
        test_name: "GET returns summary/rows",
        url: `${baseUrl}/functions/v1/admin-attribution-roas?startDate=2024-01-01&endDate=2024-12-31`,
        method: "GET",
        body: null,
        expectedKind: "aggregate",
        expectedHttp: 200,
      },
      // 3. admin-global-search (list)
      {
        name: "admin-global-search",
        test_name: "GET with query param",
        url: `${baseUrl}/functions/v1/admin-global-search?q=test`,
        method: "GET",
        body: null,
        expectedKind: "list",
        expectedHttp: 200,
      },
      // 4. admin-quotes (list)
      {
        name: "admin-quotes",
        test_name: "GET returns quotes array",
        url: `${baseUrl}/functions/v1/admin-quotes?limit=5`,
        method: "GET",
        body: null,
        expectedKind: "list",
        expectedHttp: 200,
      },
      // 5. admin-revenue (aggregate)
      {
        name: "admin-revenue",
        test_name: "GET returns kpis/deals",
        url: `${baseUrl}/functions/v1/admin-revenue`,
        method: "GET",
        body: null,
        expectedKind: "aggregate",
        expectedHttp: 200,
      },
      // 6. admin-webhook-receipts (list)
      {
        name: "admin-webhook-receipts",
        test_name: "GET returns items array",
        url: `${baseUrl}/functions/v1/admin-webhook-receipts?limit=5`,
        method: "GET",
        body: null,
        expectedKind: "list",
        expectedHttp: 200,
      },
      // 7. admin-phonecallbot-health (aggregate - has ok/webhook_url_configured)
      {
        name: "admin-phonecallbot-health",
        test_name: "GET returns health status",
        url: `${baseUrl}/functions/v1/admin-phonecallbot-health`,
        method: "GET",
        body: null,
        expectedKind: "aggregate",
        expectedHttp: 200,
      },
      // 8. admin-lead-detail - invalid UUID (error)
      {
        name: "admin-lead-detail",
        test_name: "GET with invalid UUID returns 400",
        url: `${baseUrl}/functions/v1/admin-lead-detail?id=invalid-uuid`,
        method: "GET",
        body: null,
        expectedKind: "error",
        expectedHttp: 400,
      },
      // 9. admin-lead-detail - missing ID (error)
      {
        name: "admin-lead-detail",
        test_name: "GET with missing ID returns 400",
        url: `${baseUrl}/functions/v1/admin-lead-detail`,
        method: "GET",
        body: null,
        expectedKind: "error",
        expectedHttp: 400,
      },
      // 10. admin-direct-dial - missing body (error)
      {
        name: "admin-direct-dial",
        test_name: "POST with missing wm_lead_id returns 400",
        url: `${baseUrl}/functions/v1/admin-direct-dial`,
        method: "POST",
        body: {},
        expectedKind: "error",
        expectedHttp: 400,
      },
      // 11. admin-direct-dial - invalid UUID (error)
      {
        name: "admin-direct-dial",
        test_name: "POST with invalid UUID returns 400",
        url: `${baseUrl}/functions/v1/admin-direct-dial`,
        method: "POST",
        body: { wm_lead_id: "not-a-uuid" },
        expectedKind: "error",
        expectedHttp: 400,
      },
      // 12. admin-executive-profit (aggregate)
      {
        name: "admin-executive-profit",
        test_name: "GET returns kpis/waterfall/rows",
        url: `${baseUrl}/functions/v1/admin-executive-profit?start_date=2024-01-01&end_date=2024-12-31`,
        method: "GET",
        body: null,
        expectedKind: "aggregate",
        expectedHttp: 200,
      },
    ];

    // Run all tests
    const results: TestResult[] = [];
    for (const scenario of scenarios) {
      results.push(await runTest(scenario, authHeaders));
    }

    // Calculate totals
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const markdownReport = generateMarkdownReport(results);

    const report: SmokeTestReport = {
      ok: failed === 0,
      timestamp: new Date().toISOString(),
      total_tests: results.length,
      passed,
      failed,
      results,
      markdown_report: markdownReport,
    };

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("[admin-smoke-test] FATAL ERROR:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(500, "internal_error", message);
  }
});
