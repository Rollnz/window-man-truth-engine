// Fair Price Diagnostic Quiz Calculations - exact multipliers from document

import {
  PRICE_PER_WINDOW,
  SQFT_MULTIPLIER,
  GradeLevel,
  gradeConfig,
  RED_FLAG_OPTIONS,
} from '@/data/fairPriceQuizData';

export interface QuizAnswers {
  propertyType: string;
  sqft: string;
  windowCount: number;
  contractorFlags: string[];
  quoteAmount: number;
  quoteDate: string;
  otherQuotes: string;
}

export interface PriceAnalysis {
  quoteAmount: number;
  fairMarketValue: { low: number; high: number };
  overagePercentage: number;
  grade: GradeLevel;
  verdict: string;
  redFlagCount: number;
  redFlags: string[];
  potentialOverpay: number | null;
}

/**
 * Calculate Fair Market Value and grade the quote
 * Using exact formulas from the document
 */
export function calculatePriceAnalysis(answers: QuizAnswers): PriceAnalysis {
  const { windowCount, sqft, quoteAmount, contractorFlags } = answers;

  // Get sqft multiplier (default to 1.0 if not found)
  const sqftMultiplier = SQFT_MULTIPLIER[sqft] || 1.0;

  // Base FMV calculation using standard pricing tier
  const baseFMV = windowCount * PRICE_PER_WINDOW.standard;
  const adjustedFMV = baseFMV * sqftMultiplier;

  // FMV range with ±15% tolerance
  const fairMarketValue = {
    low: Math.round(adjustedFMV * 0.85),
    high: Math.round(adjustedFMV * 1.15),
  };

  // Calculate overage percentage against adjusted FMV
  const overagePercentage = ((quoteAmount - adjustedFMV) / adjustedFMV) * 100;

  // Identify red flags from contractor response
  const redFlags = contractorFlags.filter((flag) => RED_FLAG_OPTIONS.includes(flag));
  const redFlagCount = redFlags.length;

  // Grade assignment based on exact thresholds from document
  let grade: GradeLevel;
  let verdict: string;

  if (overagePercentage > 25) {
    grade = 'really_bad';
    verdict = gradeConfig.really_bad.verdict;
  } else if (overagePercentage > 15) {
    grade = 'bad';
    verdict = gradeConfig.bad.verdict;
  } else if (overagePercentage > 10) {
    grade = 'not_too_bad';
    verdict = gradeConfig.not_too_bad.verdict;
  } else if (overagePercentage > 5) {
    grade = 'fair';
    verdict = gradeConfig.fair.verdict;
  } else if (overagePercentage > -5) {
    grade = 'decent';
    verdict = gradeConfig.decent.verdict;
  } else if (overagePercentage > -10) {
    grade = 'good';
    verdict = gradeConfig.good.verdict;
  } else {
    grade = 'great';
    verdict = gradeConfig.great.verdict;
  }

  // Calculate potential overpay (only if quote is above FMV high)
  const potentialOverpay = quoteAmount > fairMarketValue.high
    ? quoteAmount - fairMarketValue.high
    : null;

  return {
    quoteAmount,
    fairMarketValue,
    overagePercentage: Math.abs(overagePercentage),
    grade,
    verdict,
    redFlagCount,
    redFlags,
    potentialOverpay,
  };
}

/**
 * Calculate lead score for CRM prioritization
 * Based on document's lead scoring algorithm
 */
export function calculateLeadScore(answers: QuizAnswers, hasPhone: boolean): number {
  let score = 50; // Base score

  // Quote amount scoring (higher = more revenue potential)
  if (answers.quoteAmount > 40000) score += 30;
  else if (answers.quoteAmount > 25000) score += 20;
  else if (answers.quoteAmount > 15000) score += 10;

  // Recency scoring (fresher quotes = higher intent)
  if (answers.quoteDate === 'within_last_week') score += 20;
  else if (answers.quoteDate === '1_4_weeks') score += 10;

  // Phone provided (massive intent signal)
  if (hasPhone) score += 25;

  // Multiple quotes (active research phase)
  if (answers.otherQuotes === '2_3_others') score += 15;
  else if (answers.otherQuotes === '4_plus') score += 10;

  return Math.min(score, 100);
}

/**
 * Get human-readable red flag descriptions
 */
export function getRedFlagDescriptions(redFlags: string[]): string[] {
  const descriptions: Record<string, string> = {
    best_brand: '"Best brand available" is a common pressure tactic',
    always_use: '"What they always use" limits your options',
    only_code: '"Only brand that meets code" is often misleading',
    no_mention: 'No brand discussion suggests limited transparency',
  };

  return redFlags.map((flag) => descriptions[flag] || flag);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
