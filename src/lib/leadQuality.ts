/**
 * Lead Quality Calculator
 * Calculates lead quality tiers based on engagement signals and project data
 * Used for value-based bidding and audience segmentation in GTM
 */

import type { SessionData } from '@/hooks/useSessionData';

export type LeadQuality = 'cold' | 'warm' | 'hot' | 'qualified';

export interface LeadQualityResult {
  quality: LeadQuality;
  score: number;
  signals: string[];
}

/**
 * Calculate lead quality from session data
 * Returns quality tier and the signals that contributed to the score
 */
export function calculateLeadQuality(sessionData: Partial<SessionData>): LeadQualityResult {
  let score = 0;
  const signals: string[] = [];
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Tool Engagement Signals (High Value)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Tools completed
  if (sessionData.toolsCompleted?.length) {
    const toolPoints = sessionData.toolsCompleted.length * 10;
    score += toolPoints;
    signals.push(`${sessionData.toolsCompleted.length} tools completed (+${toolPoints})`);
  }
  
  // Consultation requested (highest intent)
  if (sessionData.consultationRequested) {
    score += 50;
    signals.push('Consultation requested (+50)');
  }
  
  // Quote analysis completed
  if (sessionData.quoteAnalysisResult) {
    score += 25;
    signals.push('Quote analyzed (+25)');
  }
  
  // Fair Price Quiz completed
  if (sessionData.fairPriceQuizResults) {
    score += 20;
    signals.push('Fair Price Quiz completed (+20)');
  }
  
  // Quiz attempted
  if (sessionData.quizAttempted) {
    score += 10;
    signals.push('Quiz attempted (+10)');
  }
  
  // Risk diagnostic completed
  if (sessionData.riskDiagnosticCompleted) {
    score += 15;
    signals.push('Risk diagnostic completed (+15)');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Project Signals (Buying Intent)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Window count (larger projects = higher value)
  if (sessionData.windowCount) {
    if (sessionData.windowCount >= 15) {
      score += 25;
      signals.push('Large project: 15+ windows (+25)');
    } else if (sessionData.windowCount >= 10) {
      score += 15;
      signals.push('Medium project: 10-14 windows (+15)');
    } else if (sessionData.windowCount >= 5) {
      score += 10;
      signals.push('Small project: 5-9 windows (+10)');
    }
  }
  
  // Urgency level
  if (sessionData.urgencyLevel === 'immediate' || sessionData.urgencyLevel === 'urgent') {
    score += 25;
    signals.push('High urgency (+25)');
  } else if (sessionData.urgencyLevel === 'high') {
    score += 15;
    signals.push('Medium urgency (+15)');
  }
  
  // Has active quote (actively shopping)
  if (sessionData.fairPriceQuizResults?.quoteAmount) {
    score += 20;
    signals.push('Has active quote (+20)');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Contact Completeness Signals
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Phone number provided (high intent)
  if (sessionData.phone) {
    score += 20;
    signals.push('Phone provided (+20)');
  }
  
  // Name provided
  if (sessionData.name) {
    score += 5;
    signals.push('Name provided (+5)');
  }
  
  // Zip code provided
  if (sessionData.zipCode) {
    score += 5;
    signals.push('Zip code provided (+5)');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Score Thresholds
  // ═══════════════════════════════════════════════════════════════════════════
  
  let quality: LeadQuality;
  if (score >= 80) {
    quality = 'qualified';
  } else if (score >= 50) {
    quality = 'hot';
  } else if (score >= 25) {
    quality = 'warm';
  } else {
    quality = 'cold';
  }
  
  return { quality, score, signals };
}

/**
 * Simple quality calculation returning just the tier
 */
export function getLeadQuality(sessionData: Partial<SessionData>): LeadQuality {
  return calculateLeadQuality(sessionData).quality;
}
