// Sprint 07B.2 — Brain 3 safe adapter tests. Zero live provider calls.
import { assert, assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  BRAIN3_SIDE_EFFECT_ATTEMPT,
  Brain3SideEffectAttemptError,
  createDisabledDependencies,
  runBrain3Safely,
  type Brain3ProviderRequest,
} from "./brain3-safe-runner.ts";
import { createBrain3BenchmarkAdapter } from "./brain3-adapter.ts";
import { normalizeBrain3Output } from "./brain3-normalization.ts";
import {
  BRAIN3_ADAPTER_VERSION,
  getBrain3AdapterReadiness,
} from "./brain3-adapter-readiness.ts";
import { BRAIN3_CAPABILITIES } from "./capability-matrix.ts";
import { BRAIN_VERSION, ANALYSIS_SCHEMA_VERSION } from "../../../index.ts";
import { EXTRACTION_RUBRIC } from "../../../rubric.ts";
import type { GroundTruthDocument } from "../benchmark-types.ts";

let PROVIDER_CALLS = 0;

const SIGNALS = {
  isValidQuote: true,
  validityReason: "window replacement estimate",
  totalPriceFound: true,
  totalPriceValue: 18450,
  openingCountEstimate: 9,
  hasComplianceKeyword: true,
  hasComplianceIdentifier: true,
  hasNOANumber: true,
  noaNumberValue: "NOA 21-0304.05",
  hasLaminatedMention: true,
  hasGlassBuildDetail: true,
  hasTemperedOnlyRisk: false,
  hasNonImpactLanguage: false,
  licenseNumberPresent: true,
  licenseNumberValue: "CGC1500000",
  hasOwnerBuilderLanguage: false,
  contractorNameExtracted: "Acme Windows LLC",
  hasPermitMention: true,
  hasDemoInstallDetail: true,
  hasSpecificMaterials: true,
  hasWallRepairMention: false,
  hasFinishDetail: true,
  hasCleanupMention: true,
  hasBrandClarity: true,
  hasDetailedScope: true,
  hasSubjectToChange: false,
  hasRepairsExcluded: false,
  hasStandardInstallation: true,
  depositPercentage: 120,
  hasFinalPaymentTrap: false,
  hasSafePaymentTerms: false,
  hasPaymentBeforeCompletion: true,
  hasContractTraps: false,
  contractTrapsList: [],
  hasManagerDiscount: false,
  hasWarrantyMention: true,
  hasLaborWarranty: true,
  warrantyDurationYears: 10,
  hasLifetimeWarranty: false,
  hasTransferableWarranty: false,
  hasPremiumIndicators: true,
};

let lastRequest: Brain3ProviderRequest | null = null;
const mockProvider = (req: Brain3ProviderRequest) => {
  PROVIDER_CALLS++;
  lastRequest = req;
  return Promise.resolve({
    content: JSON.stringify(SIGNALS),
    tokens: { prompt: 100, completion: 50, total: 150 },
  });
};

const DOC: GroundTruthDocument = {
  document_id: "GQ-001",
  document_sha256: "0".repeat(63) + "1",
  dataset_split: "development",
  meta: {
    annotated_by: "human:reviewer-a",
    reviewed_by: "human:reviewer-b",
    annotation_version: "1.0.0",
    review_status: "agreed",
    adjudication_status: "not_required",
    locked: true,
  },
  facts: [],
};

Deno.test("brain3 safe runner invokes native Brain 3 behavior unmodified", async () => {
  PROVIDER_CALLS = 0;
  const res = await runBrain3Safely(
    { document_id: "GQ-001", mime_type: "image/png", base64: "AAAA", opening_count: 9 },
    { providerCall: mockProvider },
  );
  // Native prompt/schema come straight from Brain 3 modules.
  const msgs = lastRequest!.messages as Array<{ role: string; content: unknown }>;
  assertEquals(msgs[0].content, EXTRACTION_RUBRIC);
  assertEquals(
    (lastRequest!.response_format as { json_schema: { name: string; strict: boolean } })
      .json_schema.name,
    "quote_signals",
  );
  // Native Brain 3 scoring executed.
  assert(typeof res.native.scored.overallScore === "number");
  assert(res.native.forensic.headline.length > 0);
  assertEquals(res.native.identity.contractorName, "Acme Windows LLC");
  assertEquals(res.provider_calls, 1);
});

Deno.test("brain3 safe runner records provider/model/version provenance", async () => {
  const res = await runBrain3Safely(
    { document_id: "GQ-001", mime_type: "image/png", base64: "AAAA" },
    { providerCall: mockProvider, model: "google/gemini-3-flash-preview" },
  );
  assertEquals(res.provenance.brain_version, BRAIN_VERSION);
  assertEquals(res.provenance.analysis_schema_version, ANALYSIS_SCHEMA_VERSION);
  assertEquals(res.provenance.provider, "lovable-ai-gateway");
  assertEquals(res.provenance.model, "google/gemini-3-flash-preview");
});

Deno.test("brain3 safe runner: no DB / cache / tracking / comms / storage is reachable", () => {
  const deps = createDisabledDependencies();
  const surfaces: Array<[string, Record<string, (...a: unknown[]) => never>]> = [
    ["persistence", deps.persistence],
    ["cache", deps.cache],
    ["tracking", deps.tracking],
    ["communications", deps.communications],
    ["storage", deps.storage],
  ];
  let checked = 0;
  for (const [surface, api] of surfaces) {
    for (const op of Object.keys(api)) {
      let threw = false;
      try {
        api[op]();
      } catch (e) {
        threw = true;
        assert(e instanceof Brain3SideEffectAttemptError);
        assertEquals((e as Brain3SideEffectAttemptError).code, BRAIN3_SIDE_EFFECT_ATTEMPT);
        assertEquals((e as Brain3SideEffectAttemptError).surface, surface);
      }
      assert(threw, `${surface}.${op} must fail closed`);
      checked++;
    }
  }
  assert(checked >= 20);
  assertEquals(deps.violations.length, checked); // violations recorded, not ignored
});

Deno.test("brain3 side-effect attempt fails closed and is recorded", () => {
  const deps = createDisabledDependencies();
  let code = "";
  try {
    deps.persistence.insertQuoteAnalysis();
  } catch (e) {
    code = (e as Brain3SideEffectAttemptError).code;
  }
  assertEquals(code, BRAIN3_SIDE_EFFECT_ATTEMPT);
  assertEquals(deps.violations[0], {
    surface: "persistence",
    operation: "insertQuoteAnalysis",
  });
});

Deno.test("brain3 safe runner contains no network or supabase import", async () => {
  const src = await Deno.readTextFile(
    new URL("./brain3-safe-runner.ts", import.meta.url),
  );
  assert(!/\bfetch\s*\(/.test(src), "runner must not call fetch");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert(!/supabase/i.test(code), "runner must not reference supabase");
  assert(!/Deno\.env/.test(src), "runner must not read env/secrets");
});

Deno.test("brain3 raw output and normalized output remain separate", async () => {
  const res = await runBrain3Safely(
    { document_id: "GQ-001", mime_type: "image/png", base64: "AAAA" },
    { providerCall: mockProvider },
  );
  const before = JSON.stringify(res.native);
  const normalized = normalizeBrain3Output(res.native);
  assertEquals(JSON.stringify(res.native), before); // native untouched
  assert(normalized.facts.length > 0);
  assertEquals(normalized.line_items.length, 0);
  assertEquals(normalized.product_configurations.length, 0);
  const total = normalized.facts.find((f) => f.semantic_field === "quote.total");
  assertEquals(total?.value, 18450);
  // Anomalous deposit is preserved verbatim, not clamped.
  const dep = normalized.facts.find((f) => f.semantic_field === "quote.deposit_percentage");
  assertEquals(dep?.value, 120);
});

Deno.test("brain3 normalization never invents unsupported capabilities", () => {
  const normalized = normalizeBrain3Output({
    signals: SIGNALS as never,
    scored: { overallScore: 0 } as never,
    forensic: {} as never,
    identity: { contractorName: null, licenseNumber: null, noaNumbers: [] },
    raw_content: "{}",
  });
  const fields = normalized.facts.map((f) => f.semantic_field);
  assert(!fields.some((f) => f.startsWith("entity.homeowner")));
  assert(!fields.some((f) => f.startsWith("entity.salesperson")));
  for (const f of normalized.facts) assertEquals(f.evidence, undefined);
});

Deno.test("brain3 adapter runs end-to-end with injected mocks and zero side effects", async () => {
  PROVIDER_CALLS = 0;
  const deps = createDisabledDependencies();
  const adapter = createBrain3BenchmarkAdapter({
    providerCall: mockProvider,
    assetResolver: () => Promise.resolve({ base64: "AAAA", mime_type: "image/png" }),
    dependencies: deps,
  });
  const out = await adapter.run(DOC, {
    run_group_id: "dry",
    provider: "lovable-ai-gateway",
    model: "google/gemini-3-flash-preview",
  });
  assertEquals(out.status, "ok");
  assertEquals(out.brain_version, BRAIN_VERSION);
  assertEquals(out.analysis_schema_version, ANALYSIS_SCHEMA_VERSION);
  assertEquals(deps.violations.length, 0);
  assertEquals(PROVIDER_CALLS, 1);
  assert(out.normalized.facts.length > 0);
});

Deno.test("brain3 adapter fails closed when a side effect is attempted mid-run", async () => {
  const deps = createDisabledDependencies();
  const adapter = createBrain3BenchmarkAdapter({
    providerCall: () => {
      deps.tracking.emitWmEvent(); // simulates production tracking path
      return Promise.resolve({ content: "{}" });
    },
    assetResolver: () => Promise.resolve({ base64: "AAAA", mime_type: "image/png" }),
    dependencies: deps,
  });
  const out = await adapter.run(DOC, { run_group_id: "dry", provider: "p", model: "m" });
  assertEquals(out.status, "infra_failure");
  assertEquals(deps.violations[0].surface, "tracking");
  assertEquals(out.normalized.facts.length, 0);
});

Deno.test("brain3 non-JSON provider content fails without silent fallback", async () => {
  await assertRejects(
    () =>
      runBrain3Safely(
        { document_id: "GQ-001", mime_type: "image/png", base64: "AAAA" },
        { providerCall: () => Promise.resolve({ content: "not json" }) },
      ),
    Error,
    "BRAIN3_PARSE_FAILURE",
  );
});

Deno.test("brain3 readiness promoted and capability matrix version bumped together", () => {
  const r = getBrain3AdapterReadiness();
  assertEquals(r.status, "READY_FOR_CONTROLLED_EXECUTION");
  assertEquals(r.adapter_version, BRAIN3_ADAPTER_VERSION);
  assert(r.implemented_wrapper_guards.length >= 4);
  // Capability declaration changed with the adapter, under a new version.
  assertEquals(BRAIN3_CAPABILITIES.adapter_version, "v1.0.0-safe-runner");
  const homeowner = BRAIN3_CAPABILITIES.capabilities.find(
    (c) => c.capability === "entity.homeowner",
  );
  assertEquals(homeowner?.state, "UNSUPPORTED");
});
