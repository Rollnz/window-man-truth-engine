// Sprint 07B.3 — PII scanner + intake pipeline + staging manifest tests.
// Offline. Zero provider calls. Zero real filesystem writes.
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  createSubstitutionRegistry,
  detectPii,
  PII_SCANNER_VERSION,
  scanText,
} from "./pii-scanner.ts";
import {
  assertPromotable,
  PiiPromotionBlockedError,
  screenDocument,
  scrubDocument,
  stageDocument,
  UnscrubbedAssetError,
  type DocumentPayload,
  type StagingIO,
} from "./intake-pipeline.ts";
import {
  createStagingManifest,
  LockedRecordImmutableError,
  mergeStagingIntoInventory,
  nextDocumentId,
  STAGING_CORPUS_VERSION,
} from "./staging-manifest.ts";
import { CORPUS_V1_PRE_INVENTORY } from "./inventory.ts";
import type { GoldenDocumentManifest } from "./manifest-types.ts";

function kinds(text: string): string[] {
  return detectPii(text).map((f) => f.kind);
}

function mockIO() {
  const writes: Record<string, string> = {};
  const dirs: string[] = [];
  const io: StagingIO = {
    // deno-lint-ignore require-await
    async mkdir(p) { dirs.push(p); },
    // deno-lint-ignore require-await
    async writeTextFile(p, c) { writes[p] = c; },
  };
  return { io, writes, dirs };
}

// ── 1. Detector positives ────────────────────────────────────────────────
Deno.test("07B.3.01 detects email, phone, ssn and street address", () => {
  assert(kinds("Contact: jane.doe@example.com").includes("EMAIL"));
  assert(kinds("Call (305) 555-0134 today").includes("PHONE"));
  assert(kinds("SSN 123-45-6789").includes("SSN"));
  assert(kinds("1234 Palmetto Ave, Miami").includes("STREET_ADDRESS"));
});

Deno.test("07B.3.02 detects zip+4, dob, account id and labeled person name", () => {
  assert(kinds("Miami FL 33176-1234").includes("ZIP4"));
  assert(kinds("DOB: 04/11/1968").includes("DOB"));
  assert(kinds("Loan #: A9931204").includes("ACCOUNT_ID"));
  assert(kinds("Homeowner: Robert Miller").includes("PERSON_NAME"));
});

// ── 2. Detector negatives ────────────────────────────────────────────────
Deno.test("07B.3.03 does not flag ordinary quote language", () => {
  const text = [
    "PGT WinGuard 5500 Series Impact Window",
    "U-Factor 0.28 SHGC 0.25",
    "Subtotal $14,250.00",
    "NOA 21-0512.04",
  ].join("\n");
  assertEquals(detectPii(text).length, 0);
});

Deno.test("07B.3.04 luhn rejects an invalid card-shaped number", () => {
  assertEquals(kinds("Card 4111111111111112").includes("CREDIT_CARD"), false);
  assert(kinds("Card 4111111111111111").includes("CREDIT_CARD"));
});

// ── 3. Privacy of findings ───────────────────────────────────────────────
Deno.test("07B.3.05 findings never carry the raw matched value", () => {
  const text = "Email jane.doe@example.com phone (305) 555-0134";
  const findings = detectPii(text);
  const serialized = JSON.stringify(findings);
  assert(!serialized.includes("jane.doe@example.com"));
  assert(!serialized.includes("555-0134"));
  for (const f of findings) {
    assert(/^\[REDACTED_[A-Z_]+_\d+\]$/.test(f.redaction_token));
    assert(f.match_span.end > f.match_span.start);
  }
});

// ── 4. Stable substitution ───────────────────────────────────────────────
Deno.test("07B.3.06 same value maps to the same token, distinct values differ", () => {
  const r = scanText(
    "a@x.com then b@x.com then a@x.com",
    createSubstitutionRegistry(),
  );
  assertEquals(
    r.scrubbed_text,
    "[REDACTED_EMAIL_1] then [REDACTED_EMAIL_2] then [REDACTED_EMAIL_1]",
  );
  assertEquals(Object.keys(r.substitutions).length, 2);
});

Deno.test("07B.3.07 substitution is case/whitespace insensitive and deterministic", () => {
  const reg = createSubstitutionRegistry();
  const a = scanText("Customer: Robert Miller", reg);
  const b = scanText("Homeowner: ROBERT MILLER", reg);
  assertEquals(a.findings[0].redaction_token, b.findings[0].redaction_token);
  const again = scanText("Customer: Robert Miller", createSubstitutionRegistry());
  assertEquals(again.scrubbed_text, a.scrubbed_text);
  assertEquals(again.scanner_version, PII_SCANNER_VERSION);
});

Deno.test("07B.3.08 registry is shared across text and structured leaves", () => {
  const payload: DocumentPayload = {
    id: "DOC-A",
    mime_type: "application/pdf",
    page_count: 1,
    raw_text: "Send to jane.doe@example.com",
    structured: { contact_email: "jane.doe@example.com" },
  };
  const { report } = scrubDocument(payload);
  assertEquals(report.findings[0].redaction_token, "[REDACTED_EMAIL_1]");
  assertEquals(
    report.structured_findings[0].redaction_token,
    "[REDACTED_EMAIL_1]",
  );
});

// ── 5. Structure preservation ────────────────────────────────────────────
const QUOTE_DOC: DocumentPayload = {
  id: "DOC-1",
  mime_type: "application/pdf",
  page_count: 2,
  raw_text: [
    "ACME WINDOWS LLC   License CGC1509911",
    "Homeowner: Robert Miller",
    "1234 Palmetto Ave, Miami FL 33176-1234",
    "Phone (305) 555-0134   Email robert.miller@example.com",
    "Qty 8   Impact Window   $1,780.00   $14,240.00",
    "Deposit 50%   Total $14,240.00",
  ].join("\n"),
  structured: { total: 14240, deposit_pct: 50, note: "Call (305) 555-0134" },
  metadata: { author: "Robert Miller", producer: "Acme PDF" },
};

Deno.test("07B.3.09 scrub preserves line count and numeric facts", () => {
  const { payload } = scrubDocument(QUOTE_DOC);
  assertEquals(
    payload.raw_text.split("\n").length,
    QUOTE_DOC.raw_text.split("\n").length,
  );
  assert(payload.raw_text.includes("$14,240.00"));
  assert(payload.raw_text.includes("Deposit 50%"));
  assert(payload.raw_text.includes("Qty 8"));
});

Deno.test("07B.3.10 scrub removes identity values and drops metadata", () => {
  const { payload } = scrubDocument(QUOTE_DOC);
  const s = JSON.stringify(payload);
  assert(!s.includes("Robert Miller"));
  assert(!s.includes("robert.miller@example.com"));
  assert(!s.includes("555-0134"));
  assertEquals(payload.metadata, undefined);
  assert(String(payload.structured?.note).includes("[REDACTED_PHONE_"));
  assertEquals(payload.structured?.total, 14240);
});

Deno.test("07B.3.11 clean synthetic document screens as clean", () => {
  const clean: DocumentPayload = {
    id: "DOC-CLEAN",
    mime_type: "application/pdf",
    page_count: 1,
    raw_text: "Impact Window Package\nTotal $9,800.00",
  };
  assertEquals(screenDocument(clean).status, "clean");
});

// ── 6. Screening statuses ────────────────────────────────────────────────
Deno.test("07B.3.12 critical PII in structured fields blocks the document", () => {
  const blocked: DocumentPayload = {
    id: "DOC-B",
    mime_type: "application/pdf",
    page_count: 1,
    raw_text: "Total $1,000.00",
    structured: { customer_email: "x@y.com" },
  };
  assertEquals(screenDocument(blocked).status, "blocked");
  assertEquals(screenDocument(QUOTE_DOC).status, "requires_scrub");
});

// ── 7. Fail-closed staging ───────────────────────────────────────────────
Deno.test("07B.3.13 stageDocument writes scrubbed fixture only", async () => {
  const { io, writes, dirs } = mockIO();
  const staged = await stageDocument(QUOTE_DOC, io, { baseDir: "corpus" });
  assertEquals(staged.fixture_path, "corpus/staging/DOC-1.scrubbed.json");
  assert(dirs.includes("corpus/staging"));
  const written = writes[staged.fixture_path];
  assert(!written.includes("Robert Miller"));
  assert(!written.includes("robert.miller@example.com"));
  assert(written.includes("14240"));
  assert(staged.redactions > 0);
});

Deno.test("07B.3.14 stageDocument writes nothing when the document is blocked", async () => {
  const { io, writes } = mockIO();
  const blocked: DocumentPayload = {
    id: "DOC-C",
    mime_type: "application/pdf",
    page_count: 1,
    raw_text: "Total $1.00",
    structured: { email: "a@b.com" },
  };
  let threw = false;
  try {
    await stageDocument(blocked, io);
  } catch (e) {
    threw = true;
    assert(e instanceof UnscrubbedAssetError);
  }
  assert(threw);
  assertEquals(Object.keys(writes).length, 0);
});

// ── 8. Promotion gate ────────────────────────────────────────────────────
Deno.test("07B.3.15 assertPromotable blocks residual PII and pending review", () => {
  const staging = createStagingManifest({
    document_id: "GQ-900",
    sha256: "a".repeat(64),
    logical_asset_reference: "external://gq-900",
    mime_type: "application/pdf",
    page_count: 2,
    archetypes: ["DETAILED_MULTI_PAGE"],
    dataset_split: "development",
  });
  const err = assertThrows(
    () => assertPromotable(staging, []),
    PiiPromotionBlockedError,
  ) as PiiPromotionBlockedError;
  assert(err.reasons.includes("PII_REVIEW_NOT_VERIFIED"));

  const verified: GoldenDocumentManifest = {
    ...staging,
    pii_review_status: "deidentified_verified",
  };
  const err2 = assertThrows(
    () => assertPromotable(verified, detectPii("email a@b.com")),
    PiiPromotionBlockedError,
  ) as PiiPromotionBlockedError;
  assert(err2.reasons.includes("RESIDUAL_PII_FINDINGS"));

  // Clean + verified passes.
  assertPromotable(verified, []);
});

// ── 9. Staging manifest defaults ─────────────────────────────────────────
Deno.test("07B.3.16 staging manifests are unlocked and non-authoritative", () => {
  const m = createStagingManifest({
    document_id: "GQ-901",
    sha256: "b".repeat(64),
    logical_asset_reference: "external://gq-901",
    mime_type: "image/png",
    page_count: 1,
    archetypes: ["POOR_QUALITY_SCAN"],
    dataset_split: "holdout",
  });
  assertEquals(m.corpus_version, STAGING_CORPUS_VERSION);
  assertEquals(m.locked, false);
  assertEquals(m.pii_review_status, "deidentified_pending_review");
  assertEquals(m.source_type, "deidentified_real");
});

// ── 10. Locked record immutability ───────────────────────────────────────
Deno.test("07B.3.17 merge refuses to overwrite a locked golden record", () => {
  const collide = createStagingManifest({
    document_id: CORPUS_V1_PRE_INVENTORY.documents[0].document_id,
    sha256: "c".repeat(64),
    logical_asset_reference: "external://collide",
    mime_type: "application/pdf",
    page_count: 1,
    archetypes: ["SPARSE_ESTIMATE"],
    dataset_split: "development",
  });
  assertThrows(
    () => mergeStagingIntoInventory(CORPUS_V1_PRE_INVENTORY, [collide]),
    LockedRecordImmutableError,
  );
});

Deno.test("07B.3.18 merge appends new ids without mutating the base inventory", () => {
  const id = nextDocumentId(CORPUS_V1_PRE_INVENTORY);
  assertEquals(id, "GQ-003");
  const fresh = createStagingManifest({
    document_id: id,
    sha256: "d".repeat(64),
    logical_asset_reference: "external://gq-003",
    mime_type: "application/pdf",
    page_count: 6,
    archetypes: ["MULTI_PRODUCT", "TABLE_HEAVY"],
    dataset_split: "development",
  });
  const before = CORPUS_V1_PRE_INVENTORY.documents.length;
  const merged = mergeStagingIntoInventory(CORPUS_V1_PRE_INVENTORY, [fresh]);
  assertEquals(CORPUS_V1_PRE_INVENTORY.documents.length, before);
  assertEquals(merged.documents.length, before + 1);
  assertNotEquals(merged, CORPUS_V1_PRE_INVENTORY);
  assert(merged.documents.some((d) => d.document_id === id));
});
