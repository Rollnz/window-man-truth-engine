// ═══════════════════════════════════════════════════════════════════════════
// Sprint 06A — Four-pass extraction prompt CONTRACT tests.
// These tests are 100% static: they never invoke a model.
// ═══════════════════════════════════════════════════════════════════════════

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { CANONICAL_CONTRACT_VERSION } from "./constants.ts";
import { PARTITION_OWNERSHIP } from "./canonical-merge.ts";
import {
  FOUR_PASS_PROMPTS,
  PASS_A_PROMPT,
  PASS_B_PROMPT,
  PASS_C_PROMPT,
  PASS_D_PROMPT,
  PROMPT_OWNERSHIP,
  SHARED_DOCTRINE_SENTINEL,
  SHARED_EXTRACTION_DOCTRINE,
  VNEXT_PROMPT_VERSION,
} from "./extraction-prompts.ts";

// ── Doctrine parity ───────────────────────────────────────────────────────

Deno.test("doctrine: sentinel appears in every pass system prompt", () => {
  for (const p of Object.values(FOUR_PASS_PROMPTS)) {
    assert(
      p.system.includes(SHARED_DOCTRINE_SENTINEL),
      `pass ${p.pass} missing shared doctrine sentinel`,
    );
  }
});

Deno.test("doctrine: every pass system prompt embeds full shared doctrine verbatim", () => {
  for (const p of Object.values(FOUR_PASS_PROMPTS)) {
    assert(
      p.system.includes(SHARED_EXTRACTION_DOCTRINE),
      `pass ${p.pass} does not embed shared doctrine verbatim`,
    );
  }
});

Deno.test("doctrine: pins CANONICAL_CONTRACT_VERSION in shared block AND every user template", () => {
  assert(
    SHARED_EXTRACTION_DOCTRINE.includes(`"${CANONICAL_CONTRACT_VERSION}"`),
    "shared doctrine does not pin CANONICAL_CONTRACT_VERSION",
  );
  for (const p of Object.values(FOUR_PASS_PROMPTS)) {
    assert(
      p.userTemplate.includes(`"${CANONICAL_CONTRACT_VERSION}"`),
      `pass ${p.pass} user template does not pin CANONICAL_CONTRACT_VERSION`,
    );
  }
});

Deno.test("doctrine: encodes anti-fabrication + not_found=null semantics", () => {
  const d = SHARED_EXTRACTION_DOCTRINE;
  assert(d.includes("NEVER FABRICATE"), "missing anti-fabrication rule");
  assert(
    d.includes("status = \"not_found\"") && d.includes("value  = null"),
    "missing not_found/value=null invariant",
  );
  assert(
    d.includes("NEVER value: []"),
    "missing explicit not_found value:[] prohibition (Sprint 05C fix)",
  );
});

Deno.test("doctrine: encodes anomaly preservation (120% deposit example)", () => {
  assert(
    SHARED_EXTRACTION_DOCTRINE.includes("120%"),
    "shared doctrine must preserve anomalies verbatim (e.g. 120% deposit)",
  );
});

Deno.test("doctrine: encodes 'AI does not judge' boundary", () => {
  const d = SHARED_EXTRACTION_DOCTRINE;
  assert(d.includes("do NOT judge") || d.includes("do NOT"), "missing judgment boundary");
  assert(d.includes("Layer 4"), "missing Layer-4 handoff language");
});

// ── Ownership parity ──────────────────────────────────────────────────────

Deno.test("ownership: PROMPT_OWNERSHIP mirrors canonical PARTITION_OWNERSHIP for A/B/C/D", () => {
  const relevant = Object.entries(PARTITION_OWNERSHIP).filter(
    ([, owner]) => owner === "passA" || owner === "passB" || owner === "passC" || owner === "passD" || owner === "shared_metadata",
  );
  for (const [path, owner] of relevant) {
    assertEquals(
      PROMPT_OWNERSHIP[path],
      owner,
      `prompt ownership divergence for ${path}: expected ${owner}, got ${PROMPT_OWNERSHIP[path]}`,
    );
  }
  // No extra keys in PROMPT_OWNERSHIP.
  for (const path of Object.keys(PROMPT_OWNERSHIP)) {
    assert(
      path in PARTITION_OWNERSHIP,
      `PROMPT_OWNERSHIP references unknown canonical field ${path}`,
    );
  }
});

Deno.test("ownership: each pass advertises exactly the paths its owner covers", () => {
  const expectedFor = (o: "passA" | "passB" | "passC" | "passD") =>
    Object.entries(PROMPT_OWNERSHIP)
      .filter(([, owner]) => owner === o)
      .map(([p]) => p)
      .sort();
  assertEquals(PASS_A_PROMPT.ownedPaths.slice().sort(), expectedFor("passA"));
  assertEquals(PASS_B_PROMPT.ownedPaths.slice().sort(), expectedFor("passB"));
  assertEquals(PASS_C_PROMPT.ownedPaths.slice().sort(), expectedFor("passC"));
  assertEquals(PASS_D_PROMPT.ownedPaths.slice().sort(), expectedFor("passD"));
});

Deno.test("ownership: passes do not overlap — every field has exactly one prompt owner", () => {
  const seen = new Map<string, string>();
  for (const p of Object.values(FOUR_PASS_PROMPTS)) {
    for (const path of p.ownedPaths) {
      const prev = seen.get(path);
      assert(!prev, `path ${path} owned by both pass ${prev} and pass ${p.pass}`);
      seen.set(path, p.pass);
    }
  }
});

Deno.test("ownership: line_items and product_configurations are owned by the SAME pass (D)", () => {
  assertEquals(PROMPT_OWNERSHIP["quote.line_items"], "passD");
  assertEquals(PROMPT_OWNERSHIP["quote.product_configurations"], "passD");
});

// ── Non-overlap: each pass's owned fields do not appear in other passes' rules ──

const B_FIELDS = ["quote.metadata", "quote.pricing", "quote.payment", "quote.opening_count", "quote.line_items_aggregate_only"];
const C_FIELDS = ["quote.scope", "quote.warranties", "quote.terms"];
const D_FIELDS = ["quote.line_items", "quote.product_configurations"];
const A_FIELDS = ["classification", "entities", "extraction_meta"];
const OTHER_OWNED_FIELDS: Record<"A" | "B" | "C" | "D", readonly string[]> = {
  A: [...B_FIELDS, ...C_FIELDS, ...D_FIELDS],
  B: [...A_FIELDS, ...C_FIELDS, ...D_FIELDS],
  C: [...A_FIELDS, ...B_FIELDS, ...D_FIELDS],
  D: [...A_FIELDS, ...B_FIELDS, ...C_FIELDS],
};

Deno.test("scope: each pass rule block instructs 'You own ONLY <its fields>'", () => {
  assert(PASS_A_PROMPT.system.includes("You own ONLY: classification, entities, extraction_meta"));
  assert(PASS_B_PROMPT.system.includes("You own ONLY: quote.metadata, quote.pricing, quote.payment"));
  assert(PASS_C_PROMPT.system.includes("You own ONLY: quote.scope, quote.warranties, quote.terms"));
  assert(PASS_D_PROMPT.system.includes("You own ONLY: quote.line_items, quote.product_configurations"));
});

Deno.test("scope: pass rule blocks explicitly disclaim other passes' fields", () => {
  // Extract only pass-specific rules (strip shared doctrine).
  const passRulesOnly = (pass: "A" | "B" | "C" | "D") =>
    FOUR_PASS_PROMPTS[pass].system.split(SHARED_EXTRACTION_DOCTRINE).pop() ?? "";
  for (const pass of ["A", "B", "C", "D"] as const) {
    const rules = passRulesOnly(pass);
    assert(
      /do NOT\s+extract/i.test(rules) || /You do NOT\s+extract/i.test(rules),
      `pass ${pass} rules missing 'do NOT extract' disclaimer`,
    );
  }
  // Sanity: pass A does not silently include commercial fields in its rules.
  const passARules = passRulesOnly("A");
  for (const foreign of ["quote.pricing", "line_items", "product_configuration_id"]) {
    // Foreign fields may be mentioned in the disclaimer but never as owned instructions.
    if (passARules.includes(foreign)) {
      // Must appear only within a NOT-extract clause.
      const idx = passARules.indexOf(foreign);
      const window = passARules.slice(Math.max(0, idx - 40), idx);
      assert(
        /do NOT/i.test(window),
        `pass A mentions foreign field ${foreign} outside a disclaimer`,
      );
    }
  }
});

Deno.test("scope: OTHER_OWNED_FIELDS matrix is exhaustive vs PROMPT_OWNERSHIP", () => {
  const allOwned = Object.entries(PROMPT_OWNERSHIP)
    .filter(([, o]) => o !== "shared_metadata")
    .map(([p]) => p);
  for (const pass of ["A", "B", "C", "D"] as const) {
    const own = FOUR_PASS_PROMPTS[pass].ownedPaths;
    const shouldBeForeign = allOwned.filter((p) => !own.includes(p));
    // Each foreign field is either in the matrix, or is scoped under "quote.*" and covered as its parent.
    for (const f of shouldBeForeign) {
      assert(
        OTHER_OWNED_FIELDS[pass].includes(f),
        `matrix missing foreign field ${f} for pass ${pass}`,
      );
    }
  }
});

// ── Sprint 05C payment_schedule regression guard (Pass B) ────────────────

Deno.test("pass B: encodes payment_schedule not_found ⇒ value=null (05C fix)", () => {
  const s = PASS_B_PROMPT.system;
  assert(
    s.includes("payment_schedule") && s.includes("value  = null"),
    "pass B must state payment_schedule.status=not_found requires value=null",
  );
  assert(
    s.includes("{ status: \"not_found\", value: [] }"),
    "pass B must explicitly forbid { status:'not_found', value:[] }",
  );
  assert(
    PASS_B_PROMPT.userTemplate.includes("payment_schedule.value = null"),
    "pass B user template must reiterate the payment_schedule rule",
  );
});

// ── Pass D: association law + deterministic id scheme ─────────────────────

Deno.test("pass D: encodes bi-directional line_item ↔ product_configuration law", () => {
  const s = PASS_D_PROMPT.system;
  assert(s.includes("BI-DIRECTIONAL"), "missing association law header");
  assert(
    s.includes("line_item.product_configuration_id") && s.includes("MUST reference"),
    "missing line_item → product_configuration reference law",
  );
  assert(
    s.includes("applies_to_line_item_ids") && s.includes("MUST reference"),
    "missing product_configuration → line_item reference law",
  );
});

Deno.test("pass D: encodes deterministic LI-### / PC-### id scheme", () => {
  const s = PASS_D_PROMPT.system;
  assert(s.includes("LI-001"), "missing LI-### id scheme");
  assert(s.includes("PC-001"), "missing PC-### id scheme");
  assert(PASS_D_PROMPT.userTemplate.includes("LI-###") && PASS_D_PROMPT.userTemplate.includes("PC-###"));
});

// ── Versioning ────────────────────────────────────────────────────────────

Deno.test("versions: prompt versions are separate from schema/brain versions", () => {
  assertEquals(VNEXT_PROMPT_VERSION, "four-pass-extraction-v1");
  assertEquals(PASS_A_PROMPT.version, "A-v1");
  assertEquals(PASS_B_PROMPT.version, "B-v1");
  assertEquals(PASS_C_PROMPT.version, "C-v1");
  assertEquals(PASS_D_PROMPT.version, "D-v1");
});

Deno.test("partitions: each pass targets the correct projection spec", () => {
  assertEquals(PASS_A_PROMPT.partition, "classificationEntitiesMeta");
  assertEquals(PASS_B_PROMPT.partition, "threePassB");
  assertEquals(PASS_C_PROMPT.partition, "threePassC");
  assertEquals(PASS_D_PROMPT.partition, "twoPassB");
});
