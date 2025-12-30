// Window Comparison Engine - 10-Year True Cost Calculations

import { WindowTier } from '@/data/windowData';
import { SessionData } from '@/hooks/useSessionData';
import { convertBillRangeToNumber } from './calculations';

export interface TrueCostBreakdown {
  initialCost: number;
  totalEnergyCost: number;
  replacementCost: number;
  maintenanceCost: number;
  trueCost10Year: number;
}

/**
 * Calculate the 10-Year True Cost for a window tier based on user session data
 * 
 * Formula:
 * 10-Year True Cost = Initial Price 
 *                   + (Annual Energy × Efficiency Factor × 10 years with compound inflation)
 *                   + Replacement Cost (if lifespan < 10 years)
 *                   + Maintenance Costs
 */
export function calculateTierTrueCost(
  tier: WindowTier,
  sessionData: SessionData
): TrueCostBreakdown {
  // Get user data with sensible defaults
  const windowCount = sessionData.windowCount || 10;
  const monthlyBill = convertBillRangeToNumber(sessionData.currentEnergyBill);
  const annualEnergyCost = monthlyBill * 12;
  
  // Initial investment
  const initialCost = tier.upfrontCostPerWindow * windowCount;
  
  // Energy costs over 10 years with tier-specific efficiency & inflation
  // We assume ~30% of energy bill is affected by windows
  const windowEnergyPortion = 0.30;
  let totalEnergyCost = 0;
  
  for (let year = 1; year <= 10; year++) {
    // Base window-related energy cost affected by tier efficiency
    const baseWindowEnergyCost = annualEnergyCost * windowEnergyPortion * tier.energyEfficiencyFactor;
    // Apply compound inflation for each year
    const yearCost = baseWindowEnergyCost * Math.pow(1 + tier.annualEnergyInflation, year - 1);
    totalEnergyCost += yearCost;
  }
  
  // Replacement cost (if needed within 10 years)
  let replacementCost = 0;
  if (tier.replacementNeededInYear && tier.replacementNeededInYear <= 10) {
    // Replacement costs 20% more than original due to price increases
    replacementCost = initialCost * 1.2;
  }
  
  // Maintenance costs over 10 years
  // Tier 1 = high maintenance, Tier 3 = minimal
  const annualMaintenanceMap: Record<string, number> = {
    tier1: 150, // $150/year for repairs, seal replacements
    tier2: 75,  // $75/year average
    tier3: 25,  // $25/year minimal maintenance
  };
  const maintenanceCost = (annualMaintenanceMap[tier.id] || 100) * 10;
  
  // Total 10-year cost
  const trueCost10Year = Math.round(
    initialCost + totalEnergyCost + replacementCost + maintenanceCost
  );
  
  return {
    initialCost,
    totalEnergyCost: Math.round(totalEnergyCost),
    replacementCost,
    maintenanceCost,
    trueCost10Year,
  };
}

/**
 * Calculate upfront-only cost for a tier
 */
export function calculateUpfrontCost(tier: WindowTier, windowCount: number): number {
  return tier.upfrontCostPerWindow * windowCount;
}

/**
 * Get savings comparison between Tier 1 and Tier 3
 */
export function calculateSavingsVsCheapest(
  tier1Cost: TrueCostBreakdown,
  tier3Cost: TrueCostBreakdown
): number {
  return tier1Cost.trueCost10Year - tier3Cost.trueCost10Year;
}
