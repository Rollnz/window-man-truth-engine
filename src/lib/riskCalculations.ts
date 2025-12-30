import { riskCategories, RiskCategory } from '@/data/riskDiagnosticData';

export interface CategoryScore {
  score: number;
  maxPossible: number;
  percentage: number;
  protectionPercentage: number;
}

export interface RiskScoreBreakdown {
  storm: CategoryScore;
  security: CategoryScore;
  insurance: CategoryScore;
  warranty: CategoryScore;
  overallRiskScore: number;
  protectionScore: number;
}

export interface InsuranceSavingsResult {
  estimatedAnnualPremium: number;
  potentialAnnualSavings: number;
  savingsOver10Years: number;
  discountPercentage: number;
  isAlreadyReceivingDiscount: boolean;
}

export interface RiskAnswers {
  [questionId: string]: string;
}

// Calculate max possible risk score for a category
function getMaxRiskForCategory(category: RiskCategory): number {
  return category.questions.reduce((sum, q) => {
    const maxOptionScore = Math.max(...q.options.map(o => o.riskScore));
    return sum + maxOptionScore;
  }, 0);
}

// Calculate actual risk score for a category based on answers
function getCategoryRiskScore(category: RiskCategory, answers: RiskAnswers): number {
  return category.questions.reduce((sum, q) => {
    const answer = answers[q.id];
    if (!answer) {
      // If unanswered, assume moderate risk
      const scores = q.options.map(o => o.riskScore);
      return sum + scores[Math.floor(scores.length / 2)];
    }
    const option = q.options.find(o => o.value === answer);
    return sum + (option?.riskScore || 0);
  }, 0);
}

// Main calculation function
export function calculateRiskScores(answers: RiskAnswers): RiskScoreBreakdown {
  const categoryScores: Record<string, CategoryScore> = {};

  for (const category of riskCategories) {
    const score = getCategoryRiskScore(category, answers);
    const maxPossible = getMaxRiskForCategory(category);
    const percentage = maxPossible > 0 ? (score / maxPossible) * 100 : 0;
    const protectionPercentage = 100 - percentage;

    categoryScores[category.id] = {
      score,
      maxPossible,
      percentage,
      protectionPercentage,
    };
  }

  // Calculate weighted overall risk score
  let weightedRiskScore = 0;
  for (const category of riskCategories) {
    const catScore = categoryScores[category.id];
    weightedRiskScore += catScore.percentage * category.weight;
  }

  const overallRiskScore = Math.round(weightedRiskScore);
  const protectionScore = 100 - overallRiskScore;

  return {
    storm: categoryScores['storm'],
    security: categoryScores['security'],
    insurance: categoryScores['insurance'],
    warranty: categoryScores['warranty'],
    overallRiskScore,
    protectionScore,
  };
}

// Florida insurance premium estimator
export function estimateInsurancePremium(homeSize: number, zipCode?: string): number {
  // Florida average homeowner's insurance: ~$4,200/year for average home
  // Base rate: approximately $2.10 per sq ft
  const baseRatePerSqFt = 2.10;
  let basePremium = homeSize * baseRatePerSqFt;

  // Coastal adjustment based on zip code (simplified)
  // Coastal Florida zips typically start with 320-329, 330-339, 344-349
  if (zipCode) {
    const zipPrefix = zipCode.substring(0, 3);
    const coastalPrefixes = ['320', '321', '322', '323', '324', '325', '326', '327', '328', '329',
                             '330', '331', '332', '333', '334', '335', '336', '337', '338', '339',
                             '344', '345', '346', '347', '348', '349'];
    if (coastalPrefixes.includes(zipPrefix)) {
      basePremium *= 1.20; // 20% higher for coastal areas
    }
  }

  // Minimum premium floor
  return Math.max(Math.round(basePremium), 2500);
}

// Calculate potential insurance savings
export function calculateInsuranceSavings(
  homeSize: number,
  hasImpactDiscount: boolean,
  zipCode?: string
): InsuranceSavingsResult {
  const annualPremium = estimateInsurancePremium(homeSize, zipCode);

  // Impact windows typically provide 15-25% discount
  const discountRate = 0.20; // 20% average
  const potentialSavings = hasImpactDiscount ? 0 : Math.round(annualPremium * discountRate);
  const savingsOver10Years = potentialSavings * 10;

  return {
    estimatedAnnualPremium: annualPremium,
    potentialAnnualSavings: potentialSavings,
    savingsOver10Years,
    discountPercentage: discountRate * 100,
    isAlreadyReceivingDiscount: hasImpactDiscount,
  };
}

// Generate action items based on scores
export function generateActionItems(breakdown: RiskScoreBreakdown): string[] {
  const items: { priority: number; text: string }[] = [];

  // Storm protection
  if (breakdown.storm.protectionPercentage < 50) {
    items.push({ priority: 1, text: 'Upgrade to hurricane-rated impact windows' });
  } else if (breakdown.storm.protectionPercentage < 75) {
    items.push({ priority: 2, text: 'Complete your storm protection with remaining windows' });
  }

  // Security
  if (breakdown.security.protectionPercentage < 50) {
    items.push({ priority: 1, text: 'Install impact-rated windows with multi-point locks' });
  } else if (breakdown.security.protectionPercentage < 75) {
    items.push({ priority: 3, text: 'Upgrade ground-floor windows with enhanced security' });
  }

  // Insurance
  if (breakdown.insurance.protectionPercentage < 50) {
    items.push({ priority: 1, text: 'Schedule a wind mitigation inspection to unlock discounts' });
  } else if (breakdown.insurance.protectionPercentage < 75) {
    items.push({ priority: 2, text: 'Update your insurance policy to capture impact window discounts' });
  }

  // Warranty
  if (breakdown.warranty.protectionPercentage < 50) {
    items.push({ priority: 2, text: 'Replace windows with products that include lifetime labor warranty' });
  } else if (breakdown.warranty.protectionPercentage < 75) {
    items.push({ priority: 3, text: 'Review your warranty documentation for gaps' });
  }

  // Sort by priority and return top 3
  return items
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(item => item.text);
}

// Get protection level label
export function getProtectionLevel(percentage: number): 'High' | 'Moderate' | 'Low' | 'Critical' {
  if (percentage >= 75) return 'High';
  if (percentage >= 50) return 'Moderate';
  if (percentage >= 25) return 'Low';
  return 'Critical';
}

// Get protection level color class
export function getProtectionLevelColor(percentage: number): string {
  if (percentage >= 75) return 'text-green-400';
  if (percentage >= 50) return 'text-yellow-400';
  if (percentage >= 25) return 'text-orange-400';
  return 'text-red-400';
}
