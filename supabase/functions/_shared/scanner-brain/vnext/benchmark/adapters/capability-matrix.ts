// Sprint 07A — Formal capability matrix per system.
import type {
  SystemCapabilityDeclaration,
  SystemCapability,
} from "../benchmark-types.ts";

export const CAPABILITIES = {
  CLASSIFICATION: "classification",
  ENTITY_HOMEOWNER: "entity.homeowner",
  ENTITY_PROPERTY: "entity.property",
  ENTITY_CONTRACTOR: "entity.contractor",
  ENTITY_SALESPERSON: "entity.salesperson",
  ENTITY_ROLE_SEPARATION: "entity.role_separation",
  PRICING_FACTS: "pricing.commercial_facts",
  PAYMENT_SCHEDULE: "pricing.payment_schedule",
  LINE_ITEMS: "line_items",
  PRODUCT_CONFIGURATIONS: "product_configurations",
  CROSS_REFERENCES: "cross_references",
  EVIDENCE_WITH_PAGE: "evidence.page",
  CONFIDENCE: "confidence",
  STATUS_SEMANTICS: "status.found_notfound_uncertain",
  ANOMALY_PRESERVATION: "anomaly_preservation",
} as const;

export const VNEXT_CAPABILITIES: SystemCapabilityDeclaration = {
  system_id: "vnext",
  adapter_version: "v1.0.0",
  capabilities: [
    { capability: CAPABILITIES.CLASSIFICATION, state: "SUPPORTED" },
    { capability: CAPABILITIES.ENTITY_HOMEOWNER, state: "SUPPORTED" },
    { capability: CAPABILITIES.ENTITY_PROPERTY, state: "SUPPORTED" },
    { capability: CAPABILITIES.ENTITY_CONTRACTOR, state: "SUPPORTED" },
    { capability: CAPABILITIES.ENTITY_SALESPERSON, state: "SUPPORTED" },
    { capability: CAPABILITIES.ENTITY_ROLE_SEPARATION, state: "SUPPORTED" },
    { capability: CAPABILITIES.PRICING_FACTS, state: "SUPPORTED" },
    { capability: CAPABILITIES.PAYMENT_SCHEDULE, state: "SUPPORTED" },
    { capability: CAPABILITIES.LINE_ITEMS, state: "SUPPORTED" },
    { capability: CAPABILITIES.PRODUCT_CONFIGURATIONS, state: "SUPPORTED" },
    { capability: CAPABILITIES.CROSS_REFERENCES, state: "SUPPORTED" },
    { capability: CAPABILITIES.EVIDENCE_WITH_PAGE, state: "SUPPORTED" },
    { capability: CAPABILITIES.CONFIDENCE, state: "SUPPORTED" },
    { capability: CAPABILITIES.STATUS_SEMANTICS, state: "SUPPORTED" },
    { capability: CAPABILITIES.ANOMALY_PRESERVATION, state: "SUPPORTED" },
  ],
};

export const BRAIN3_CAPABILITIES: SystemCapabilityDeclaration = {
  system_id: "brain3",
  adapter_version: "v0.1.0-readonly",
  capabilities: [
    { capability: CAPABILITIES.CLASSIFICATION, state: "PARTIALLY_SUPPORTED" },
    { capability: CAPABILITIES.ENTITY_HOMEOWNER, state: "SUPPORTED" },
    { capability: CAPABILITIES.ENTITY_PROPERTY, state: "PARTIALLY_SUPPORTED" },
    { capability: CAPABILITIES.ENTITY_CONTRACTOR, state: "SUPPORTED" },
    { capability: CAPABILITIES.ENTITY_SALESPERSON, state: "UNSUPPORTED" },
    { capability: CAPABILITIES.ENTITY_ROLE_SEPARATION, state: "UNSUPPORTED" },
    { capability: CAPABILITIES.PRICING_FACTS, state: "SUPPORTED" },
    { capability: CAPABILITIES.PAYMENT_SCHEDULE, state: "PARTIALLY_SUPPORTED" },
    { capability: CAPABILITIES.LINE_ITEMS, state: "SUPPORTED" },
    { capability: CAPABILITIES.PRODUCT_CONFIGURATIONS, state: "PARTIALLY_SUPPORTED" },
    { capability: CAPABILITIES.CROSS_REFERENCES, state: "UNSUPPORTED" },
    { capability: CAPABILITIES.EVIDENCE_WITH_PAGE, state: "PARTIALLY_SUPPORTED" },
    { capability: CAPABILITIES.CONFIDENCE, state: "PARTIALLY_SUPPORTED" },
    { capability: CAPABILITIES.STATUS_SEMANTICS, state: "PARTIALLY_SUPPORTED" },
    { capability: CAPABILITIES.ANOMALY_PRESERVATION, state: "PARTIALLY_SUPPORTED" },
  ],
};

export const WMMVP_CAPABILITIES: SystemCapabilityDeclaration = {
  system_id: "wmmvp",
  adapter_version: "v0.1.0-runtime-unavailable",
  capabilities: [
    { capability: CAPABILITIES.CLASSIFICATION, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.ENTITY_HOMEOWNER, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.ENTITY_PROPERTY, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.ENTITY_CONTRACTOR, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.ENTITY_SALESPERSON, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.ENTITY_ROLE_SEPARATION, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.PRICING_FACTS, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.PAYMENT_SCHEDULE, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.LINE_ITEMS, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.PRODUCT_CONFIGURATIONS, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.CROSS_REFERENCES, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.EVIDENCE_WITH_PAGE, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.CONFIDENCE, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.STATUS_SEMANTICS, state: "RUNTIME_NOT_AVAILABLE" },
    { capability: CAPABILITIES.ANOMALY_PRESERVATION, state: "RUNTIME_NOT_AVAILABLE" },
  ],
};

export function isSystemSupported(
  decl: SystemCapabilityDeclaration,
  capability: string,
): boolean {
  const c = decl.capabilities.find((x) => x.capability === capability);
  return c?.state === "SUPPORTED" || c?.state === "PARTIALLY_SUPPORTED";
}

/**
 * Given a set of system declarations and a set of ground-truth semantic fields
 * (mapped to capability via the provided classifier), split them into:
 *  - shared: fields every system supports at least partially
 *  - expanded: per-system fields only that system supports
 */
export function partitionCapabilityScope(
  fields: string[],
  fieldToCapability: (semantic_field: string) => string,
  systems: SystemCapabilityDeclaration[],
): { shared: string[]; expanded: Record<string, string[]> } {
  const shared: string[] = [];
  const expanded: Record<string, string[]> = {};
  for (const s of systems) expanded[s.system_id] = [];
  for (const field of fields) {
    const cap = fieldToCapability(field);
    const supported = systems.filter((s) => isSystemSupported(s, cap));
    if (supported.length === systems.length) {
      shared.push(field);
    } else {
      for (const s of supported) expanded[s.system_id].push(field);
    }
  }
  return { shared, expanded };
}

export function toCapabilityByField(
  systems: SystemCapabilityDeclaration[],
  fieldToCapability: (f: string) => string,
): Record<string, Record<string, boolean>> {
  // system_id -> field -> supported
  const out: Record<string, Record<string, boolean>> = {};
  for (const s of systems) out[s.system_id] = {};
  return {
    ...out,
    __getSupport(system_id: string, field: string): boolean {
      const s = systems.find((x) => x.system_id === system_id)!;
      return isSystemSupported(s, fieldToCapability(field));
    },
    // deno-lint-ignore no-explicit-any
  } as any;
}
