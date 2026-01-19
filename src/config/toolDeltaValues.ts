/**
 * Central registry for tool delta values used in value-based bidding.
 * 
 * These values represent the incremental "points" sent to Google/Meta
 * to optimize for high-engagement "Super Users".
 * 
 * Values are aligned with the Postgres `get_event_score` function.
 */

export interface ToolDeltaConfig {
  eventName: string;
  deltaValue: number;
  description: string;
}

export const TOOL_DELTA_VALUES: Record<string, ToolDeltaConfig> = {
  // Primary conversion tools (higher value)
  'quote-scanner': {
    eventName: 'quote_scanned',
    deltaValue: 25,
    description: 'User uploaded and analyzed a contractor quote',
  },
  'quote-builder': {
    eventName: 'quote_generated',
    deltaValue: 25,
    description: 'User built a custom quote and unlocked it',
  },
  'fair-price-quiz': {
    eventName: 'fair_price_quiz_completed',
    deltaValue: 20,
    description: 'User completed the fair price quiz with email capture',
  },
  'roleplay': {
    eventName: 'roleplay_completed',
    deltaValue: 20,
    description: 'User completed a sales roleplay simulation',
  },
  'expert': {
    eventName: 'expert_chat_session',
    deltaValue: 20,
    description: 'User engaged with the AI expert chat',
  },
  'evidence': {
    eventName: 'evidence_analyzed',
    deltaValue: 20,
    description: 'User analyzed evidence/documents',
  },
  'claim-survival': {
    eventName: 'document_uploaded',
    deltaValue: 20,
    description: 'User uploaded claim documents',
  },
  
  // Engagement tools (medium value)
  'intel-library': {
    eventName: 'guide_downloaded',
    deltaValue: 15,
    description: 'User unlocked a guide or resource',
  },
  'reality-check': {
    eventName: 'reality_check_completed',
    deltaValue: 15,
    description: 'User completed the reality check assessment',
  },
  'vulnerability-test': {
    eventName: 'vulnerability_test_completed',
    deltaValue: 15,
    description: 'User completed the vulnerability quiz',
  },
  'risk-diagnostic': {
    eventName: 'risk_diagnostic_completed',
    deltaValue: 15,
    description: 'User completed the risk diagnostic',
  },
  'fast-win': {
    eventName: 'fast_win_completed',
    deltaValue: 15,
    description: 'User completed the fast win detector',
  },
  'cost-calculator': {
    eventName: 'cost_calculator_completed',
    deltaValue: 15,
    description: 'User completed the cost calculator',
  },
  
  // Beat Your Quote tools
  'beat-your-quote': {
    eventName: 'beat_quote_analyzed',
    deltaValue: 25,
    description: 'User analyzed quote via Beat Your Quote',
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
  };
}

/**
 * Get just the delta value for a tool
 */
export function getToolDeltaValue(toolId: string): number {
  return getToolDeltaConfig(toolId).deltaValue;
}
