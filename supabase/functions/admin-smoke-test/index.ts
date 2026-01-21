import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===== Config =====
const ADMIN_EMAILS = ["vansiclenp@gmail.com", "mongoloyd@protonmail.com"];

// ===== CORS =====
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== Test result types =====
interface TestResult {
  function_name: string;
  test_name: string;
  passed: boolean;
  status_code: number;
  expected_shape: string[];
  missing_keys: string[];
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

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ===== Test helper: check JSON shape =====
function checkShape(obj: unknown, expectedKeys: string[]): string[] {
  if (typeof obj !== "object" || obj === null) {
    return expectedKeys;
  }
  const missing: string[] = [];
  for (const key of expectedKeys) {
    if (!(key in obj)) {
      missing.push(key);
    }
  }
  return missing;
}

// ===== Individual test runners =====
async function testFunction(
  name: string,
  testName: string,
  url: string,
  method: string,
  headers: Record<string, string>,
  body: unknown | null,
  expectedKeys: string[]
): Promise<TestResult> {
  const start = Date.now();
  try {
    const fetchOptions: RequestInit = {
      method,
      headers: { ...headers, "Content-Type": "application/json" },
    };
    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    
    const statusCode = response.status;
    const text = await response.text();
    let json: unknown;
    
    try {
      json = JSON.parse(text);
    } catch {
      return {
        function_name: name,
        test_name: testName,
        passed: false,
        status_code: statusCode,
        expected_shape: expectedKeys,
        missing_keys: [],
        error: `Response not JSON: ${text.slice(0, 100)}`,
        duration_ms: Date.now() - start,
      };
    }

    const missingKeys = checkShape(json, expectedKeys);
    const passed = statusCode >= 200 && statusCode < 300 && missingKeys.length === 0;

    return {
      function_name: name,
      test_name: testName,
      passed,
      status_code: statusCode,
      expected_shape: expectedKeys,
      missing_keys: missingKeys,
      duration_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      function_name: name,
      test_name: testName,
      passed: false,
      status_code: 0,
      expected_shape: expectedKeys,
      missing_keys: [],
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
    md += `| Test | Status | HTTP | Duration | Notes |\n`;
    md += `|------|--------|------|----------|-------|\n`;
    
    for (const t of tests) {
      const status = t.passed ? "✅ PASS" : "❌ FAIL";
      const notes = t.error 
        ? t.error.slice(0, 50) 
        : t.missing_keys.length > 0 
          ? `Missing: ${t.missing_keys.join(", ")}` 
          : "-";
      md += `| ${t.test_name} | ${status} | ${t.status_code} | ${t.duration_ms}ms | ${notes} |\n`;
    }
    md += "\n";
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

    // Check admin whitelist
    const email = (user.email || "").toLowerCase();
    if (!isAdminEmail(email)) {
      return errorResponse(403, "forbidden", "Access denied");
    }

    // ===== RUN SMOKE TESTS =====
    const baseUrl = supabaseUrl.replace(/\/$/, "");
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    };

    const results: TestResult[] = [];

    // Test 1: admin-attribution (GET)
    results.push(await testFunction(
      "admin-attribution",
      "GET returns events array",
      `${baseUrl}/functions/v1/admin-attribution`,
      "GET",
      authHeaders,
      null,
      ["events"]
    ));

    // Test 2: admin-attribution-roas (GET)
    results.push(await testFunction(
      "admin-attribution-roas",
      "GET returns metrics",
      `${baseUrl}/functions/v1/admin-attribution-roas?startDate=2024-01-01&endDate=2024-12-31`,
      "GET",
      authHeaders,
      null,
      ["adSpend", "leads", "revenue"]
    ));

    // Test 3: admin-global-search (GET with query)
    results.push(await testFunction(
      "admin-global-search",
      "GET with query param",
      `${baseUrl}/functions/v1/admin-global-search?q=test`,
      "GET",
      authHeaders,
      null,
      ["results"]
    ));

    // Test 4: admin-quotes (GET)
    results.push(await testFunction(
      "admin-quotes",
      "GET returns quotes array",
      `${baseUrl}/functions/v1/admin-quotes?limit=5`,
      "GET",
      authHeaders,
      null,
      ["quotes", "total"]
    ));

    // Test 5: admin-revenue (GET)
    results.push(await testFunction(
      "admin-revenue",
      "GET returns revenue data",
      `${baseUrl}/functions/v1/admin-revenue`,
      "GET",
      authHeaders,
      null,
      ["globalKpi", "recentDeals"]
    ));

    // Test 6: admin-webhook-receipts (GET)
    results.push(await testFunction(
      "admin-webhook-receipts",
      "GET returns receipts",
      `${baseUrl}/functions/v1/admin-webhook-receipts?limit=5`,
      "GET",
      authHeaders,
      null,
      ["receipts", "total"]
    ));

    // Test 7: admin-phonecallbot-health (GET)
    results.push(await testFunction(
      "admin-phonecallbot-health",
      "GET returns health status",
      `${baseUrl}/functions/v1/admin-phonecallbot-health`,
      "GET",
      authHeaders,
      null,
      ["ok", "webhook_url_configured"]
    ));

    // Test 8: admin-lead-detail (GET with invalid UUID - should return 400)
    const invalidUuidResult = await testFunction(
      "admin-lead-detail",
      "GET with invalid UUID returns 400",
      `${baseUrl}/functions/v1/admin-lead-detail?id=invalid-uuid`,
      "GET",
      authHeaders,
      null,
      ["ok", "code", "error"]
    );
    // Override passed check for expected 400
    invalidUuidResult.passed = invalidUuidResult.status_code === 400;
    results.push(invalidUuidResult);

    // Test 9: admin-lead-detail (GET with missing ID - should return 400)
    const missingIdResult = await testFunction(
      "admin-lead-detail",
      "GET with missing ID returns 400",
      `${baseUrl}/functions/v1/admin-lead-detail`,
      "GET",
      authHeaders,
      null,
      ["ok", "code", "error"]
    );
    missingIdResult.passed = missingIdResult.status_code === 400;
    results.push(missingIdResult);

    // Test 10: admin-direct-dial (POST with missing body - should return 400)
    const directDialMissingResult = await testFunction(
      "admin-direct-dial",
      "POST with missing wm_lead_id returns 400",
      `${baseUrl}/functions/v1/admin-direct-dial`,
      "POST",
      authHeaders,
      {},
      ["ok", "code", "error"]
    );
    directDialMissingResult.passed = directDialMissingResult.status_code === 400;
    results.push(directDialMissingResult);

    // Test 11: admin-direct-dial (POST with invalid UUID - should return 400)
    const directDialInvalidResult = await testFunction(
      "admin-direct-dial",
      "POST with invalid UUID returns 400",
      `${baseUrl}/functions/v1/admin-direct-dial`,
      "POST",
      authHeaders,
      { wm_lead_id: "not-a-uuid" },
      ["ok", "code", "error"]
    );
    directDialInvalidResult.passed = directDialInvalidResult.status_code === 400;
    results.push(directDialInvalidResult);

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
