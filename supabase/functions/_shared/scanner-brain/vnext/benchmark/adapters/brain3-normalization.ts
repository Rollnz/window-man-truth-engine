// Sprint 07B.2 — Brain 3 normalization (SEPARATE from native output).
// Maps Brain 3's legacy signal model onto the benchmark's source-neutral
// semantic-field space. Purely additive: the native output is never mutated,
// and no field is invented that Brain 3 does not actually produce.
import type {
  AssertedFact,
  NormalizedSystemOutput,
} from "../benchmark-types.ts";
import type { Brain3NativeOutput } from "./brain3-safe-runner.ts";

export const BRAIN3_NORMALIZER_VERSION = "brain3-normalizer-v1.0.0";

/** Semantic fields Brain 3 can actually assert (legacy-signals-v1). */
export const BRAIN3_ASSERTABLE_FIELDS = [
  "document.classification",
  "quote.total",
  "quote.opening_count",
  "quote.deposit_percentage",
  "entity.contractor.name",
  "entity.contractor.license_number",
  "product.noa_number",
  "warranty.duration_years",
] as const;

function fact(
  semantic_field: string,
  value: unknown,
  found: boolean,
): AssertedFact {
  return {
    semantic_field,
    status: found ? "found" : "not_found",
    value: found ? value : null,
    // Brain 3 emits no evidence spans and no per-field confidence.
  };
}

export function normalizeBrain3Output(
  native: Brain3NativeOutput,
): NormalizedSystemOutput {
  const s = native.signals;
  const facts: AssertedFact[] = [
    fact(
      "document.classification",
      s.isValidQuote ? "quote" : "not_a_quote",
      true,
    ),
    fact("quote.total", s.totalPriceValue, s.totalPriceFound && s.totalPriceValue != null),
    fact("quote.opening_count", s.openingCountEstimate, s.openingCountEstimate != null),
    fact("quote.deposit_percentage", s.depositPercentage, s.depositPercentage != null),
    fact(
      "entity.contractor.name",
      native.identity.contractorName,
      !!native.identity.contractorName,
    ),
    fact(
      "entity.contractor.license_number",
      native.identity.licenseNumber,
      !!native.identity.licenseNumber,
    ),
    fact(
      "product.noa_number",
      native.identity.noaNumbers[0] ?? null,
      native.identity.noaNumbers.length > 0,
    ),
    fact(
      "warranty.duration_years",
      s.warrantyDurationYears,
      s.warrantyDurationYears != null,
    ),
  ];

  return {
    facts,
    // Brain 3 (legacy-signals-v1) produces no line items and no product
    // configurations. Declaring them empty is honest, not a defect.
    line_items: [],
    product_configurations: [],
  };
}
