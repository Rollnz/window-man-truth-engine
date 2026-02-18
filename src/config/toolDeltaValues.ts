/**
 * Central registry for tool completion event configs (RT-only).
 * 
 * These are used by useTrackToolCompletion to fire retargeting events
 * for audience building. They carry NO value/currency.
 * 
 * OPT conversion values are hardcoded in src/lib/wmTracking.ts.
 * 
 * Tier labels are retained for internal analytics/display only.
 */

export interface ToolDeltaConfig {
  eventName: string;
  description: string;
  tier: 1 | 2 | 3 | 4 | 5;
}

export const TOOL_DELTA_VALUES: Record<string, ToolDeltaConfig> = {
  // ════════════════════════════════════════════════
  // TIER 5: REVENUE (100 pts) - "The Best"
  // ════════════════════════════════════════════════
  'sale': {
    eventName: 'sale_closed',
    description: 'Sale closed successfully',
    tier: 5,
  },
  'deposit': {
    eventName: 'deposit_received',
    description: 'Deposit received from customer',
    tier: 5,
  },

  // ════════════════════════════════════════════════
  // TIER 4: HAND RAISER (60 pts) - "Even Better"
  // ════════════════════════════════════════════════
  'consultation': {
    eventName: 'consultation_booked',
    description: 'User booked a consultation call',
    tier: 4,
  },
  'booking': {
    eventName: 'booking_confirmed',
    description: 'User confirmed a booking/appointment',
    tier: 4,
  },
  'estimate-form': {
    eventName: 'estimate_form_submitted',
    description: 'User submitted estimate request form',
    tier: 4,
  },

  // ════════════════════════════════════════════════
  // TIER 3: ENGAGED (35 pts) - "Better"
  // High-effort actions requiring work
  // ════════════════════════════════════════════════
  'quote-scanner': {
    eventName: 'quote_scanned',
    description: 'User uploaded and analyzed a contractor quote',
    tier: 3,
  },
  'quote-builder': {
    eventName: 'quote_generated',
    description: 'User built a custom quote and unlocked it',
    tier: 3,
  },
  'beat-your-quote': {
    eventName: 'beat_quote_analyzed',
    description: 'User analyzed quote via Beat Your Quote',
    tier: 3,
  },
  'sample-report': {
    eventName: 'sample_report_unlocked',
    description: 'User unlocked a sample report',
    tier: 3,
  },
  'expert': {
    eventName: 'expert_chat_session',
    description: 'User engaged with the AI expert chat',
    tier: 3,
  },
  'roleplay': {
    eventName: 'roleplay_completed',
    description: 'User completed a sales roleplay simulation',
    tier: 3,
  },
  'evidence': {
    eventName: 'evidence_analyzed',
    description: 'User analyzed evidence/documents',
    tier: 3,
  },
  'claim-survival': {
    eventName: 'document_uploaded',
    description: 'User uploaded claim documents',
    tier: 3,
  },
  'audit': {
    eventName: 'audit_completed',
    description: 'User completed the quote audit',
    tier: 3,
  },

  // ════════════════════════════════════════════════
  // TIER 2: CURIOUS (10-20 pts) - "Good"
  // Gave contact info but not ready to buy
  // ════════════════════════════════════════════════
  'fair-price-quiz': {
    eventName: 'fair_price_quiz_completed',
    description: 'User completed the fair price quiz with email capture',
    tier: 2,
  },
  'intel-library': {
    eventName: 'guide_downloaded',
    description: 'User unlocked a guide or resource',
    tier: 2,
  },
  'reality-check': {
    eventName: 'reality_check_completed',
    description: 'User completed the reality check assessment',
    tier: 2,
  },
  'vulnerability-test': {
    eventName: 'vulnerability_test_completed',
    description: 'User completed the vulnerability quiz',
    tier: 2,
  },
  'risk-diagnostic': {
    eventName: 'risk_diagnostic_completed',
    description: 'User completed the risk diagnostic',
    tier: 2,
  },
  'fast-win': {
    eventName: 'fast_win_completed',
    description: 'User completed the fast win detector',
    tier: 2,
  },
  'cost-calculator': {
    eventName: 'cost_calculator_completed',
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
    description: `User completed ${toolId}`,
    tier: 2,
  };
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
