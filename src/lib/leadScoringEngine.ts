/**
 * Lead Scoring Engine
 * 
 * Converts intent tier + data completeness into a numeric score (0-100).
 * This score drives:
 * - Sales routing (who gets called first)
 * - CRM tagging (automation)
 * - Meta optimization (value-based bidding)
 * 
 * Formula:
 * final_score = (base_score * tool_multiplier) + data_bonus + behavior_bonus
 * Clamped: 0-100
 */

import type { IntentTier } from './intentTierMapping';

export interface LeadScoringInput {
  intentTier: IntentTier;
  leadSource: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasAddress?: boolean;
  hasProjectDetails?: boolean;
  hasName?: boolean;
  behaviorBonuses?: number;
}

export interface LeadScore {
  baseScore: number;
  toolMultiplier: number;
  dataBonus: number;
  behaviorBonus: number;
  finalScore: number;
  breakdown: {
    intentTier: IntentTier;
    baseScore: number;
    toolMultiplier: number;
    dataBonus: number;
    behaviorBonus: number;
  };
}

/**
 * BASE SCORE FROM INTENT TIER
 * This is the foundation of the score.
 * 
 * Tier 1 (Curious) → 10
 * Tier 2 (Problem Aware) → 25
 * Tier 3 (Comparing) → 45
 * Tier 4 (Serious) → 70
 * Tier 5 (Buying Now) → 90
 */
export const BASE_SCORES: Record<IntentTier, number> = {
  1: 10,
  2: 25,
  3: 45,
  4: 70,
  5: 90,
};

/**
 * TOOL WEIGHT MULTIPLIERS
 * Some tools produce better buyers even within the same intent tier.
 * 
 * Ebook → 0.8 (lowest quality)
 * Risk Check → 0.9
 * Fair Price → 1.0 (baseline)
 * Quote Checker → 1.1
 * AI Scanner → 1.3
 * Booking → 1.4
 * Voice Confirmed → 1.5 (highest quality)
 */
export const TOOL_MULTIPLIERS: Record<string, number> = {
  'ebook_download': 0.8,
  'risk_check': 0.9,
  'fair_price_calc': 1.0,
  'quote_checker': 1.1,
  'ai_quote_scanner': 1.3,
  'booking_form': 1.4,
  'voice_agent': 1.5,
  'true_cost_calculator': 1.0,
  'reality_check': 0.9,
  'beat_your_quote': 1.2,
  'quote_builder': 1.1,
  'fair_price_quiz': 1.0,
  'floating_cta': 1.0,
  'estimate_form': 1.1,
};

/**
 * DATA COMPLETENESS BONUS
 * The more information they provide, the more real they are.
 * 
 * Email → +5
 * Phone → +15
 * Address → +10
 * Project Details → +10
 * Max Bonus = +40
 */
export const DATA_BONUSES = {
  email: 5,
  phone: 15,
  address: 10,
  projectDetails: 10,
  maxBonus: 40,
};

/**
 * BEHAVIOR BONUS (Optional, Advanced)
 * Can be added later for:
 * - Viewed pricing page: +10
 * - Returned visit: +10
 * - Used 2+ tools: +15
 * - Watched proof video: +10
 */

/**
 * Calculate base score from intent tier
 */
export function getBaseScore(intentTier: IntentTier): number {
  return BASE_SCORES[intentTier];
}

/**
 * Get tool multiplier (default to 1.0 if not found)
 */
export function getToolMultiplier(leadSource: string): number {
  return TOOL_MULTIPLIERS[leadSource] ?? 1.0;
}

/**
 * Calculate data completeness bonus
 */
export function calculateDataBonus(input: LeadScoringInput): number {
  let bonus = 0;

  if (input.hasEmail) bonus += DATA_BONUSES.email;
  if (input.hasPhone) bonus += DATA_BONUSES.phone;
  if (input.hasAddress) bonus += DATA_BONUSES.address;
  if (input.hasProjectDetails) bonus += DATA_BONUSES.projectDetails;

  // Cap at max bonus
  return Math.min(bonus, DATA_BONUSES.maxBonus);
}

/**
 * Calculate final lead score
 * 
 * Formula:
 * final_score = (base_score * tool_multiplier) + data_bonus + behavior_bonus
 * Clamped to 0-100
 */
export function calculateLeadScore(input: LeadScoringInput): LeadScore {
  const baseScore = getBaseScore(input.intentTier);
  const toolMultiplier = getToolMultiplier(input.leadSource);
  const dataBonus = calculateDataBonus(input);
  const behaviorBonus = input.behaviorBonuses ?? 0;

  // Calculate final score
  const rawScore = baseScore * toolMultiplier + dataBonus + behaviorBonus;
  const finalScore = Math.max(0, Math.min(100, rawScore));

  return {
    baseScore,
    toolMultiplier,
    dataBonus,
    behaviorBonus,
    finalScore,
    breakdown: {
      intentTier: input.intentTier,
      baseScore,
      toolMultiplier,
      dataBonus,
      behaviorBonus,
    },
  };
}

/**
 * Get routing action based on score
 * 
 * 0-30: Email nurture only
 * 31-60: SMS follow-up + delayed call
 * 61-80: Call within 24 hours
 * 81-95: Call within 1 hour
 * 96-100: Immediate call + priority queue
 */
export function getRoutingAction(score: number): {
  action: string;
  priority: 'nurture' | 'delayed' | 'standard' | 'urgent' | 'immediate';
  timeframe: string;
} {
  if (score >= 96) {
    return {
      action: 'Immediate call + priority queue',
      priority: 'immediate',
      timeframe: 'Now',
    };
  }
  if (score >= 81) {
    return {
      action: 'Call within 1 hour',
      priority: 'urgent',
      timeframe: '1 hour',
    };
  }
  if (score >= 61) {
    return {
      action: 'Call within 24 hours',
      priority: 'standard',
      timeframe: '24 hours',
    };
  }
  if (score >= 31) {
    return {
      action: 'SMS follow-up + delayed call',
      priority: 'delayed',
      timeframe: '3-5 days',
    };
  }
  return {
    action: 'Email nurture only',
    priority: 'nurture',
    timeframe: 'Nurture sequence',
  };
}

/**
 * Get CRM tags based on lead characteristics
 */
export function getCRMTags(input: LeadScoringInput & { finalScore: number }): string[] {
  const tags: string[] = [];

  // Intent-based tags
  if (input.intentTier === 5) tags.push('HOT');
  if (input.intentTier >= 4) tags.push('WARM');
  if (input.intentTier <= 2) tags.push('COLD');

  // Interaction-based tags
  if (input.leadSource === 'voice_agent') tags.push('VOICE_PRIORITY');
  if (input.leadSource === 'ai_quote_scanner') tags.push('SCANNER_LEAD');
  if (input.leadSource === 'booking_form') tags.push('BOOKING_CONFIRMED');

  // Score-based tags
  if (input.finalScore >= 90) tags.push('SALES_NOW');
  if (input.finalScore >= 75) tags.push('SALES_READY');
  if (input.finalScore >= 60) tags.push('SALES_QUALIFIED');

  // Data completeness tags
  if (input.hasPhone && input.hasEmail && input.hasAddress) tags.push('COMPLETE_DATA');
  if (input.hasProjectDetails) tags.push('PROJECT_DETAILS');

  return tags;
}

/**
 * Example scoring scenarios for documentation
 */
export const SCORING_EXAMPLES = {
  ebook_lead: {
    description: 'Ebook Lead - Lowest intent',
    input: {
      intentTier: 1 as IntentTier,
      leadSource: 'ebook_download',
      hasEmail: true,
      hasPhone: false,
      hasAddress: false,
      hasProjectDetails: false,
    },
    expected: 13,
    routing: 'Email nurture only',
  },
  fair_price_lead: {
    description: 'Fair Price Calculator - Mid intent',
    input: {
      intentTier: 3 as IntentTier,
      leadSource: 'fair_price_calc',
      hasEmail: true,
      hasPhone: true,
      hasAddress: true,
      hasProjectDetails: false,
    },
    expected: 75,
    routing: 'Warm sales follow-up',
  },
  scanner_upload_lead: {
    description: 'AI Scanner Upload - Extreme intent',
    input: {
      intentTier: 5 as IntentTier,
      leadSource: 'ai_quote_scanner',
      hasEmail: true,
      hasPhone: true,
      hasAddress: true,
      hasProjectDetails: true,
    },
    expected: 100,
    routing: 'Immediate call',
  },
  voice_agent_lead: {
    description: 'Voice Agent - Highest intent',
    input: {
      intentTier: 5 as IntentTier,
      leadSource: 'voice_agent',
      hasEmail: true,
      hasPhone: true,
      hasAddress: true,
      hasProjectDetails: false,
    },
    expected: 100,
    routing: 'Top priority',
  },
};
