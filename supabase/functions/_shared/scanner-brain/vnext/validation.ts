// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — DETERMINISTIC VALIDATION (Sprint 04A hardened)
//
// Hardening goals:
//   - Enforce every required key at every nesting level
//   - Reject unknown properties everywhere (schema parity)
//   - Validate value-type shapes (phone, address, money, dimension,
//     evidence, line item, payment milestone, product configuration)
//   - Enforce status/value invariants (found/not_found/uncertain)
//   - Preserve extraction anomalies (no 0..100 cap on deposit_percentage
//     or milestone percentage — only finite numeric)
//   - Validate line_items ↔ product_configurations association integrity
// ═══════════════════════════════════════════════════════════════════════════

import { CANONICAL_CONTRACT_VERSION } from "./constants.ts";
import type {
  CanonicalExtractionV1,
  DocumentType,
  FactStatus,
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

// ── helpers ───────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function checkKeys(
  obj: Record<string, unknown>,
  path: string,
  required: readonly string[],
  issues: ValidationIssue[],
): void {
  for (const k of required) {
    if (!(k in obj)) {
      issues.push({ path: `${path}.${k}`, message: "required property missing" });
    }
  }
  for (const k of Object.keys(obj)) {
    if (!required.includes(k)) {
      issues.push({ path: `${path}.${k}`, message: "unknown property (additionalProperties=false)" });
    }
  }
}

function checkConfidence(n: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 1) {
    issues.push({
      path,
      message: `confidence must be a finite number in [0, 1] (got ${JSON.stringify(n)})`,
    });
  }
}

function checkNullableString(v: unknown, path: string, issues: ValidationIssue[]): void {
  if (v !== null && typeof v !== "string") {
    issues.push({ path, message: "must be string or null" });
  }
}

/**
 * Length-parity helpers — these mirror the maxLength/minLength constraints
 * declared in schema.ts. Do NOT invent new limits: every value here has a
 * matching JSON Schema constraint.
 */
export const STRING_LIMITS = {
  EVIDENCE_TEXT: 240,
  EVIDENCE_LOCATION_HINT: 120,
  MONEY_CURRENCY: 8,
  MONEY_FORMATTED: 40,
  PHONE_RAW: 64,
  PHONE_CONTEXT_HINT: 64,
  PRODUCT_CONFIG_ID: 64,
  APPLIES_TO_LINE_ITEM_ID: 64,
  LINE_ITEM_ID: 64,
  CLASSIFICATION_REASON: 500,
  WARNING: 500,
} as const;

function checkNullableBoundedString(
  v: unknown,
  path: string,
  maxLength: number,
  issues: ValidationIssue[],
): void {
  if (v === null) return;
  if (typeof v !== "string") {
    issues.push({ path, message: "must be string or null" });
    return;
  }
  if (v.length > maxLength) {
    issues.push({
      path,
      message: `exceeds maxLength ${maxLength} (got ${v.length})`,
    });
  }
}

function checkBoundedString(
  v: unknown,
  path: string,
  opts: { minLength?: number; maxLength: number },
  issues: ValidationIssue[],
): void {
  if (typeof v !== "string") {
    issues.push({ path, message: "must be string" });
    return;
  }
  if (opts.minLength !== undefined && v.length < opts.minLength) {
    issues.push({
      path,
      message: `below minLength ${opts.minLength} (got ${v.length})`,
    });
  }
  if (v.length > opts.maxLength) {
    issues.push({
      path,
      message: `exceeds maxLength ${opts.maxLength} (got ${v.length})`,
    });
  }
}

function checkNullableInt(v: unknown, path: string, issues: ValidationIssue[]): void {
  if (v === null) return;
  if (!Number.isInteger(v)) issues.push({ path, message: "must be integer or null" });
}

function checkNullableNumber(v: unknown, path: string, issues: ValidationIssue[]): void {
  if (v === null) return;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    issues.push({ path, message: "must be finite number or null" });
  }
}

function checkNullableBool(v: unknown, path: string, issues: ValidationIssue[]): void {
  if (v !== null && typeof v !== "boolean") {
    issues.push({ path, message: "must be boolean or null" });
  }
}


function checkEvidenceArray(v: unknown, path: string, issues: ValidationIssue[]): void {
  if (!Array.isArray(v)) {
    issues.push({ path, message: "evidence must be an array" });
    return;
  }
  v.forEach((e, i) => {
    const p = `${path}[${i}]`;
    if (!isObject(e)) {
      issues.push({ path: p, message: "evidence item must be an object" });
      return;
    }
    checkKeys(e, p, ["page", "text", "location_hint"], issues);
    if (e.page !== null && (!Number.isInteger(e.page) || (e.page as number) < 1)) {
      issues.push({ path: `${p}.page`, message: "must be null or positive integer" });
    }
    checkNullableBoundedString(e.text, `${p}.text`, STRING_LIMITS.EVIDENCE_TEXT, issues);
    checkNullableBoundedString(
      e.location_hint,
      `${p}.location_hint`,
      STRING_LIMITS.EVIDENCE_LOCATION_HINT,
      issues,
    );
  });
}

function checkMoney(v: unknown, path: string, issues: ValidationIssue[]): void {
  if (v === null) return;
  if (!isObject(v)) {
    issues.push({ path, message: "MoneyAmount must be object or null" });
    return;
  }
  checkKeys(v, path, ["value", "currency", "formatted"], issues);
  if (typeof v.value !== "number" || !Number.isFinite(v.value)) {
    issues.push({ path: `${path}.value`, message: "money.value must be a finite number" });
  }
  checkNullableBoundedString(v.currency, `${path}.currency`, STRING_LIMITS.MONEY_CURRENCY, issues);
  checkNullableBoundedString(v.formatted, `${path}.formatted`, STRING_LIMITS.MONEY_FORMATTED, issues);
}

function checkPhone(v: unknown, path: string, issues: ValidationIssue[]): void {
  if (v === null) return;
  if (!isObject(v)) {
    issues.push({ path, message: "PhoneCandidate must be object or null" });
    return;
  }
  checkKeys(v, path, ["raw_value", "context_hint"], issues);
  checkBoundedString(v.raw_value, `${path}.raw_value`, { maxLength: STRING_LIMITS.PHONE_RAW }, issues);
  checkNullableBoundedString(
    v.context_hint,
    `${path}.context_hint`,
    STRING_LIMITS.PHONE_CONTEXT_HINT,
    issues,
  );
}


function checkAddress(v: unknown, path: string, issues: ValidationIssue[]): void {
  if (v === null) return;
  if (!isObject(v)) {
    issues.push({ path, message: "AddressCandidate must be object or null" });
    return;
  }
  checkKeys(
    v,
    path,
    ["street_address", "city", "state", "zip", "raw_display_address"],
    issues,
  );
  for (const k of ["street_address", "city", "state", "zip", "raw_display_address"] as const) {
    checkNullableString(v[k], `${path}.${k}`, issues);
  }
}

function checkDimension(v: unknown, path: string, issues: ValidationIssue[]): void {
  if (v === null) return;
  if (!isObject(v)) {
    issues.push({ path, message: "DimensionValue must be object or null" });
    return;
  }
  checkKeys(v, path, ["value", "unit"], issues);
  checkNullableNumber(v.value, `${path}.value`, issues);
  checkNullableString(v.unit, `${path}.unit`, issues);
}

/** ExtractedFact envelope check + optional value-shape hook. */
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
  checkKeys(fact, path, ["status", "value", "confidence", "evidence"], issues);
  const { status, value, confidence, evidence } = fact;

  if (typeof status !== "string" || !FACT_STATUSES.includes(status as FactStatus)) {
    issues.push({
      path: `${path}.status`,
      message: `status must be one of ${FACT_STATUSES.join(", ")}`,
    });
  }
  checkConfidence(confidence, `${path}.confidence`, issues);
  checkEvidenceArray(evidence, `${path}.evidence`, issues);

  if (status === "found" && value === null) {
    issues.push({ path: `${path}.value`, message: "status=found requires a non-null value" });
  }
  if (status === "not_found" && value !== null) {
    issues.push({ path: `${path}.value`, message: "status=not_found requires value=null" });
  }
  if (value !== null && valueChecker) valueChecker(value, `${path}.value`);
}

// ── repeated-record checkers ──────────────────────────────────────────────

const LINE_ITEM_KEYS = [
  "line_item_id",
  "description",
  "quantity",
  "opening_location",
  "product_type",
  "width",
  "height",
  "manufacturer",
  "brand",
  "series",
  "model",
  "unit_price",
  "extended_price",
  "product_configuration_id",
  "confidence",
  "evidence",
] as const;

function checkLineItem(item: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isObject(item)) {
    issues.push({ path, message: "line item must be an object" });
    return;
  }
  checkKeys(item, path, LINE_ITEM_KEYS, issues);
  checkNullableString(item.line_item_id, `${path}.line_item_id`, issues);
  checkNullableString(item.description, `${path}.description`, issues);
  if (item.quantity !== null && (!Number.isInteger(item.quantity) || (item.quantity as number) < 0)) {
    issues.push({ path: `${path}.quantity`, message: "quantity must be a non-negative integer or null" });
  }
  checkNullableString(item.opening_location, `${path}.opening_location`, issues);
  checkNullableString(item.product_type, `${path}.product_type`, issues);
  checkDimension(item.width, `${path}.width`, issues);
  checkDimension(item.height, `${path}.height`, issues);
  checkNullableString(item.manufacturer, `${path}.manufacturer`, issues);
  checkNullableString(item.brand, `${path}.brand`, issues);
  checkNullableString(item.series, `${path}.series`, issues);
  checkNullableString(item.model, `${path}.model`, issues);
  checkMoney(item.unit_price, `${path}.unit_price`, issues);
  checkMoney(item.extended_price, `${path}.extended_price`, issues);
  checkNullableString(item.product_configuration_id, `${path}.product_configuration_id`, issues);
  checkConfidence(item.confidence, `${path}.confidence`, issues);
  checkEvidenceArray(item.evidence, `${path}.evidence`, issues);
}

const MILESTONE_KEYS = [
  "label",
  "trigger_or_milestone",
  "amount",
  "percentage",
  "due_date_or_timing",
  "confidence",
  "evidence",
] as const;

function checkMilestone(m: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isObject(m)) {
    issues.push({ path, message: "milestone must be an object" });
    return;
  }
  checkKeys(m, path, MILESTONE_KEYS, issues);
  checkNullableString(m.label, `${path}.label`, issues);
  checkNullableString(m.trigger_or_milestone, `${path}.trigger_or_milestone`, issues);
  checkMoney(m.amount, `${path}.amount`, issues);
  // Anomaly-preserving: only finite numeric enforcement (no 0..100 cap).
  checkNullableNumber(m.percentage, `${path}.percentage`, issues);
  checkNullableString(m.due_date_or_timing, `${path}.due_date_or_timing`, issues);
  checkConfidence(m.confidence, `${path}.confidence`, issues);
  checkEvidenceArray(m.evidence, `${path}.evidence`, issues);
}

const PRODUCT_CONFIG_KEYS = [
  "product_configuration_id",
  "manufacturer",
  "brand",
  "series",
  "model",
  "noa_identifier",
  "florida_approval_identifier",
  "dp_rating",
  "impact_designation",
  "glass_package",
  "low_e",
  "argon",
  "tint",
  "glass_makeup",
  "frame_material",
  "applies_to_line_item_ids",
  "confidence",
  "evidence",
] as const;

function checkProductConfig(pc: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isObject(pc)) {
    issues.push({ path, message: "product configuration must be an object" });
    return;
  }
  checkKeys(pc, path, PRODUCT_CONFIG_KEYS, issues);
  if (typeof pc.product_configuration_id !== "string" || pc.product_configuration_id.length === 0) {
    issues.push({ path: `${path}.product_configuration_id`, message: "must be a non-empty string" });
  }
  for (const k of [
    "manufacturer",
    "brand",
    "series",
    "model",
    "noa_identifier",
    "florida_approval_identifier",
    "dp_rating",
    "impact_designation",
    "glass_package",
    "tint",
    "glass_makeup",
    "frame_material",
  ] as const) {
    checkNullableString(pc[k], `${path}.${k}`, issues);
  }
  checkNullableBool(pc.low_e, `${path}.low_e`, issues);
  checkNullableBool(pc.argon, `${path}.argon`, issues);
  if (!Array.isArray(pc.applies_to_line_item_ids)) {
    issues.push({ path: `${path}.applies_to_line_item_ids`, message: "must be an array" });
  } else {
    pc.applies_to_line_item_ids.forEach((id, i) => {
      if (typeof id !== "string") {
        issues.push({
          path: `${path}.applies_to_line_item_ids[${i}]`,
          message: "must be string",
        });
      }
    });
  }
  checkConfidence(pc.confidence, `${path}.confidence`, issues);
  checkEvidenceArray(pc.evidence, `${path}.evidence`, issues);
}

// ── root validator ────────────────────────────────────────────────────────

const ROOT_KEYS = [
  "contract_version",
  "classification",
  "entities",
  "quote",
  "extraction_meta",
] as const;

const CLASSIFICATION_KEYS = [
  "document_type",
  "classification_confidence",
  "readability",
  "page_count",
  "classification_reason",
] as const;

const ENTITY_KEYS = ["homeowner", "property", "contractor", "salesperson"] as const;
const HOMEOWNER_KEYS = ["name", "email", "phone", "mailing_address"] as const;
const PROPERTY_KEYS = ["address"] as const;
const CONTRACTOR_KEYS = ["company_name", "license_number", "address", "phone", "email", "website"] as const;
const SALESPERSON_KEYS = ["name", "phone", "email"] as const;

const QUOTE_KEYS = [
  "metadata",
  "pricing",
  "payment",
  "line_items",
  "line_items_aggregate_only",
  "opening_count",
  "product_configurations",
  "scope",
  "warranties",
  "terms",
] as const;

const METADATA_KEYS = ["quote_number", "quote_date", "expiration_date"] as const;
const PRICING_KEYS = ["currency", "subtotal", "discounts", "taxes", "total_price"] as const;
const PAYMENT_KEYS = [
  "deposit_amount",
  "deposit_percentage",
  "financing_offered",
  "financing_provider",
  "financing_terms",
  "payment_schedule",
] as const;
const SCOPE_KEYS = [
  "installation", "removal", "disposal", "permits", "engineering", "inspection",
  "remeasure", "waterproofing", "sealant", "anchoring", "stucco_repair",
  "drywall_repair", "paint_repair", "cleanup", "change_orders",
] as const;
const WARRANTY_KEYS = ["labor_warranty", "product_warranty", "glass_warranty"] as const;
const TERMS_KEYS = [
  "service_process", "cancellation_terms", "change_order_terms",
  "exclusions", "estimated_timeline",
] as const;
const EXTRACTION_META_KEYS = ["extraction_confidence", "warnings"] as const;

export function validateCanonicalExtractionV1(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isObject(input)) {
    return { valid: false, issues: [{ path: "$", message: "root must be an object" }] };
  }
  checkKeys(input, "$", ROOT_KEYS, issues);

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
    checkKeys(cls, "$.classification", CLASSIFICATION_KEYS, issues);
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
    checkConfidence(cls.classification_confidence, "$.classification.classification_confidence", issues);
    if (typeof cls.classification_reason !== "string") {
      issues.push({ path: "$.classification.classification_reason", message: "must be string" });
    }
    if (cls.page_count !== null && (!Number.isInteger(cls.page_count) || (cls.page_count as number) < 1)) {
      issues.push({ path: "$.classification.page_count", message: "must be null or a positive integer" });
    }
  }

  // ── Entities ──────────────────────────────────────────────────────────
  const ents = input.entities;
  if (!isObject(ents)) {
    issues.push({ path: "$.entities", message: "must be an object" });
  } else {
    checkKeys(ents, "$.entities", ENTITY_KEYS, issues);

    const ho = ents.homeowner;
    if (isObject(ho)) {
      checkKeys(ho, "$.entities.homeowner", HOMEOWNER_KEYS, issues);
      checkFact(ho.name, "$.entities.homeowner.name", issues,
        (v, p) => checkNullableString(v, p, issues));
      checkFact(ho.email, "$.entities.homeowner.email", issues,
        (v, p) => checkNullableString(v, p, issues));
      checkFact(ho.phone, "$.entities.homeowner.phone", issues, checkPhoneValue(issues));
      checkFact(ho.mailing_address, "$.entities.homeowner.mailing_address", issues, checkAddressValue(issues));
    } else {
      issues.push({ path: "$.entities.homeowner", message: "must be an object" });
    }

    const prop = ents.property;
    if (isObject(prop)) {
      checkKeys(prop, "$.entities.property", PROPERTY_KEYS, issues);
      checkFact(prop.address, "$.entities.property.address", issues, checkAddressValue(issues));
    } else {
      issues.push({ path: "$.entities.property", message: "must be an object" });
    }

    const contr = ents.contractor;
    if (isObject(contr)) {
      checkKeys(contr, "$.entities.contractor", CONTRACTOR_KEYS, issues);
      checkFact(contr.company_name, "$.entities.contractor.company_name", issues,
        (v, p) => checkNullableString(v, p, issues));
      checkFact(contr.license_number, "$.entities.contractor.license_number", issues,
        (v, p) => checkNullableString(v, p, issues));
      checkFact(contr.address, "$.entities.contractor.address", issues, checkAddressValue(issues));
      checkFact(contr.phone, "$.entities.contractor.phone", issues, checkPhoneValue(issues));
      checkFact(contr.email, "$.entities.contractor.email", issues,
        (v, p) => checkNullableString(v, p, issues));
      checkFact(contr.website, "$.entities.contractor.website", issues,
        (v, p) => checkNullableString(v, p, issues));
    } else {
      issues.push({ path: "$.entities.contractor", message: "must be an object" });
    }

    const sales = ents.salesperson;
    if (isObject(sales)) {
      checkKeys(sales, "$.entities.salesperson", SALESPERSON_KEYS, issues);
      checkFact(sales.name, "$.entities.salesperson.name", issues,
        (v, p) => checkNullableString(v, p, issues));
      checkFact(sales.phone, "$.entities.salesperson.phone", issues, checkPhoneValue(issues));
      checkFact(sales.email, "$.entities.salesperson.email", issues,
        (v, p) => checkNullableString(v, p, issues));
    } else {
      issues.push({ path: "$.entities.salesperson", message: "must be an object" });
    }
  }

  // ── Quote ─────────────────────────────────────────────────────────────
  const quote = input.quote;
  if (!isObject(quote)) {
    issues.push({ path: "$.quote", message: "must be an object" });
  } else {
    checkKeys(quote, "$.quote", QUOTE_KEYS, issues);

    // metadata
    const meta = quote.metadata;
    if (isObject(meta)) {
      checkKeys(meta, "$.quote.metadata", METADATA_KEYS, issues);
      for (const k of METADATA_KEYS) {
        checkFact(meta[k], `$.quote.metadata.${k}`, issues,
          (v, p) => checkNullableString(v, p, issues));
      }
    } else {
      issues.push({ path: "$.quote.metadata", message: "must be an object" });
    }

    // pricing
    const pr = quote.pricing;
    if (isObject(pr)) {
      checkKeys(pr, "$.quote.pricing", PRICING_KEYS, issues);
      checkFact(pr.currency, "$.quote.pricing.currency", issues,
        (v, p) => checkNullableString(v, p, issues));
      for (const k of ["subtotal", "discounts", "taxes", "total_price"] as const) {
        checkFact(pr[k], `$.quote.pricing.${k}`, issues,
          (v, p) => checkMoney(v, p, issues));
      }
    } else {
      issues.push({ path: "$.quote.pricing", message: "must be an object" });
    }

    // payment
    const pay = quote.payment;
    if (isObject(pay)) {
      checkKeys(pay, "$.quote.payment", PAYMENT_KEYS, issues);
      checkFact(pay.deposit_amount, "$.quote.payment.deposit_amount", issues,
        (v, p) => checkMoney(v, p, issues));
      // Anomaly-preserving: numeric only, no 0..100 range check.
      checkFact(pay.deposit_percentage, "$.quote.payment.deposit_percentage", issues, (v, p) => {
        if (typeof v !== "number" || !Number.isFinite(v)) {
          issues.push({ path: p, message: "deposit_percentage must be a finite number when present" });
        }
      });
      checkFact(pay.financing_offered, "$.quote.payment.financing_offered", issues, (v, p) => {
        if (typeof v !== "boolean") issues.push({ path: p, message: "must be boolean" });
      });
      checkFact(pay.financing_provider, "$.quote.payment.financing_provider", issues,
        (v, p) => checkNullableString(v, p, issues));
      checkFact(pay.financing_terms, "$.quote.payment.financing_terms", issues,
        (v, p) => checkNullableString(v, p, issues));
      checkFact(pay.payment_schedule, "$.quote.payment.payment_schedule", issues, (v, p) => {
        if (!Array.isArray(v)) {
          issues.push({ path: p, message: "payment_schedule value must be an array when non-null" });
          return;
        }
        v.forEach((m, i) => checkMilestone(m, `${p}[${i}]`, issues));
      });
    } else {
      issues.push({ path: "$.quote.payment", message: "must be an object" });
    }

    // line items + aggregate flag + product configurations
    const items = quote.line_items;
    const aggregate = quote.line_items_aggregate_only;
    if (typeof aggregate !== "boolean") {
      issues.push({ path: "$.quote.line_items_aggregate_only", message: "must be boolean" });
    }
    const lineItemIds = new Set<string>();
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
      items.forEach((it, i) => {
        checkLineItem(it, `$.quote.line_items[${i}]`, issues);
        if (isObject(it) && typeof it.line_item_id === "string") {
          lineItemIds.add(it.line_item_id);
        }
      });
    }

    checkFact(quote.opening_count, "$.quote.opening_count", issues, (v, p) => {
      if (!Number.isInteger(v) || (v as number) < 0) {
        issues.push({ path: p, message: "opening_count value must be a non-negative integer" });
      }
    });

    // product_configurations — plural
    const pcs = quote.product_configurations;
    if (!Array.isArray(pcs)) {
      issues.push({ path: "$.quote.product_configurations", message: "must be an array" });
    } else {
      const seenIds = new Set<string>();
      pcs.forEach((pc, i) => {
        const p = `$.quote.product_configurations[${i}]`;
        checkProductConfig(pc, p, issues);
        if (isObject(pc) && typeof pc.product_configuration_id === "string") {
          if (seenIds.has(pc.product_configuration_id)) {
            issues.push({
              path: `${p}.product_configuration_id`,
              message: `duplicate product_configuration_id "${pc.product_configuration_id}"`,
            });
          }
          seenIds.add(pc.product_configuration_id);
          if (Array.isArray(pc.applies_to_line_item_ids)) {
            pc.applies_to_line_item_ids.forEach((refId, j) => {
              if (
                typeof refId === "string" &&
                Array.isArray(items) && items.length > 0 &&
                !lineItemIds.has(refId)
              ) {
                issues.push({
                  path: `${p}.applies_to_line_item_ids[${j}]`,
                  message: `references unknown line_item_id "${refId}"`,
                });
              }
            });
          }
        }
      });
      // Reverse check: line-item pointer must resolve when non-null
      if (Array.isArray(items)) {
        items.forEach((it, i) => {
          if (
            isObject(it) &&
            typeof it.product_configuration_id === "string" &&
            !seenIds.has(it.product_configuration_id)
          ) {
            issues.push({
              path: `$.quote.line_items[${i}].product_configuration_id`,
              message: `references unknown product_configuration_id "${it.product_configuration_id}"`,
            });
          }
        });
      }
    }

    // scope / warranties / terms — envelope + required-keys
    const scope = quote.scope;
    if (isObject(scope)) {
      checkKeys(scope, "$.quote.scope", SCOPE_KEYS, issues);
      for (const k of SCOPE_KEYS) {
        checkFact(scope[k], `$.quote.scope.${k}`, issues,
          (v, p) => checkNullableString(v, p, issues));
      }
    } else {
      issues.push({ path: "$.quote.scope", message: "must be an object" });
    }

    const warranties = quote.warranties;
    if (isObject(warranties)) {
      checkKeys(warranties, "$.quote.warranties", WARRANTY_KEYS, issues);
      for (const k of WARRANTY_KEYS) {
        checkFact(warranties[k], `$.quote.warranties.${k}`, issues,
          (v, p) => checkNullableString(v, p, issues));
      }
    } else {
      issues.push({ path: "$.quote.warranties", message: "must be an object" });
    }

    const terms = quote.terms;
    if (isObject(terms)) {
      checkKeys(terms, "$.quote.terms", TERMS_KEYS, issues);
      for (const k of TERMS_KEYS) {
        checkFact(terms[k], `$.quote.terms.${k}`, issues,
          (v, p) => checkNullableString(v, p, issues));
      }
    } else {
      issues.push({ path: "$.quote.terms", message: "must be an object" });
    }
  }

  // ── Extraction meta ──────────────────────────────────────────────────
  const em = input.extraction_meta;
  if (!isObject(em)) {
    issues.push({ path: "$.extraction_meta", message: "must be an object" });
  } else {
    checkKeys(em, "$.extraction_meta", EXTRACTION_META_KEYS, issues);
    checkConfidence(em.extraction_confidence, "$.extraction_meta.extraction_confidence", issues);
    if (!Array.isArray(em.warnings)) {
      issues.push({ path: "$.extraction_meta.warnings", message: "must be an array" });
    } else {
      em.warnings.forEach((w, i) => {
        if (typeof w !== "string") {
          issues.push({ path: `$.extraction_meta.warnings[${i}]`, message: "must be string" });
        }
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

// Curried checkers that need access to the issues array.
function checkPhoneValue(issues: ValidationIssue[]) {
  return (v: unknown, p: string) => checkPhone(v, p, issues);
}
function checkAddressValue(issues: ValidationIssue[]) {
  return (v: unknown, p: string) => checkAddress(v, p, issues);
}

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
