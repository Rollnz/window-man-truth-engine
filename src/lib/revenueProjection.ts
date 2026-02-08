/**
 * Revenue Projection Engine
 * 
 * Calculates projected revenue based on engagement score and lead quality.
 * Used for pre-close ROAS visibility - shows which ads bring engaged users.
 */

import type { LeadQuality } from '@/types/crm';

/**
 * Base revenue assumptions for window replacement
 * Industry average: $500-800 per window, 8-12 windows per home
 */
const BASE_WINDOW_VALUE = 600; // Conservative per-window estimate
const AVG_WINDOWS_PER_HOME = 10;
const BASE_PROJECT_VALUE = BASE_WINDOW_VALUE * AVG_WINDOWS_PER_HOME; // $6,000

/**
 * Quality multipliers - weight engagement by lead quality
 * 
 * Philosophy:
 * - "qualified" leads have validated intent, so their engagement is worth more
 * - "cold" leads might have high engagement from tire-kicking
 */
const QUALITY_MULTIPLIERS: Record<LeadQuality, number> = {
  qualified: 1.5,
  hot: 1.25,
  engaged: 1.1,
  warm: 1.0,
  curious: 0.8,
  window_shopper: 0.5,
  cold: 0.6,
};

/**
 * Score-to-probability conversion
 * 
 * Engagement score correlates with close probability:
 * - 0-25: 2-5% (browsing)
 * - 25-50: 5-10% (interested)
 * - 50-100: 10-20% (comparing)
 * - 100-150: 20-35% (ready to buy)
 * - 150+: 35-50% (super user)
 */
function scoreToProbability(score: number): number {
  if (score < 25) return 0.03;
  if (score < 50) return 0.08;
  if (score < 100) return 0.15;
  if (score < 150) return 0.28;
  return 0.42;
}

/**
 * Confidence level for the projection
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface RevenueProjection {
  /** Expected revenue (probability × value × quality) */
  projectedRevenue: number;
  /** Base project value before probability */
  baseValue: number;
  /** Close probability as percentage */
  closeProbability: number;
  /** Quality multiplier applied */
  qualityMultiplier: number;
  /** Confidence in the projection */
  confidence: ConfidenceLevel;
  /** Human-readable explanation */
  explanation: string;
}

/**
 * Calculate projected revenue for a lead
 * 
 * Formula: baseValue × closeProbability × qualityMultiplier
 * 
 * @param engagementScore - Lead's cumulative engagement score
 * @param quality - Lead quality classification
 * @param estimatedDealValue - Optional known deal value (overrides base)
 */
export function calculateRevenueProjection(
  engagementScore: number,
  quality: LeadQuality | string | null,
  estimatedDealValue?: number | null
): RevenueProjection {
  // Use estimated deal value if provided, otherwise use base
  const baseValue = estimatedDealValue && estimatedDealValue > 0 
    ? estimatedDealValue 
    : BASE_PROJECT_VALUE;
  
  // Get quality multiplier (default to warm if unknown)
  const qualityKey = (quality as LeadQuality) || 'warm';
  const qualityMultiplier = QUALITY_MULTIPLIERS[qualityKey] || 1.0;
  
  // Calculate close probability from engagement score
  const closeProbability = scoreToProbability(engagementScore);
  
  // Calculate projected revenue
  const projectedRevenue = Math.round(baseValue * closeProbability * qualityMultiplier);
  
  // Determine confidence level
  let confidence: ConfidenceLevel;
  if (engagementScore >= 100 && estimatedDealValue) {
    confidence = 'high';
  } else if (engagementScore >= 50 || estimatedDealValue) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  // Generate explanation
  const probabilityPercent = Math.round(closeProbability * 100);
  const explanation = `${probabilityPercent}% close rate × $${baseValue.toLocaleString()} × ${qualityMultiplier}x quality`;
  
  return {
    projectedRevenue,
    baseValue,
    closeProbability,
    qualityMultiplier,
    confidence,
    explanation,
  };
}

/**
 * Get revenue projection tier for display
 */
export function getRevenueTier(projectedRevenue: number): {
  tier: 'high' | 'medium' | 'low';
  color: string;
} {
  if (projectedRevenue >= 2500) {
    return { tier: 'high', color: 'text-green-600 dark:text-green-400' };
  } else if (projectedRevenue >= 1000) {
    return { tier: 'medium', color: 'text-amber-600 dark:text-amber-400' };
  }
  return { tier: 'low', color: 'text-muted-foreground' };
}
