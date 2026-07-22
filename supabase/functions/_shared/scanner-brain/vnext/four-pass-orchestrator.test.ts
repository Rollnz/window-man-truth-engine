// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — FOUR-PASS ORCHESTRATOR TESTS (Sprint 06B)
//
// Deterministic tests for the orchestration core using a mocked provider.
// No live AI. No HTTP. No Deno.env. No side effects.
// ═══════════════════════════════════════════════════════════════════════════

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  createLovableGatewayProviderCaller,
  FAILURE_CODES,
  runFourPassOrchestration,
  type OrchestratorResult,
  type PassId,
  type ProviderCallInput,
  type ProviderCallOutput,
  type ProviderCaller,
} from "./four-pass-orchestrator.ts";
import { CANONICAL_CONTRACT_VERSION } from "./constants.ts";
import { FOUR_PASS_PROMPTS } from "./extraction-prompts.ts";
import { fixtureA_wellStructuredQuote } from "./fixtures.ts";

// ── Partition splitters (same as canonical-merge.test.ts) ────────────────

function partitionA(f = fixtureA_wellStructuredQuote) {
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    classification: f.classification,
    entities: f.entities,
    extraction_meta: f.extraction_meta,
  };
}
function partitionB(f = fixtureA_wellStructuredQuote) {
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    quote: {
      metadata: f.quote.metadata,
      pricing: f.quote.pricing,
      payment: f.quote.payment,
      opening_count: f.quote.opening_count,
      line_items_aggregate_only: f.quote.line_items_aggregate_only,
    },
  };
}
function partitionC(f = fixtureA_wellStructuredQuote) {
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    quote: { scope: f.quote.scope, warranties: f.quote.warranties, terms: f.quote.terms },
  };
}
function partitionD(f = fixtureA_wellStructuredQuote) {
  return {
    contract_version: CANONICAL_CONTRACT_VERSION,
    quote: {
      line_items: f.quote.line_items,
      product_configurations: f.quote.product_configurations,
    },
  };
}

// ── Mock provider factory ────────────────────────────────────────────────

interface MockOptions {
  onCall?: (pass: PassId, input: ProviderCallInput, callIndex: number) => void;
  content?: Partial<Record<PassId, unknown | string>>;
  fail?: Partial<Record<PassId, string>>;
  delayMs?: Partial<Record<PassId, number>>;
  raw?: Partial<Record<PassId, string>>; // raw text override
}
function mockCaller(opts: MockOptions = {}) {
  const calls: { pass: PassId; input: ProviderCallInput; startAt: number }[] = [];
  const defaults: Record<PassId, unknown> = {
    A: partitionA(),
    B: partitionB(),
    C: partitionC(),
    D: partitionD(),
  };
  const caller: ProviderCaller = async (input) => {
    const idx = calls.length;
    calls.push({ pass: input.pass, input, startAt: Date.now() });
    opts.onCall?.(input.pass, input, idx);

    const delay = opts.delayMs?.[input.pass] ?? 0;
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    if (opts.fail?.[input.pass]) throw new Error(opts.fail[input.pass]!);

    let content: string;
    if (opts.raw?.[input.pass] !== undefined) {
      content = opts.raw[input.pass]!;
    } else {
      const payload = opts.content?.[input.pass] ?? defaults[input.pass];
      content = typeof payload === "string" ? payload : JSON.stringify(payload);
    }
    const out: ProviderCallOutput = {
      content,
      httpStatus: 200,
      finishReason: "stop",
      tokensPrompt: 100,
      tokensCompletion: 200,
    };
    return out;
  };
  return { caller, calls };
}

// Cheap-but-valid base64 payload used by every test (never sent anywhere in
// unit tests — the mocked caller ignores document bytes).
const FAKE_BASE64 = "aGVsbG8gd29ybGQ=";
const VALID_INPUT = { fileBase64: FAKE_BASE64, mimeType: "image/png" as const };

// ─────────────────────────────────────────────────────────────────────────
// TEST 1 — happy path
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T1: valid four-pass success", async () => {
  const { caller, calls } = mockCaller();
  const r = await runFourPassOrchestration(VALID_INPUT, { providerCall: caller });
  assertEquals(calls.length, 4);
  assert(r.ok, `expected success, got ${!r.ok ? JSON.stringify(r.error) : ""}`);
  if (r.ok) {
    assertEquals(r.canonical.contract_version, CANONICAL_CONTRACT_VERSION);
    assertEquals(r.diagnostics.merge.success, true);
    assertEquals(r.diagnostics.merge.validation_issue_count, 0);
    for (const p of ["A", "B", "C", "D"] as PassId[]) {
      assertEquals(r.diagnostics.passes[p].parse_status, "ok");
      assert(r.diagnostics.passes[p].latency_ms >= 0);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 2 — logical concurrency
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T2: all four passes start before any completes", async () => {
  let startedBeforeFirstResolve = 0;
  let anyResolved = false;
  const { caller } = mockCaller({
    delayMs: { A: 30, B: 30, C: 30, D: 30 },
    onCall: () => {
      if (!anyResolved) startedBeforeFirstResolve++;
    },
  });
  // Wrap to observe resolution timing.
  const wrapped: ProviderCaller = async (input) => {
    const out = await caller(input);
    anyResolved = true;
    return out;
  };
  await runFourPassOrchestration(VALID_INPUT, { providerCall: wrapped });
  assertEquals(startedBeforeFirstResolve, 4, "all four passes must be scheduled before any resolves");
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 3 — same document bytes/mime forwarded to every pass
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T3: identical document + mime forwarded to every pass", async () => {
  const seen: { pass: PassId; b64: string; mime: string }[] = [];
  const { caller } = mockCaller({
    onCall: (pass, input) => seen.push({ pass, b64: input.document.base64, mime: input.document.mimeType }),
  });
  await runFourPassOrchestration({ fileBase64: FAKE_BASE64, mimeType: "application/pdf" }, { providerCall: caller });
  assertEquals(seen.length, 4);
  for (const s of seen) {
    assertEquals(s.b64, FAKE_BASE64);
    assertEquals(s.mime, "application/pdf");
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 4 — correct prompt / version / schema wired per pass
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T4: each pass receives its own prompt, version, and schema", async () => {
  const seen: Record<PassId, { sys: string; ver: string; part: string; schemaKeys: string[] }> = {} as never;
  const { caller } = mockCaller({
    onCall: (pass, input) => {
      seen[pass] = {
        sys: input.prompt.system,
        ver: input.prompt.version,
        part: input.prompt.partition,
        schemaKeys: Object.keys((input.jsonSchema as { properties: Record<string, unknown> }).properties).sort(),
      };
    },
  });
  await runFourPassOrchestration(VALID_INPUT, { providerCall: caller });
  for (const pass of ["A", "B", "C", "D"] as PassId[]) {
    const expected = FOUR_PASS_PROMPTS[pass];
    assertEquals(seen[pass].ver, expected.version);
    assertEquals(seen[pass].part, expected.partition);
    assert(seen[pass].sys.includes(`PASS ${pass}`), `pass ${pass} system prompt must scope itself`);
  }
  // Structural: Pass A schema top-level must NOT include `quote`; B/C/D must.
  assert(!seen.A.schemaKeys.includes("quote"));
  assert(seen.B.schemaKeys.includes("quote"));
  assert(seen.C.schemaKeys.includes("quote"));
  assert(seen.D.schemaKeys.includes("quote"));
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 5 — invalid input causes ZERO provider calls
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T5: invalid input causes zero provider calls", async () => {
  const bads = [
    { fileBase64: "", mimeType: "image/png" },
    { fileBase64: FAKE_BASE64, mimeType: "image/heic" },
    { fileBase64: "@@@not-base64@@@", mimeType: "image/png" },
    { fileBase64: FAKE_BASE64, mimeType: "" },
  ];
  for (const bad of bads) {
    const { caller, calls } = mockCaller();
    const r = await runFourPassOrchestration(bad as never, { providerCall: caller });
    assertEquals(calls.length, 0, `no calls for invalid input ${JSON.stringify(bad)}`);
    assert(!r.ok);
    if (!r.ok) assertEquals(r.error.code, FAILURE_CODES.INVALID_INPUT);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 6 — provider failure per pass fails closed with typed code
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T6: provider failure of any single pass fails closed", async () => {
  for (const failing of ["A", "B", "C", "D"] as PassId[]) {
    const { caller } = mockCaller({ fail: { [failing]: `boom-${failing}` } });
    const r = await runFourPassOrchestration(VALID_INPUT, { providerCall: caller });
    assert(!r.ok, `pass ${failing} failure must fail closed`);
    if (!r.ok) {
      assertEquals(r.error.failed_pass, failing);
      assertEquals(r.error.code, FAILURE_CODES[`PASS_${failing}_PROVIDER_FAILURE` as keyof typeof FAILURE_CODES]);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 7 — malformed JSON from any pass fails closed
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T7: parse failure fails closed with typed code", async () => {
  for (const p of ["A", "B", "C", "D"] as PassId[]) {
    const { caller } = mockCaller({ raw: { [p]: "not valid { json" } });
    const r = await runFourPassOrchestration(VALID_INPUT, { providerCall: caller });
    assert(!r.ok);
    if (!r.ok) {
      assertEquals(r.error.failed_pass, p);
      assertEquals(r.error.code, FAILURE_CODES[`PASS_${p}_PARSE_FAILURE` as keyof typeof FAILURE_CODES]);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 8 — contract_version mismatch on any pass fails before canonical success
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T8: contract_version mismatch on any pass fails closed", async () => {
  for (const p of ["A", "B", "C", "D"] as PassId[]) {
    const overrides: Partial<Record<PassId, unknown>> = {};
    const src = { A: partitionA(), B: partitionB(), C: partitionC(), D: partitionD() };
    overrides[p] = { ...src[p], contract_version: "WRONG" };
    const { caller } = mockCaller({ content: overrides });
    const r = await runFourPassOrchestration(VALID_INPUT, { providerCall: caller });
    assert(!r.ok);
    if (!r.ok) {
      // Rejected at parse-shape stage.
      assertEquals(r.error.failed_pass, p);
      assertEquals(r.error.code, FAILURE_CODES[`PASS_${p}_PARSE_FAILURE` as keyof typeof FAILURE_CODES]);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 9 — merge failure (dangling ref) fails closed
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T9: dangling product_configuration_id fails closed at validation", async () => {
  const d = partitionD();
  d.quote.line_items = d.quote.line_items.map((li) => ({ ...li, product_configuration_id: "ghost-pc" }));
  const { caller } = mockCaller({ content: { D: d } });
  const r = await runFourPassOrchestration(VALID_INPUT, { providerCall: caller });
  assert(!r.ok);
  if (!r.ok) {
    assert(
      r.error.code === FAILURE_CODES.CANONICAL_VALIDATION_FAILURE ||
        r.error.code === FAILURE_CODES.MERGE_FAILURE,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 10 — payment_schedule not_found with [] fails closed at validation
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T10: 05C regression — not_found ⇒ value=[] fails canonical validation", async () => {
  const b = partitionB();
  b.quote.payment = {
    ...b.quote.payment,
    payment_schedule: { status: "not_found", value: [] as unknown as null, confidence: 0, evidence: [] },
  };
  const { caller } = mockCaller({ content: { B: b } });
  const r = await runFourPassOrchestration(VALID_INPUT, { providerCall: caller });
  assert(!r.ok);
  if (!r.ok) {
    assertEquals(r.error.code, FAILURE_CODES.CANONICAL_VALIDATION_FAILURE);
    assert(r.diagnostics.merge.validation_issue_count >= 1);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 11 — diagnostics do not leak document bytes / secrets
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T11: diagnostics never contain document bytes or auth material", async () => {
  const { caller } = mockCaller();
  const r = await runFourPassOrchestration(VALID_INPUT, { providerCall: caller });
  assert(r.ok);
  if (r.ok) {
    const dumped = JSON.stringify(r.diagnostics);
    assert(!dumped.includes(FAKE_BASE64), "diagnostics must not include fileBase64");
    assert(!/authorization|bearer|api[_-]?key/i.test(dumped), "diagnostics must not include auth material");
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 12 — smuggled owner fields cannot overwrite authoritative fields
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T12: out-of-authority fields cannot overwrite owner fields (mergeFourPass isolation)", async () => {
  const a = partitionA() as unknown as Record<string, unknown>;
  // Pass A smuggles a scope value; merge must silently drop it.
  (a as { quote?: unknown }).quote = {
    scope: { installation: { status: "found", value: "SMUGGLED", confidence: 1, evidence: [] } },
  };
  const { caller } = mockCaller({ content: { A: a } });
  const r: OrchestratorResult = await runFourPassOrchestration(VALID_INPUT, { providerCall: caller });
  assert(r.ok);
  if (r.ok) {
    assertEquals(
      r.canonical.quote.scope.installation.value,
      fixtureA_wellStructuredQuote.quote.scope.installation.value,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TEST 13 — default gateway provider caller factory is constructible
// ─────────────────────────────────────────────────────────────────────────

Deno.test("orchestrator T13: default Lovable-gateway provider caller is a function", () => {
  const c = createLovableGatewayProviderCaller("sk-test-not-used");
  assertEquals(typeof c, "function");
});
