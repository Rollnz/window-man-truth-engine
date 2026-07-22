# Golden Annotation Guide (Sprint 07A)

Operational rules for producing source-neutral human ground truth (Layer A).

## Sections

1. **Classification** — document type (quote, invoice, contract, non-window).
2. **Entity Attribution** — homeowner, property, contractor, salesperson. Never conflate roles. Explicit anti-misattribution rule: if a document names both a sales rep and a homeowner on the same line, annotate each with their exact role. Never silently drop a role because a scanner is expected to miss it.
3. **Opening Count** — record the raw number of openings from the document even when it disagrees with line-item quantity sums.
4. **Pricing** — total, subtotal, tax, discount, deposit. Preserve currency and anomalous values.
5. **Payment Schedule** — deposit %, milestones, financing. Percentages that do not sum to 100% are preserved as-is (anomaly).
6. **Line Items** — opening_location, product_type, dimensions, quantity, unit_price, manufacturer, series, description. Use `stable_line_id` when the document supplies one.
7. **Product Configurations** — glazing, impact rating, U-factor, SHGC, gas fill. Associate to line items via `applies_to_line_item_ids`.
8. **Scope** — inclusions, exclusions, permits, hauling.
9. **Warranties & Terms** — labor, materials, transferability, cancellation.
10. **NOT_FOUND** — used ONLY when the document does not present the fact at all. Requires `value: null` and `certainty: not_present`.
11. **UNCERTAIN** — used when the fact appears but is ambiguous in the document.
12. **Conflicting Documents** — when two pages disagree, prefer the more specific / more authoritative page and record the conflict in `notes`; require adjudication.

## Anomaly Rule
If the source explicitly says 120% deposit, annotate `value: 120, anomaly: true`. Do NOT normalize to 100. Layer 4 (future) decides good/bad/legal; benchmarks only judge faithful extraction.

## QA Workflow
```
PRIMARY ANNOTATION → SECONDARY REVIEW → DISAGREEMENT → ADJUDICATION → LOCKED GOLDEN TRUTH
```

- **Primary annotation**: first reviewer produces facts.
- **Secondary review**: second reviewer independently annotates. Diff.
- **Disagreement**: any diff flags `review_status = disagreed`.
- **Adjudication**: third reviewer resolves; sets `adjudication_status = adjudicated` with `adjudication_notes`.
- **LOCKED**: only when `review_status = agreed` OR `adjudication_status = adjudicated`. The `ground-truth.ts` validator enforces this.

## Stronger Review Required For
- Holdout documents (always).
- Critical commercial facts (`pricing.*`).
- Entity attribution.
- Conflicting/ambiguous documents.

## Metadata Fields
`annotated_by, reviewed_by, annotation_version, review_status, adjudication_status, adjudication_notes, locked`. Internal reviewer identifiers only — no real personal names required.

## Authoritative Runs
Benchmark runs where any document has `locked=false` are marked `authoritative=false` in the report; results are advisory, not decisive.
