// Sprint 07A — Versioned readiness thresholds.
// Frozen; version stamped on every run manifest and report.

export const THRESHOLD_CONFIG_VERSION = "t-v1";

export interface ThresholdConfig {
  version: string;
  critical_hallucinations_allowed_holdout: number;
  canonical_validity_min: number;
  critical_commercial_accuracy_min: number;
  entity_role_accuracy_min: number;
  overall_hallucination_rate_max: number;
  evidence_support_min: number;
  not_found_precision_min: number;
  line_item_recall_min_itemized: number;
  product_config_accuracy_min: number;
}

export const DEFAULT_THRESHOLDS: Readonly<ThresholdConfig> = Object.freeze({
  version: THRESHOLD_CONFIG_VERSION,
  critical_hallucinations_allowed_holdout: 0,
  canonical_validity_min: 0.99,
  critical_commercial_accuracy_min: 0.98,
  entity_role_accuracy_min: 0.98,
  overall_hallucination_rate_max: 0.02,
  evidence_support_min: 0.95,
  not_found_precision_min: 0.95,
  line_item_recall_min_itemized: 0.90,
  product_config_accuracy_min: 0.90,
});
