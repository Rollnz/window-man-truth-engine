/**
 * PreQuoteLeadModalV2 Types
 *
 * Central type definitions for the multi-step qualification flow.
 * All enum-like values are strict union types to prevent drift.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Step Machine
// ═══════════════════════════════════════════════════════════════════════════

export type StepType =
  | 'capture'
  | 'timeline'
  | 'quote'
  | 'homeowner'
  | 'windowCount'
  | 'result';

export const STEP_ORDER: StepType[] = [
  'capture',
  'timeline',
  'quote',
  'homeowner',
  'windowCount',
  'result',
];

/** Steps 1-5 (before result) */
export const QUALIFICATION_STEPS: StepType[] = [
  'capture',
  'timeline',
  'quote',
  'homeowner',
  'windowCount',
];

// ═══════════════════════════════════════════════════════════════════════════
// Qualification Data (enum values must match DB column values exactly)
// ═══════════════════════════════════════════════════════════════════════════

export type Timeline = '30days' | '90days' | '6months' | 'research';
export type HasQuote = 'yes' | 'getting' | 'no';
export type WindowScope = '1_5' | '6_15' | '16_plus' | 'whole_house';
export type LeadSegment = 'HOT' | 'WARM' | 'NURTURE' | 'LOW';

export interface QualificationData {
  timeline: Timeline | null;
  hasQuote: HasQuote | null;
  homeowner: boolean | null;
  windowScope: WindowScope | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Scoring
// ═══════════════════════════════════════════════════════════════════════════

export interface ScoringResult {
  score: number;
  segment: LeadSegment;
}

// ═══════════════════════════════════════════════════════════════════════════
// Contact Data (Step 1)
// ═══════════════════════════════════════════════════════════════════════════

export interface ContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ContactFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Modal Props
// ═══════════════════════════════════════════════════════════════════════════

export interface PreQuoteLeadModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (leadId: string) => void;
  /** CTA source for attribution, e.g. 'audit_sample_audit', 'scanner_download_sample' */
  ctaSource?: string;
  /** Override source_page (defaults to window.location.pathname) */
  sourcePage?: string;
  /** Context key used for analytics + CTA segmentation (Homepage, Service Page, Exit Intent, etc.). */
  contextKey?: string;
  /** Optional per-context behavior overrides so one modal can be reused across pages without forks. */
  contextConfig?: Partial<PreQuoteLeadModalContextConfig>;
  /** Hide modal globally in the current browser session after a successful completion. */
  hideAfterCompletion?: boolean;
}

export interface PreQuoteLeadModalContextConfig {
  /** Source tool sent to save-lead + qualification patch */
  sourceTool: string;
  /** Source tool used by browser GTM events */
  trackingSourceTool: string;
  /** Conversion action label for lead_capture event */
  conversionAction: string;
  /** Lead conversion value for lead_submission_success */
  leadValue: number;
}

export const DEFAULT_PREQUOTE_CONTEXT: PreQuoteLeadModalContextConfig = {
  sourceTool: 'sample-report',
  trackingSourceTool: 'sample_report',
  conversionAction: 'prequote_v2_signup',
  leadValue: 75,
};

// ═══════════════════════════════════════════════════════════════════════════
// V2 Source Tool naming for phone dispatch
// ═══════════════════════════════════════════════════════════════════════════

export type V2PhoneSourceTool =
  | 'prequote-v2:sample-report'
  | 'prequote-v2:audit'
  | 'prequote-v2:ai-scanner-sample';

/**
 * Map ctaSource values to phone dispatch source_tool names.
 * Falls back to 'prequote-v2:sample-report' for unknown sources.
 */
export function getV2PhoneSourceTool(ctaSource: string): V2PhoneSourceTool {
  const map: Record<string, V2PhoneSourceTool> = {
    'audit_sample_audit': 'prequote-v2:audit',
    'audit': 'prequote-v2:audit',
    'scanner_download_sample': 'prequote-v2:ai-scanner-sample',
    'ai-scanner': 'prequote-v2:ai-scanner-sample',
  };
  return map[ctaSource] || 'prequote-v2:sample-report';
}
