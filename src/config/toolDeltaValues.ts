/**
 * Central registry for tool delta values used in value-based bidding.
 * 
 * These values represent the incremental "points" sent to Google/Meta
 * to optimize for high-engagement "Super Users".
 * 
 * VALUES ALIGNED WITH: public.get_event_score() PostgreSQL function
 * 
 * Hierarchy:
 * - Tier 5: REVENUE (100 pts) - Sale closed, deposit received
 * - Tier 4: HAND RAISER (60 pts) - Consultation, estimate request  
 * - Tier 3: ENGAGED (35 pts) - High-effort tools (scanner, audit, beat_quote)
 * - Tier 2+: CURIOUS+ (20 pts) - Lead capture (email submission)
 * - Tier 2: CURIOUS (10 pts) - Downloads, guides, quizzes
 * - Tier 1: BROWSING (1-5 pts) - Page views, tool starts
 */

export interface ToolDeltaConfig {
  eventName: string;
  deltaValue: number;
  description: string;
  tier: 1 | 2 | 3 | 4 | 5;
}

export const TOOL_DELTA_VALUES: Record<string, ToolDeltaConfig> = {
  // ════════════════════════════════════════════════
  // TIER 5: REVENUE (100 pts) - "The Best"
  // ════════════════════════════════════════════════
  'sale': {
    eventName: 'sale_closed',
    deltaValue: 100,
    description: 'Sale closed successfully',
    tier: 5,
  },
  'deposit': {
    eventName: 'deposit_received',
    deltaValue: 100,
    description: 'Deposit received from customer',
    tier: 5,
  },

  // ════════════════════════════════════════════════
  // TIER 4: HAND RAISER (60 pts) - "Even Better"
  // ════════════════════════════════════════════════
  'consultation': {
    eventName: 'consultation_booked',
    deltaValue: 60,
    description: 'User booked a consultation call',
    tier: 4,
  },
  'booking': {
    eventName: 'booking_confirmed',
    deltaValue: 60,
    description: 'User confirmed a booking/appointment',
    tier: 4,
  },
  'estimate-form': {
    eventName: 'estimate_form_submitted',
    deltaValue: 60,
    description: 'User submitted estimate request form',
    tier: 4,
  },

  // ════════════════════════════════════════════════
  // TIER 3: ENGAGED (35 pts) - "Better"
  // High-effort actions requiring work
  // ════════════════════════════════════════════════
  'quote-scanner': {
    eventName: 'quote_scanned',
    deltaValue: 35,
    description: 'User uploaded and analyzed a contractor quote',
    tier: 3,
  },
  'quote-builder': {
    eventName: 'quote_generated',
    deltaValue: 35,
    description: 'User built a custom quote and unlocked it',
    tier: 3,
  },
  'beat-your-quote': {
    eventName: 'beat_quote_analyzed',
    deltaValue: 35,
    description: 'User analyzed quote via Beat Your Quote',
    tier: 3,
  },
  'sample-report': {
    eventName: 'sample_report_unlocked',
    deltaValue: 35,
    description: 'User unlocked a sample report',
    tier: 3,
  },
  'expert': {
    eventName: 'expert_chat_session',
    deltaValue: 35,
    description: 'User engaged with the AI expert chat',
    tier: 3,
  },
  'roleplay': {
    eventName: 'roleplay_completed',
    deltaValue: 35,
    description: 'User completed a sales roleplay simulation',
    tier: 3,
  },
  'evidence': {
    eventName: 'evidence_analyzed',
    deltaValue: 35,
    description: 'User analyzed evidence/documents',
    tier: 3,
  },
  'claim-survival': {
    eventName: 'document_uploaded',
    deltaValue: 35,
    description: 'User uploaded claim documents',
    tier: 3,
  },
  'audit': {
    eventName: 'audit_completed',
    deltaValue: 35,
    description: 'User completed the quote audit',
    tier: 3,
  },

  // ════════════════════════════════════════════════
  // TIER 2: CURIOUS (10-20 pts) - "Good"
  // Gave contact info but not ready to buy
  // ════════════════════════════════════════════════
  'fair-price-quiz': {
    eventName: 'fair_price_quiz_completed',
    deltaValue: 10,
    description: 'User completed the fair price quiz with email capture',
    tier: 2,
  },
  'intel-library': {
    eventName: 'guide_downloaded',
    deltaValue: 10,
    description: 'User unlocked a guide or resource',
    tier: 2,
  },
  'reality-check': {
    eventName: 'reality_check_completed',
    deltaValue: 10,
    description: 'User completed the reality check assessment',
    tier: 2,
  },
  'vulnerability-test': {
    eventName: 'vulnerability_test_completed',
    deltaValue: 10,
    description: 'User completed the vulnerability quiz',
    tier: 2,
  },
  'risk-diagnostic': {
    eventName: 'risk_diagnostic_completed',
    deltaValue: 10,
    description: 'User completed the risk diagnostic',
    tier: 2,
  },
  'fast-win': {
    eventName: 'fast_win_completed',
    deltaValue: 10,
    description: 'User completed the fast win detector',
    tier: 2,
  },
  'cost-calculator': {
    eventName: 'cost_calculator_completed',
    deltaValue: 10,
    description: 'User completed the cost calculator',
    tier: 2,
  },
};

/**
 * Get the delta config for a tool, with fallback for unknown tools
 */
export function getToolDeltaConfig(toolId: string): ToolDeltaConfig {
  return TOOL_DELTA_VALUES[toolId] || {
    eventName: `${toolId.replace(/-/g, '_')}_completed`,
    deltaValue: 10,
    description: `User completed ${toolId}`,
    tier: 2,
  };
}

/**
 * Get just the delta value for a tool
 */
export function getToolDeltaValue(toolId: string): number {
  return getToolDeltaConfig(toolId).deltaValue;
}

/**
 * Get tier name for display purposes
 */
export function getTierName(tier: 1 | 2 | 3 | 4 | 5): string {
  switch (tier) {
    case 5: return 'Revenue';
    case 4: return 'Hand Raiser';
    case 3: return 'Engaged';
    case 2: return 'Curious';
    case 1: return 'Browsing';
  }
}
