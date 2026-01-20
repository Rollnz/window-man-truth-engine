/**
 * Intent Signals Derivation Engine
 * 
 * Analyzes tool usage patterns to derive what the lead cares about.
 * Provides sales reps with a "cheat sheet" before they call.
 */

import type { SourceTool } from '@/types/sourceTool';

/**
 * Intent categories that map to sales talking points
 */
export type IntentCategory = 
  | 'price' 
  | 'quality' 
  | 'insurance' 
  | 'urgency' 
  | 'negotiation'
  | 'research';

export interface IntentSignal {
  category: IntentCategory;
  label: string;
  description: string;
  /** Sales talking point */
  talkingPoint: string;
  /** Icon name from Lucide */
  icon: string;
  /** Strength: how many signals support this */
  strength: number;
}

/**
 * Tool-to-intent mapping
 * Each tool contributes to one or more intent categories
 */
const TOOL_INTENT_MAP: Record<string, { category: IntentCategory; weight: number }[]> = {
  'fair-price-quiz': [
    { category: 'price', weight: 3 },
    { category: 'research', weight: 1 },
  ],
  'quote-scanner': [
    { category: 'price', weight: 3 },
    { category: 'negotiation', weight: 2 },
  ],
  'quote-builder': [
    { category: 'price', weight: 2 },
    { category: 'research', weight: 2 },
  ],
  'cost-calculator': [
    { category: 'price', weight: 3 },
    { category: 'research', weight: 1 },
  ],
  'beat-your-quote': [
    { category: 'negotiation', weight: 3 },
    { category: 'price', weight: 2 },
  ],
  'risk-diagnostic': [
    { category: 'insurance', weight: 3 },
    { category: 'quality', weight: 2 },
  ],
  'claim-survival': [
    { category: 'insurance', weight: 3 },
    { category: 'urgency', weight: 2 },
  ],
  'reality-check': [
    { category: 'urgency', weight: 2 },
    { category: 'research', weight: 2 },
  ],
  'vulnerability-test': [
    { category: 'urgency', weight: 3 },
    { category: 'insurance', weight: 2 },
  ],
  'roleplay': [
    { category: 'negotiation', weight: 3 },
    { category: 'research', weight: 1 },
  ],
  'expert-chat': [
    { category: 'research', weight: 3 },
    { category: 'quality', weight: 1 },
  ],
  'spec-checklist': [
    { category: 'quality', weight: 3 },
    { category: 'research', weight: 2 },
  ],
  'defense-guide': [
    { category: 'negotiation', weight: 2 },
    { category: 'research', weight: 2 },
  ],
  'fast-win': [
    { category: 'urgency', weight: 2 },
    { category: 'quality', weight: 2 },
  ],
};

/**
 * Intent category metadata
 */
const INTENT_METADATA: Record<IntentCategory, { 
  label: string; 
  description: string; 
  talkingPoint: string;
  icon: string;
}> = {
  price: {
    label: 'Price-Sensitive',
    description: 'Focused on getting the best deal',
    talkingPoint: 'Emphasize value, warranty, and long-term savings. They\'ve done pricing research.',
    icon: 'DollarSign',
  },
  quality: {
    label: 'Quality-Focused',
    description: 'Concerned about specs and materials',
    talkingPoint: 'Lead with certifications, materials, and installation quality. Show spec sheets.',
    icon: 'Shield',
  },
  insurance: {
    label: 'Insurance-Motivated',
    description: 'May have a claim or storm damage',
    talkingPoint: 'Ask about recent weather events. They may have claim coverage—offer to help navigate.',
    icon: 'FileCheck',
  },
  urgency: {
    label: 'Urgent Need',
    description: 'Has a pressing reason to act',
    talkingPoint: 'Move fast. Ask what\'s driving their timeline—weather, sale, damage, or move-in date.',
    icon: 'Flame',
  },
  negotiation: {
    label: 'Ready to Negotiate',
    description: 'Has competing quotes',
    talkingPoint: 'They have other quotes. Ask to see them—you can likely match or beat.',
    icon: 'Handshake',
  },
  research: {
    label: 'Research Phase',
    description: 'Gathering information before deciding',
    talkingPoint: 'Educational approach. Provide comparison guides, don\'t hard-sell.',
    icon: 'BookOpen',
  },
};

/**
 * Derive intent signals from tool usage events
 * 
 * @param events - Array of events with event_name field
 * @returns Sorted array of intent signals (strongest first)
 */
export function deriveIntentSignals(
  events: Array<{ event_name: string; event_data?: Record<string, unknown> | null }>
): IntentSignal[] {
  // Aggregate category weights
  const categoryWeights: Record<IntentCategory, number> = {
    price: 0,
    quality: 0,
    insurance: 0,
    urgency: 0,
    negotiation: 0,
    research: 0,
  };
  
  // Process each event
  events.forEach(event => {
    const eventName = event.event_name;
    
    // Check for tool completion events (cv_ prefix or _completed suffix)
    let toolId: string | null = null;
    
    if (eventName.startsWith('cv_')) {
      // Convert cv_fair_price_quiz_completed -> fair-price-quiz
      toolId = eventName
        .replace('cv_', '')
        .replace('_completed', '')
        .replace(/_/g, '-');
    } else if (eventName.endsWith('_completed') || eventName.endsWith('_started')) {
      toolId = eventName
        .replace('_completed', '')
        .replace('_started', '')
        .replace(/_/g, '-');
    }
    
    // Also check event_data for source_tool
    if (!toolId && event.event_data && typeof event.event_data === 'object') {
      const data = event.event_data as Record<string, unknown>;
      if (typeof data.tool_id === 'string') {
        toolId = data.tool_id;
      } else if (typeof data.source_tool === 'string') {
        toolId = data.source_tool;
      }
    }
    
    if (toolId && TOOL_INTENT_MAP[toolId]) {
      TOOL_INTENT_MAP[toolId].forEach(({ category, weight }) => {
        categoryWeights[category] += weight;
      });
    }
  });
  
  // Convert to signal array, filter out zeros, sort by strength
  const signals: IntentSignal[] = (Object.entries(categoryWeights) as [IntentCategory, number][])
    .filter(([_, weight]) => weight > 0)
    .map(([category, weight]) => ({
      category,
      ...INTENT_METADATA[category],
      strength: weight,
    }))
    .sort((a, b) => b.strength - a.strength);
  
  return signals;
}

/**
 * Generate a one-liner summary for the lead
 */
export function generateIntentSummary(signals: IntentSignal[]): string {
  if (signals.length === 0) {
    return 'No clear intent signals detected yet.';
  }
  
  const topSignals = signals.slice(0, 2);
  const labels = topSignals.map(s => s.label.toLowerCase());
  
  if (labels.length === 1) {
    return `This lead is ${labels[0]}.`;
  }
  
  return `This lead is ${labels[0]} and ${labels[1]}.`;
}
