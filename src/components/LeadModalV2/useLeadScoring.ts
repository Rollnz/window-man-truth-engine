/**
 * V2 Lead Scoring — Single source of truth
 *
 * CRITICAL: Scoring logic must ONLY live here.
 * Do not duplicate in backend, enqueue function, or anywhere else.
 *
 * Scoring spec (exact):
 *   timeline:    30days +40, 90days +30, 6months +15, research +5
 *   hasQuote:    yes +30, getting +15, no +5
 *   homeowner:   true +25, false -50
 *   windowScope: 1_5 +10, 6_15 +20, 16_plus +35, whole_house +35
 *
 * Segments:
 *   HOT     >= 100
 *   WARM    >= 70
 *   NURTURE >= 40
 *   LOW     < 40
 */

import type {
  Timeline,
  HasQuote,
  WindowScope,
  LeadSegment,
  QualificationData,
  ScoringResult,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Score Tables (exact from spec — do not modify without business approval)
// ═══════════════════════════════════════════════════════════════════════════

const TIMELINE_SCORES: Record<Timeline, number> = {
  '30days': 40,
  '90days': 30,
  '6months': 15,
  'research': 5,
};

const HAS_QUOTE_SCORES: Record<HasQuote, number> = {
  'yes': 30,
  'getting': 15,
  'no': 5,
};

const HOMEOWNER_SCORES: Record<string, number> = {
  'true': 25,
  'false': -50,
};

const WINDOW_SCOPE_SCORES: Record<WindowScope, number> = {
  '1_5': 10,
  '6_15': 20,
  '16_plus': 35,
  'whole_house': 35,
};

// ═══════════════════════════════════════════════════════════════════════════
// Segment Thresholds
// ═══════════════════════════════════════════════════════════════════════════

function getSegment(score: number): LeadSegment {
  if (score >= 100) return 'HOT';
  if (score >= 70) return 'WARM';
  if (score >= 40) return 'NURTURE';
  return 'LOW';
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate lead score from completed qualification data.
 * All fields must be non-null (call only after Step 5).
 */
export function calculateLeadScore(data: QualificationData): ScoringResult {
  let score = 0;

  if (data.timeline) {
    score += TIMELINE_SCORES[data.timeline] ?? 0;
  }

  if (data.hasQuote) {
    score += HAS_QUOTE_SCORES[data.hasQuote] ?? 0;
  }

  if (data.homeowner !== null && data.homeowner !== undefined) {
    score += HOMEOWNER_SCORES[String(data.homeowner)] ?? 0;
  }

  if (data.windowScope) {
    score += WINDOW_SCOPE_SCORES[data.windowScope] ?? 0;
  }

  const segment = getSegment(score);

  return { score, segment };
}

export { getSegment };
