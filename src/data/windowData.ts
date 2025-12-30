// Window Tier Data - Comparison Engine

export interface WindowTier {
  id: 'tier1' | 'tier2' | 'tier3';
  name: string;
  subtitle: string;
  upfrontCostPerWindow: number;
  energyEfficiencyFactor: number;  // Multiplier vs baseline (1.0 = average)
  annualEnergyInflation: number;   // Annual cost increase %
  estimatedLifespan: number;       // Years
  replacementNeededInYear: number | null; // Year when replacement required (within 10 years)
  uFactor: string;                 // Lower = better insulation
  shgc: string;                    // Solar Heat Gain Coefficient
  warrantyParts: string;
  warrantyLabor: string;
  securityRating: 'Basic' | 'Moderate' | 'Hurricane-Rated';
  features: string[];
  cons: string[];
  isRecommended: boolean;
}

export const windowTiers: WindowTier[] = [
  {
    id: 'tier1',
    name: "The 'Cheapest Bid'",
    subtitle: 'Vinyl/Aluminum Hybrid',
    upfrontCostPerWindow: 350,
    energyEfficiencyFactor: 1.30, // 30% worse than baseline (higher = more energy cost)
    annualEnergyInflation: 0.08,  // 8% annual increase
    estimatedLifespan: 8,
    replacementNeededInYear: 7,
    uFactor: '0.50',
    shgc: '0.40',
    warrantyParts: '5 years',
    warrantyLabor: '1 year',
    securityRating: 'Basic',
    features: [
      'Lowest upfront cost',
      'Quick availability',
      'Standard sizing',
    ],
    cons: [
      'Poor insulation',
      'High energy loss',
      'Needs replacement in ~7 years',
      'No hurricane protection',
      'Warranty gaps',
    ],
    isRecommended: false,
  },
  {
    id: 'tier2',
    name: 'Standard Impact',
    subtitle: 'Mid-Range Option',
    upfrontCostPerWindow: 650,
    energyEfficiencyFactor: 1.10, // 10% worse than baseline
    annualEnergyInflation: 0.05,  // 5% annual increase
    estimatedLifespan: 15,
    replacementNeededInYear: null, // Not within 10 years
    uFactor: '0.32',
    shgc: '0.25',
    warrantyParts: '10 years',
    warrantyLabor: '3 years',
    securityRating: 'Moderate',
    features: [
      'Impact resistant',
      'Better insulation than Tier 1',
      'Moderate energy savings',
      'Decent warranty',
    ],
    cons: [
      'Limited labor warranty',
      'May need seal repairs',
      'Not maximum efficiency',
    ],
    isRecommended: false,
  },
  {
    id: 'tier3',
    name: 'Its Window Man Standard',
    subtitle: 'High-Performance Impact',
    upfrontCostPerWindow: 850,
    energyEfficiencyFactor: 0.85, // 15% better than baseline (lower = less energy cost)
    annualEnergyInflation: 0.03,  // 3% annual increase (lowest inflation)
    estimatedLifespan: 25,
    replacementNeededInYear: null, // Never within 10 years
    uFactor: '0.24',
    shgc: '0.21',
    warrantyParts: 'Lifetime',
    warrantyLabor: 'Lifetime',
    securityRating: 'Hurricane-Rated',
    features: [
      'Maximum energy efficiency',
      'Hurricane-rated protection',
      'Lifetime warranty (parts & labor)',
      'Premium sound reduction',
      'No replacement needed',
      'Best long-term value',
    ],
    cons: [
      'Highest upfront cost',
    ],
    isRecommended: true,
  },
];

export interface ComparisonFeature {
  id: string;
  label: string;
  description?: string;
  isBetterHigher?: boolean; // For determining which tier "wins" (default: lower is better)
}

export const comparisonFeatures: ComparisonFeature[] = [
  { id: 'uFactor', label: 'Energy Rating (U-Factor)', description: 'Lower is better', isBetterHigher: false },
  { id: 'shgc', label: 'Solar Heat Gain (SHGC)', description: 'Lower is better in Florida', isBetterHigher: false },
  { id: 'estimatedLifespan', label: 'Estimated Lifespan', isBetterHigher: true },
  { id: 'warrantyParts', label: 'Warranty (Parts)' },
  { id: 'warrantyLabor', label: 'Warranty (Labor)' },
  { id: 'securityRating', label: 'Security Rating' },
  { id: 'replacementNeeded', label: 'Replacement in 10 Years?' },
];
