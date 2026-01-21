/**
 * Intent Tier Mapping System
 * 
 * This is the platform's core ontology for classifying buyer readiness.
 * It maps tools to intent tiers (1-5), funnel stages, and interaction types.
 * 
 * RULE: This mapping should never change unless the funnel changes.
 * It's the foundation for lead scoring, routing, and Meta optimization.
 */

export type IntentTier = 1 | 2 | 3 | 4 | 5;
export type FunnelStage = 'cold' | 'mid' | 'high';
export type InteractionType = 'download' | 'form' | 'upload' | 'booking' | 'voice';

export interface ToolIntentMapping {
  lead_source: string;
  tool_name: string;
  intent_tier: IntentTier;
  funnel_stage: FunnelStage;
  interaction_type: InteractionType;
  description: string;
}

/**
 * FINAL TOOL → INTENT TIER MAPPING
 * This is the heart of the system.
 * 
 * Intent Tier Definitions:
 * 1 = Curious / education (Not shopping)
 * 2 = Problem aware (Research phase)
 * 3 = Comparing (Shopping)
 * 4 = Serious (Near decision)
 * 5 = Buying now (Decision made)
 */
export const INTENT_TIER_MAP: Record<string, ToolIntentMapping> = {
  // Tier 1: Curious / Education
  'ebook_download': {
    lead_source: 'ebook_download',
    tool_name: 'Ebook / Guide',
    intent_tier: 1,
    funnel_stage: 'cold',
    interaction_type: 'download',
    description: 'Educational content download - lowest intent',
  },

  // Tier 2: Problem Aware
  'risk_check': {
    lead_source: 'risk_check',
    tool_name: 'Risk Check',
    intent_tier: 2,
    funnel_stage: 'cold',
    interaction_type: 'form',
    description: 'Risk assessment tool - problem awareness phase',
  },

  // Tier 3: Comparing / Shopping
  'fair_price_calc': {
    lead_source: 'fair_price_calc',
    tool_name: 'Fair Price Calculator',
    intent_tier: 3,
    funnel_stage: 'mid',
    interaction_type: 'form',
    description: 'Price comparison tool - shopping phase',
  },
  'floating_cta': {
    lead_source: 'floating_cta',
    tool_name: 'Floating CTA Estimate',
    intent_tier: 3,
    funnel_stage: 'mid',
    interaction_type: 'form',
    description: 'Floating estimate request - mid-funnel engagement',
  },

  // Tier 4: Serious / Near Decision
  'quote_checker': {
    lead_source: 'quote_checker',
    tool_name: 'Quote Checker',
    intent_tier: 4,
    funnel_stage: 'high',
    interaction_type: 'form',
    description: 'Quote analysis tool - near decision phase',
  },
  'estimate_form': {
    lead_source: 'estimate_form',
    tool_name: 'Direct Estimate Request',
    intent_tier: 4,
    funnel_stage: 'high',
    interaction_type: 'form',
    description: 'Direct estimate form - high intent',
  },

  // Tier 5: Buying Now / Decision Made
  'ai_quote_scanner': {
    lead_source: 'ai_quote_scanner',
    tool_name: 'AI Quote Scanner',
    intent_tier: 5,
    funnel_stage: 'high',
    interaction_type: 'upload',
    description: 'Quote upload analysis - extreme intent signal',
  },
  'booking_form': {
    lead_source: 'booking_form',
    tool_name: 'Booking / Calendly',
    intent_tier: 5,
    funnel_stage: 'high',
    interaction_type: 'booking',
    description: 'Calendar booking - highest intent (booking confirmed)',
  },
  'voice_agent': {
    lead_source: 'voice_agent',
    tool_name: 'Voice Agent - Estimate Confirmed',
    intent_tier: 5,
    funnel_stage: 'high',
    interaction_type: 'voice',
    description: 'Voice agent estimate confirmed - gold conversion signal',
  },

  // Additional tools
  'true_cost_calculator': {
    lead_source: 'true_cost_calculator',
    tool_name: 'True Cost Calculator',
    intent_tier: 3,
    funnel_stage: 'mid',
    interaction_type: 'form',
    description: 'Cost analysis tool - shopping phase',
  },
  'reality_check': {
    lead_source: 'reality_check',
    tool_name: 'Reality Check Quiz',
    intent_tier: 2,
    funnel_stage: 'cold',
    interaction_type: 'form',
    description: 'Educational quiz - problem awareness',
  },
  'beat_your_quote': {
    lead_source: 'beat_your_quote',
    tool_name: 'Beat Your Quote',
    intent_tier: 4,
    funnel_stage: 'high',
    interaction_type: 'upload',
    description: 'Quote comparison upload - high intent',
  },
  'quote_builder': {
    lead_source: 'quote_builder',
    tool_name: 'Quote Builder',
    intent_tier: 4,
    funnel_stage: 'high',
    interaction_type: 'form',
    description: 'Interactive quote builder - near decision',
  },
  'fair_price_quiz': {
    lead_source: 'fair_price_quiz',
    tool_name: 'Fair Price Quiz',
    intent_tier: 3,
    funnel_stage: 'mid',
    interaction_type: 'form',
    description: 'Price assessment quiz - shopping phase',
  },
};

/**
 * Get intent tier mapping by lead_source
 */
export function getIntentTierMapping(leadSource: string): ToolIntentMapping | undefined {
  return INTENT_TIER_MAP[leadSource];
}

/**
 * Get intent tier by lead_source
 */
export function getIntentTier(leadSource: string): IntentTier | undefined {
  return INTENT_TIER_MAP[leadSource]?.intent_tier;
}

/**
 * Get funnel stage by lead_source
 */
export function getFunnelStage(leadSource: string): FunnelStage | undefined {
  return INTENT_TIER_MAP[leadSource]?.funnel_stage;
}

/**
 * Get interaction type by lead_source
 */
export function getInteractionType(leadSource: string): InteractionType | undefined {
  return INTENT_TIER_MAP[leadSource]?.interaction_type;
}

/**
 * Get tool name by lead_source
 */
export function getToolName(leadSource: string): string | undefined {
  return INTENT_TIER_MAP[leadSource]?.tool_name;
}

/**
 * Intent tier descriptions for documentation
 */
export const INTENT_TIER_DESCRIPTIONS: Record<IntentTier, { meaning: string; buyerState: string }> = {
  1: { meaning: 'Curious / Education', buyerState: 'Not shopping' },
  2: { meaning: 'Problem Aware', buyerState: 'Research phase' },
  3: { meaning: 'Comparing', buyerState: 'Shopping' },
  4: { meaning: 'Serious', buyerState: 'Near decision' },
  5: { meaning: 'Buying Now', buyerState: 'Decision made' },
};
