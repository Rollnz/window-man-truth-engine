# Audit of your prompt: **81/100** (up from 72 — but 3 factual defects remain)

## Verified against the repo (reads done this turn)

| Claim in your prompt | Reality |
|---|---|
| "Vitest test suite ... 187 tests" | **Wrong runner.** `corpus/corpus.test.ts` and `corpus/intake.test.ts` are **Deno tests** (`Deno.test`, `https://deno.land/std@0.224.0/assert`). `vitest.config.ts` only includes `src/**` and `tests/scanner-brain/**` — a `corpus/intake-pipeline.test.ts` written in Vitest would **never run** and the suite would still say 187. New corpus tests must be Deno tests. |
| Import `../../benchmark/CORPUS_COVERAGE.json` from the component | **Path is wrong.** From `src/components/benchmark/` the real path is `../../../supabase/functions/_shared/scanner-brain/vnext/benchmark/CORPUS_COVERAGE.json`. Also `tsconfig.app.json` `include: ["src"]`, so that file is outside the TS program — typing must be declared locally in the component, not inferred. |
| "no hardcoded Tailwind color utilities" | Correct and enforced by project memory (Command Center Noir, `#0F1419` / `#00D9FF`). |
| 13 required archetypes | `REQUIRED_ARCHETYPES` in `coverage-report.ts` has **12** entries; `CORPUS_COVERAGE.json` tracks **16** total archetypes. "13" is the *minimum document count* (`TARGET_CORPUS.total_min`). The dashboard will render all 16 with the 12 required ones flagged, and show the 13-doc target in the header. |

Remaining real gaps your critique missed: runner mismatch, the 12-vs-13 archetype conflation, and the fact that `intake-checklist.ts` already implements the checklist/step content (do not duplicate it).

## Five moves ahead — what this becomes

1. **Now:** a fail-closed local scrubber that makes real quotes safe to annotate.
2. **Next:** the staging manifests feed `mergeStagingIntoInventory` → `gq-v1` promotion, unblocking Sprint 07C's `CORPUS_INPUT_REQUIRED` gate.
3. **Then:** the coverage matrix becomes the operator console for corpus assembly — "which archetype do I need to go find next" instead of reading JSON.
4. **Then:** the same PII scanner is reusable as a pre-flight guard on real scanner uploads (log-safe findings, no raw values) — a compliance asset, not just a benchmark tool.
5. **End state:** every scanner prompt/model change is scored against a locked, privacy-verified corpus with a public archetype scoreboard. That is the difference between "our AI seems good" and defensible evidence you can show a partner.

---

# Implementation

## A. `corpus/pii-scanner.ts` (new, Deno)

```ts
export const PII_SCANNER_VERSION = "pii-scanner-v1.0.0";
export type PiiKind =
  | "EMAIL" | "PHONE" | "STREET_ADDRESS" | "ZIP4" | "SSN"
  | "CREDIT_CARD" | "DOB" | "ACCOUNT_ID" | "PERSON_NAME";
export type PiiSeverity = "critical" | "high" | "medium";

export interface PiiFinding {
  kind: PiiKind;
  severity: PiiSeverity;
  match_span: { start: number; end: number };   // offsets only
  redaction_token: string;                       // e.g. [REDACTED_EMAIL_1]
  // NOTE: the raw matched value is never stored, logged or serialized.
}
export interface PiiScanResult {
  scanner_version: string;
  findings: PiiFinding[];
  substitutions: Record<string, string>; // token -> stable ordinal token (no raw keys)
  scrubbed_text: string;
}
```
Detectors (deterministic, ordered by severity so overlapping matches resolve predictably):
`EMAIL`, `PHONE` (US, 5 formats), `SSN`, `CREDIT_CARD` (digit-group + **Luhn** check), `DOB`, `ZIP4`, `STREET_ADDRESS` (number + street-type keyword), `ACCOUNT_ID` (`acct|account|loan|license|lic#|policy` + alnum run), `PERSON_NAME` (label-anchored only: `Customer:`, `Homeowner:`, `Sold To:` — avoids false positives on product names).

**Substitution law:** sequential-per-kind, stable within one document — first distinct email → `[REDACTED_EMAIL_1]`, its every later occurrence → the same token; a second distinct email → `[REDACTED_EMAIL_2]`. Matching is case- and whitespace-normalized so `John Doe` / `JOHN DOE` collapse to one token. Deterministic, so unit tests assert exact output. No random names, no hashes (hashes are reversible against a small candidate set — a real privacy risk).

## B. `corpus/intake-pipeline.ts` (new, Deno)

```ts
export interface DocumentPayload {
  id: string;                                  // caller-local, non-PII
  mime_type: string;
  page_count: number;
  raw_text: string;                            // extracted text layer
  structured?: Record<string, unknown>;        // optional parsed fields
  metadata?: Record<string, unknown>;          // stripped before staging
}
export type ScreeningStatus = "clean" | "requires_scrub" | "blocked";

export class PiiPromotionBlockedError extends Error {
  readonly code = "PII_PROMOTION_BLOCKED";
  constructor(readonly reasons: string[]) { super(`PII_PROMOTION_BLOCKED: ${reasons.join(",")}`); }
}
export class UnscrubbedAssetError extends Error { readonly code = "UNSCRUBBED_ASSET"; }

export interface StagingIO {                    // injected — no ambient fs
  writeTextFile(path: string, contents: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}
export function screenDocument(p: DocumentPayload): { status: ScreeningStatus; scan: PiiScanResult };
export function scrubDocument(p: DocumentPayload): { payload: DocumentPayload; scan: PiiScanResult };
export function stageDocument(p: DocumentPayload, io: StagingIO, opts?): Promise<StagedDocument>;
export function assertPromotable(m: GoldenDocumentManifest, findings: PiiFinding[]): void;
```
- `screenDocument` never mutates; `blocked` when a `critical` finding sits inside `structured` (a field we cannot safely rewrite).
- `scrubDocument` rewrites `raw_text` **and** string leaves of `structured`, drops `metadata` entirely, and asserts invariants: line count, every number/currency token, and table column counts are byte-identical pre/post scrub. Violation → `UnscrubbedAssetError`.
- `stageDocument` refuses to write anything whose re-scan still yields findings, then writes `staging/<id>.scrubbed.json` + `staging/manifests/<id>.json` through the injected IO — nothing touches the real filesystem in tests.
- `assertPromotable` throws `PiiPromotionBlockedError` when: any finding remains, `pii_review_status` is not `synthetic`/`deidentified_verified`, or `validateDocumentManifest()` returns issues.

## C. `corpus/staging-manifest.ts` (new, Deno)

```ts
export class LockedRecordImmutableError extends Error { readonly code = "LOCKED_RECORD_IMMUTABLE"; }
export const STAGING_CORPUS_VERSION = "gq-v1-staging";
export function createStagingManifest(input): GoldenDocumentManifest; // locked:false,
  // pii_review_status:"deidentified_pending_review", source_type:"deidentified_real",
  // annotation_status:"not_started", adjudication_status:"not_required"
export function mergeStagingIntoInventory(
  base: CorpusInventory, staged: GoldenDocumentManifest[],
): CorpusInventory; // pure; throws LockedRecordImmutableError on collision with
                    // locked===true or corpus_version==="gq-v1"
```
Validation is delegated to the existing `manifest-validator.ts` — no duplicated rules.

## D. `.gitignore` additions

```
# Golden corpus — never commit real or staged documents
**/benchmark/corpus/staging/
**/benchmark/corpus/raw/
```

## E. `src/components/benchmark/ArchetypeCoverageMatrix.tsx` (only `src/**` file)

- `export const ArchetypeCoverageMatrix = React.forwardRef<HTMLDivElement, Props>(...)` **plus** a `export default` — both, so mounting later can't fail on import style. `Props = { className?: string }`; data is imported, not passed.
- Import: `import coverage from "../../../supabase/functions/_shared/scanner-brain/vnext/benchmark/CORPUS_COVERAGE.json";` with a locally declared `CoverageShape` interface (that file is outside `tsconfig.app.json`'s `include`).
- Status per archetype: **Complete** = covered and required; **Partial** = covered only by synthetic controls (`SYNTHETIC_CONTROL` co-tag); **Missing** = count 0. Required archetypes get a "REQUIRED" chip; optional ones render muted.
- Header strip: documents (2) vs 13-doc target with a progress bar, dev/holdout, synthetic vs de-identified real, PII verified/pending, readiness verdict, blocker list.
- Styling: semantic tokens only (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary` for cyan, `bg-card/60 backdrop-blur`), responsive `grid sm:grid-cols-2 lg:grid-cols-4`. No route registration, no other `src` edits.

## F. Tests — `corpus/intake.pii.test.ts` (**Deno**, offline, zero provider calls)

~16 `Deno.test` cases: per-detector positive + negative vectors; Luhn rejects an invalid card; findings carry no raw values; same value → same token, distinct values → distinct tokens; case-insensitive collapse; numeric totals / line count / column count preserved; `structured` string leaves scrubbed and `metadata` dropped; `screenDocument` returns `blocked` for critical structured PII; `stageDocument` writes nothing when findings remain (asserted via a mock `StagingIO`); `assertPromotable` throws `PiiPromotionBlockedError`; `mergeStagingIntoInventory` throws `LockedRecordImmutableError` on `GQ-001`, and succeeds for a fresh id returning a new object with `base` unmutated.

Run with `deno test` over the benchmark dir; existing 187 stay untouched → **≥203 green**.

## Out of scope
No changes to scanner logic, prompts, edge functions, routes, migrations, DB, or `CORPUS_COVERAGE.json` contents. No real PII enters git or any database.
