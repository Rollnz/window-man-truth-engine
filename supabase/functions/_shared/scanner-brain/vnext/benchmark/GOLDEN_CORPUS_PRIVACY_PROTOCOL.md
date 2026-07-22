# Golden Corpus Privacy & De-Identification Protocol

No real homeowner PII may enter source control at any time. This applies to manifests, annotations, evidence excerpts, filenames, or embedded document metadata.

## Sensitive fields (non-exhaustive)
Homeowner/customer name, phone, email, property street address, signature, account numbers, financing application IDs, loan IDs, DOB, driver license, government IDs, bank/payment info, QR/barcode payloads that encode private data, PDF metadata containing customer identity, EXIF metadata, hidden comments, and any filename that reveals PII.

## De-identification rules
- Replace sensitive values with **stable synthetic equivalents** (same original → same replacement inside the same document).
- Preserve format, layout, label relationships, table geometry, entity-role ambiguity, and page placement so extraction difficulty is preserved.
- Do NOT alter numeric facts, dimensions, financial totals, or product identifiers that are not personally identifying.
- Contractor / salesperson identities are NOT automatically safe. Substitute unless explicitly approved by the workspace owner.

## Metadata sanitization
Strip PDF author/producer fields, embedded comments, EXIF, and rename files to non-PII identifiers before annotation. Visual redaction alone is insufficient.

## PII review states
| `pii_review_status`             | May be locked? | May enter authoritative benchmark? |
|--------------------------------|----------------|-----------------------------------|
| `synthetic`                    | yes            | yes                               |
| `deidentified_pending_review`  | no             | no                                |
| `deidentified_verified`        | yes            | yes                               |

The validator (`corpus/manifest-validator.ts`) enforces the above; any drift fails Sprint 07B tests.

## Asset storage
Real de-identified binaries are NOT committed to Git and NOT uploaded to Supabase Storage. They resolve at Sprint 07C execution time via the logical asset reference in each manifest. Synthetic controls may live under `corpus/documents/` because they contain no PII.

## Escalation
If a document's PII status cannot be resolved, mark it `deidentified_pending_review` and exclude it from the authoritative corpus. Do NOT invent replacement identities without following the stable-replacement law above.
