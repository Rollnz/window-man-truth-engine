// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — DETERMINISTIC VALIDATION
//
// Hand-written zero-dependency validator for CanonicalExtractionV1 payloads.
// Matches the intent of the JSON Schema in `./schema.ts` and adds the
// cross-field invariants that Draft-07 alone cannot express:
//
//   - `found` facts MUST have a non-null value
//   - `not_found` facts MUST have `value === null`
//   - `uncertain` facts MAY be null (no constraint)
//   - `confidence` MUST be in [0.0, 1.0]
//   - `contract_version` MUST equal CANONICAL_CONTRACT_VERSION
//   - `document_type` and `readability` MUST be from their enums
//   - `payment_schedule` may be null when status=not_found; otherwise an array
//   - line items with `line_items_aggregate_only=true` MUST be empty
//
// Zero external dependencies.
// ═══════════════════════════════════════════════════════════════════════════

import { CANONICAL_CONTRACT_VERSION } from "./constants.ts";
import type {
  CanonicalExtractionV1,
  DocumentType,
  ExtractedFact,
  FactStatus,
  QuoteLineItem,
  Readability,
} from "./types.ts";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const DOCUMENT_TYPES: readonly DocumentType[] = [
  "quote",
  "estimate",
  "contract",
  "proposal",
  "invoice_receipt",
  "unrelated",
  "unreadable",
  "unsupported",
];

const READABILITY: readonly Readability[] = [
  "excellent",
  "good",
  "partial",
  "poor",
  "unreadable",
];

const FACT_STATUSES: readonly FactStatus[] = ["found", "not_found", "uncertain"];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function checkConfidence(
  n: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 1) {
    issues.push({
      path,
      message: `confidence must be a finite number in [0, 1] (got ${JSON.stringify(n)})`,
    });
  }
}

/**
 * Validate an ExtractedFact envelope AND its status/value invariants.
 * `valueChecker` is optional; when omitted, only null-vs-non-null is checked.
 */
function checkFact(
  fact: unknown,
  path: string,
  issues: ValidationIssue[],
  valueChecker?: (value: unknown, valuePath: string) => void,
): void {
  if (!isObject(fact)) {
    issues.push({ path, message: "fact envelope must be an object" });
    return;
  }
  const { status, value, confidence, evidence } = fact;

  if (typeof status !== "string" || !FACT_STATUSES.includes(status as FactStatus)) {
    issues.push({
      path: `${path}.status`,
      message: `status must be one of ${FACT_STATUSES.join(", ")}`,
    });
  }

  checkConfidence(confidence, `${path}.confidence`, issues);

  if (!Array.isArray(evidence)) {
    issues.push({ path: `${path}.evidence`, message: "evidence must be an array" });
  }

  // Status ⇄ value invariants
  if (status === "found" && value === null) {
    issues.push({
      path: `${path}.value`,
      message: "status=found requires a non-null value",
    });
  }
  if (status === "not_found" && value !== null) {
    issues.push({
      path: `${path}.value`,
      message: "status=not_found requires value=null",
    });
  }
  // uncertain has no invariant.

  if (value !== null && valueChecker) {
    valueChecker(value, `${path}.value`);
  }
}

function checkLineItem(
  item: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isObject(item)) {
    issues.push({ path, message: "line item must be an object" });
    return;
  }
  const li = item as Partial<QuoteLineItem>;
  if (li.quantity != null && (!Number.isInteger(li.quantity) || li.quantity < 0)) {
    issues.push({
      path: `${path}.quantity`,
      message: "quantity must be a non-negative integer when present",
    });
  }
  if (!Array.isArray(li.evidence)) {
    issues.push({ path: `${path}.evidence`, message: "evidence must be an array" });
  }
}

/**
 * Validate a candidate CanonicalExtractionV1 payload.
 * Returns a structured list of issues; does NOT throw.
 */
export function validateCanonicalExtractionV1(
  input: unknown,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isObject(input)) {
    return {
      valid: false,
      issues: [{ path: "$", message: "root must be an object" }],
    };
  }

  if (input.contract_version !== CANONICAL_CONTRACT_VERSION) {
    issues.push({
      path: "$.contract_version",
      message: `contract_version must equal "${CANONICAL_CONTRACT_VERSION}"`,
    });
  }

  // ── Classification ─────────────────────────────────────────────────────
  const cls = input.classification;
  if (!isObject(cls)) {
    issues.push({ path: "$.classification", message: "must be an object" });
  } else {
    if (!DOCUMENT_TYPES.includes(cls.document_type as DocumentType)) {
      issues.push({
        path: "$.classification.document_type",
        message: `must be one of ${DOCUMENT_TYPES.join(", ")}`,
      });
    }
    if (!READABILITY.includes(cls.readability as Readability)) {
      issues.push({
        path: "$.classification.readability",
        message: `must be one of ${READABILITY.join(", ")}`,
      });
    }
    checkConfidence(
      cls.classification_confidence,
      "$.classification.classification_confidence",
      issues,
    );
    if (typeof cls.is_supported_for_quote_analysis !== "boolean") {
      issues.push({
        path: "$.classification.is_supported_for_quote_analysis",
        message: "must be boolean",
      });
    }
    if (typeof cls.classification_reason !== "string") {
      issues.push({
        path: "$.classification.classification_reason",
        message: "must be string",
      });
    }
    if (
      cls.page_count !== null &&
      (!Number.isInteger(cls.page_count) ||
        (cls.page_count as number) < 1)
    ) {
      issues.push({
        path: "$.classification.page_count",
        message: "must be null or a positive integer",
      });
    }
  }

  // ── Entities ──────────────────────────────────────────────────────────
  const ents = input.entities as Record<string, unknown> | undefined;
  if (!isObject(ents)) {
    issues.push({ path: "$.entities", message: "must be an object" });
  } else {
    const ho = ents.homeowner as Record<string, unknown> | undefined;
    if (!isObject(ho)) {
      issues.push({ path: "$.entities.homeowner", message: "must be an object" });
    } else {
      checkFact(ho.name, "$.entities.homeowner.name", issues);
      checkFact(ho.email, "$.entities.homeowner.email", issues);
      checkFact(ho.phone, "$.entities.homeowner.phone", issues);
      checkFact(ho.mailing_address, "$.entities.homeowner.mailing_address", issues);
    }

    const prop = ents.property as Record<string, unknown> | undefined;
    if (!isObject(prop)) {
      issues.push({ path: "$.entities.property", message: "must be an object" });
    } else {
      checkFact(prop.address, "$.entities.property.address", issues);
    }

    const contr = ents.contractor as Record<string, unknown> | undefined;
    if (!isObject(contr)) {
      issues.push({ path: "$.entities.contractor", message: "must be an object" });
    } else {
      checkFact(contr.company_name, "$.entities.contractor.company_name", issues);
      checkFact(contr.license_number, "$.entities.contractor.license_number", issues);
      checkFact(contr.address, "$.entities.contractor.address", issues);
      checkFact(contr.phone, "$.entities.contractor.phone", issues);
      checkFact(contr.email, "$.entities.contractor.email", issues);
      checkFact(contr.website, "$.entities.contractor.website", issues);
    }

    const sales = ents.salesperson as Record<string, unknown> | undefined;
    if (!isObject(sales)) {
      issues.push({ path: "$.entities.salesperson", message: "must be an object" });
    } else {
      checkFact(sales.name, "$.entities.salesperson.name", issues);
      checkFact(sales.phone, "$.entities.salesperson.phone", issues);
      checkFact(sales.email, "$.entities.salesperson.email", issues);
    }
  }

  // ── Quote ─────────────────────────────────────────────────────────────
  const quote = input.quote as Record<string, unknown> | undefined;
  if (!isObject(quote)) {
    issues.push({ path: "$.quote", message: "must be an object" });
  } else {
    // metadata
    const meta = quote.metadata as Record<string, unknown> | undefined;
    if (!isObject(meta)) {
      issues.push({ path: "$.quote.metadata", message: "must be an object" });
    } else {
      checkFact(meta.quote_number, "$.quote.metadata.quote_number", issues);
      checkFact(meta.quote_date, "$.quote.metadata.quote_date", issues);
      checkFact(meta.expiration_date, "$.quote.metadata.expiration_date", issues);
    }

    // pricing
    const pr = quote.pricing as Record<string, unknown> | undefined;
    if (!isObject(pr)) {
      issues.push({ path: "$.quote.pricing", message: "must be an object" });
    } else {
      checkFact(pr.currency, "$.quote.pricing.currency", issues);
      checkFact(pr.subtotal, "$.quote.pricing.subtotal", issues);
      checkFact(pr.discounts, "$.quote.pricing.discounts", issues);
      checkFact(pr.taxes, "$.quote.pricing.taxes", issues);
      checkFact(pr.total_price, "$.quote.pricing.total_price", issues);
    }

    // payment
    const pay = quote.payment as Record<string, unknown> | undefined;
    if (!isObject(pay)) {
      issues.push({ path: "$.quote.payment", message: "must be an object" });
    } else {
      checkFact(pay.deposit_amount, "$.quote.payment.deposit_amount", issues);
      checkFact(
        pay.deposit_percentage,
        "$.quote.payment.deposit_percentage",
        issues,
        (v, p) => {
          if (typeof v !== "number" || v < 0 || v > 100) {
            issues.push({
              path: p,
              message: "deposit_percentage must be a number in [0, 100]",
            });
          }
        },
      );
      checkFact(pay.financing_offered, "$.quote.payment.financing_offered", issues);
      checkFact(pay.financing_provider, "$.quote.payment.financing_provider", issues);
      checkFact(pay.financing_terms, "$.quote.payment.financing_terms", issues);
      checkFact(
        pay.payment_schedule,
        "$.quote.payment.payment_schedule",
        issues,
        (v, p) => {
          if (!Array.isArray(v)) {
            issues.push({
              path: p,
              message: "payment_schedule value must be an array when non-null",
            });
          }
        },
      );
    }

    // line items + aggregate flag
    const items = quote.line_items;
    const aggregate = quote.line_items_aggregate_only;
    if (typeof aggregate !== "boolean") {
      issues.push({
        path: "$.quote.line_items_aggregate_only",
        message: "must be boolean",
      });
    }
    if (!Array.isArray(items)) {
      issues.push({ path: "$.quote.line_items", message: "must be an array" });
    } else {
      if (aggregate === true && items.length > 0) {
        issues.push({
          path: "$.quote.line_items",
          message:
            "when line_items_aggregate_only=true the array MUST be empty (no fabricated items)",
        });
      }
      items.forEach((it, i) => checkLineItem(it, `$.quote.line_items[${i}]`, issues));
    }

    checkFact(quote.opening_count, "$.quote.opening_count", issues, (v, p) => {
      if (!Number.isInteger(v) || (v as number) < 0) {
        issues.push({
          path: p,
          message: "opening_count value must be a non-negative integer",
        });
      }
    });

    // products / scope / warranties / terms — envelope-only checks
    const products = quote.products as Record<string, unknown> | undefined;
    if (isObject(products)) {
      for (const k of Object.keys(products)) {
        checkFact(products[k], `$.quote.products.${k}`, issues);
      }
    } else {
      issues.push({ path: "$.quote.products", message: "must be an object" });
    }

    const scope = quote.scope as Record<string, unknown> | undefined;
    if (isObject(scope)) {
      for (const k of Object.keys(scope)) {
        checkFact(scope[k], `$.quote.scope.${k}`, issues);
      }
    } else {
      issues.push({ path: "$.quote.scope", message: "must be an object" });
    }

    const warranties = quote.warranties as Record<string, unknown> | undefined;
    if (isObject(warranties)) {
      for (const k of Object.keys(warranties)) {
        checkFact(warranties[k], `$.quote.warranties.${k}`, issues);
      }
    } else {
      issues.push({ path: "$.quote.warranties", message: "must be an object" });
    }

    const terms = quote.terms as Record<string, unknown> | undefined;
    if (isObject(terms)) {
      for (const k of Object.keys(terms)) {
        checkFact(terms[k], `$.quote.terms.${k}`, issues);
      }
    } else {
      issues.push({ path: "$.quote.terms", message: "must be an object" });
    }
  }

  // ── Extraction meta ──────────────────────────────────────────────────
  const em = input.extraction_meta as Record<string, unknown> | undefined;
  if (!isObject(em)) {
    issues.push({ path: "$.extraction_meta", message: "must be an object" });
  } else {
    checkConfidence(em.extraction_confidence, "$.extraction_meta.extraction_confidence", issues);
    if (!Array.isArray(em.warnings)) {
      issues.push({ path: "$.extraction_meta.warnings", message: "must be an array" });
    }
  }

  return { valid: issues.length === 0, issues };
}

/** Convenience: throw on invalid input. Intended for tests / dev tooling. */
export function assertCanonicalExtractionV1(
  input: unknown,
): asserts input is CanonicalExtractionV1 {
  const r = validateCanonicalExtractionV1(input);
  if (!r.valid) {
    throw new Error(
      "CanonicalExtractionV1 validation failed: " +
        r.issues.map((i) => `${i.path}: ${i.message}`).join("; "),
    );
  }
}
