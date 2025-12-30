// Cost of Inaction Calculator - Calculation Utilities

export interface CalculatorInputs {
  monthlyBill: number;
  energyLossRate: number;
  windowCount: number;
  homeSize?: number;
}

export interface YearlyProjection {
  year: number;
  loss: number;
  investment: number;
  label: string;
}

export interface CostProjection {
  daily: number;
  monthly: number;
  annual: number;
  year3: number;
  year5: number;
  year10: number;
  yearlyProjections: YearlyProjection[];
  investment: {
    estimated: number;
    perWindow: number;
    windowCount: number;
  };
  breakEvenYears: number;
  netSavingsAt10Years: number;
}

// Bill range string to midpoint number
const billRangeMap: Record<string, number> = {
  '<$100': 75,
  '$100-200': 150,
  '$200-300': 250,
  '$300-400': 350,
  '$400+': 500,
};

// Window age to energy loss multiplier
const ageMultiplierMap: Record<string, number> = {
  '0-5 years': 0.15,
  '5-10 years': 0.22,
  '10-15 years': 0.28,
  '15-20 years': 0.32,
  '20+ years': 0.38,
};

/**
 * Convert bill range string to numeric midpoint value
 * Returns default of 200 for invalid/missing input
 */
export function convertBillRangeToNumber(range: string | undefined): number {
  if (!range) return 200;
  return billRangeMap[range] ?? 200;
}

/**
 * Convert window age range string to energy loss multiplier
 * Returns default of 0.30 (30% loss) for invalid/missing input
 */
export function convertAgeRangeToMultiplier(range: string | undefined): number {
  if (!range) return 0.30;
  return ageMultiplierMap[range] ?? 0.30;
}

/**
 * Format number as currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number as currency with cents
 */
export function formatCurrencyWithCents(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Main calculation function - calculates all cost projections
 * @param inputs - Validated numeric inputs (already converted from strings)
 * @returns Complete CostProjection object with losses and investment comparison
 */
export function calculateCostOfInaction(inputs: CalculatorInputs): CostProjection {
  const { monthlyBill, energyLossRate, windowCount } = inputs;
  
  // Basic waste calculations
  const monthlyWaste = monthlyBill * energyLossRate;
  const dailyWaste = monthlyWaste / 30;
  const annualWaste = monthlyWaste * 12;
  
  // Multi-year projections with compounding energy inflation (5% per year)
  const year3Loss = annualWaste * 3 * 1.05;
  const year5Loss = annualWaste * 5 * 1.08; // ~8% cumulative inflation
  const year10Loss = annualWaste * 10 * 1.15; // ~15% cumulative inflation
  
  // Investment calculation
  const perWindowCost = 850;
  const estimatedInvestment = windowCount * perWindowCost;
  
  // Break-even calculation (when cumulative losses exceed investment)
  const breakEvenYears = estimatedInvestment / annualWaste;
  
  // Net savings at 10 years (losses avoided minus investment)
  const netSavingsAt10Years = year10Loss - estimatedInvestment;
  
  // Yearly projections for chart (cumulative losses vs static investment)
  const yearlyProjections: YearlyProjection[] = [
    { year: 1, loss: annualWaste, investment: estimatedInvestment, label: 'Year 1' },
    { year: 3, loss: year3Loss, investment: estimatedInvestment, label: 'Year 3' },
    { year: 5, loss: year5Loss, investment: estimatedInvestment, label: 'Year 5' },
    { year: 10, loss: year10Loss, investment: estimatedInvestment, label: 'Year 10' },
  ];
  
  return {
    daily: dailyWaste,
    monthly: monthlyWaste,
    annual: annualWaste,
    year3: year3Loss,
    year5: year5Loss,
    year10: year10Loss,
    yearlyProjections,
    investment: {
      estimated: estimatedInvestment,
      perWindow: perWindowCost,
      windowCount,
    },
    breakEvenYears: Math.round(breakEvenYears * 10) / 10, // Round to 1 decimal
    netSavingsAt10Years,
  };
}

/**
 * Get available bill range options for the form
 */
export function getBillRangeOptions(): string[] {
  return Object.keys(billRangeMap);
}

/**
 * Get available age range options for the form
 */
export function getAgeRangeOptions(): string[] {
  return Object.keys(ageMultiplierMap);
}
