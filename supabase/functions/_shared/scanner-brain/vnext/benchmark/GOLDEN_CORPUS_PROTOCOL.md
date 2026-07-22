# Golden Corpus Protocol — `gq-v1`

Sprint 07B established the operating rules for the Golden Quote benchmark corpus. This document is authoritative; any deviation requires a new corpus version.

## Purpose
Produce the smallest credible, diverse, human-grounded, privacy-safe benchmark set capable of answering whether Scanner vNext extracts real window quotes more accurately than Brain 3 and the WM MVP reference.

Quality of ground truth outweighs corpus size. A rigorously annotated 15-document corpus is preferable to a badly annotated 30-document corpus.

## What may enter the corpus
- Approved **synthetic** benchmark documents (`source_type: synthetic`, `pii_review_status: synthetic`).
- **De-identified real** quote documents whose PII review status has advanced to `deidentified_verified`.

Any document with `deidentified_pending_review` is **non-authoritative** and cannot enter the scored benchmark.

## Manifest requirements
Every corpus document requires a manifest matching `corpus/manifest-types.ts` with:
`document_id` (GQ-###, stable non-semantic), `corpus_version`, `source_type`, `archetypes[]`, `sha256`, `asset.{logical_asset_reference, mime_type, page_count}`, `dataset_split`, `annotation_version`, `annotation_status`, `review_status`, `adjudication_status`, `locked`, `pii_review_status`, `known_prompt_exposure`.

Deterministic validation lives in `corpus/manifest-validator.ts` and blocks missing fields, invalid SHA256, unknown archetypes, split overlap, and unverified PII on locked rows.

## Development / holdout split
Target 60–70% development, 30–40% holdout. Coverage must not concentrate hard archetypes in one split. Holdout should not be repeatedly inspected during prompt tuning; label prompt-exposed documents accordingly.

## Corpus versioning and lock
`buildCorpusLock()` produces `GOLDEN_CORPUS_LOCK.json` — a deterministic snapshot including document projections, SHA256s, annotation versions, capability matrix version, and threshold config version. Any change to inputs mutates `corpus_identity_hash`.

## Synthetic controls
Corpus v1 currently contains only **2 synthetic controls** (`GQ-001`, `GQ-002`). Synthetic controls are for regression / sanity / anti-hallucination detection and must never dominate headline real-world accuracy. Reports separate synthetic vs de-identified real results.

## Asset storage
Real de-identified binaries do NOT live in Git. Manifests reference documents via a logical asset reference (`synthetic://…` for controls, external references for real docs). Absolute developer paths are forbidden.

## Intake / de-identification / annotation workflow
1. Source document → PII review → de-identification (see `GOLDEN_CORPUS_PRIVACY_PROTOCOL.md`).
2. Primary annotation using source-neutral fact model (Layer A from Sprint 07A).
3. Independent secondary review for critical commercial and entity facts.
4. Adjudication when annotators disagree.
5. Lock (`locked = true`, `pii_review_status ∈ {synthetic, deidentified_verified}`).

Once locked, any change requires a new `annotation_version` and re-lock.
