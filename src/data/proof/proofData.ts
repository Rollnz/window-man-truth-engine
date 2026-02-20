// Proof Page Data - Case Studies, Transcripts, and Stats

export interface CaseStudy {
  id: string;
  county: string;
  city?: string;
  scenarioType: 'spec-substitution' | 'bundled-pricing' | 'insurance-gap' | 'energy-mismatch' | 'market-overpricing';
  lie: string;
  truth: string;
  outcome: string;
  savingsAmount?: number;
  premiumReduction?: string;
  verified: boolean;
}

export interface Transcript {
  id: string;
  topic: 'dp-rating' | 'laminated-thickness' | 'impact-rating' | 'code-compliance' | 'spec-mismatch';
  title: string;
  county: string;
  excerpt: string;
  fullTranscript: string;
  keyPhrases: string[];
  homeownerQuote?: string;
}

export interface ProofStats {
  averageOverpricing: number;
  totalSavingsIdentified: string;
  insurancePremiumReduction: string;
  avgEnergySavings: string;
}

// Live proof statistics (totalHomeowners now comes from useTickerStats)
export const proofStats: ProofStats = {
  averageOverpricing: 1847,
  totalSavingsIdentified: '$832K+',
  insurancePremiumReduction: '18-20%',
  avgEnergySavings: '15-22%',
};

// Case studies following the Lie/Truth/Outcome schema
export const caseStudies: CaseStudy[] = [
  {
    id: 'case-001',
    county: 'Miami-Dade',
    scenarioType: 'spec-substitution',
    lie: '"All impact windows are basically the same."',
    truth: 'The quoted product met code but failed ASTM performance parity. The contractor was substituting a lower-spec product that technically passed minimum requirements but offered significantly less protection.',
    outcome: 'Spec upgrade + price reduction. Net savings: $2,300',
    savingsAmount: 2300,
    verified: true,
  },
  {
    id: 'case-002',
    county: 'Broward County',
    scenarioType: 'bundled-pricing',
    lie: '"This bundle is cheaper than itemized pricing."',
    truth: 'Bundling masked inflated labor margins. When our AI broke down the quote line-by-line, labor was marked up 47% above regional averages.',
    outcome: 'Quote renegotiated. Labor reduced. Savings: $1,650',
    savingsAmount: 1650,
    verified: true,
  },
  {
    id: 'case-003',
    county: 'Palm Beach',
    scenarioType: 'insurance-gap',
    lie: '"Insurance discounts aren\'t worth worrying about."',
    truth: 'Window Man documentation triggered carrier re-rating. The homeowner\'s existing windows didn\'t qualify for wind mitigation credits, but the new installation did.',
    outcome: '19% premium reduction—year after year.',
    premiumReduction: '19%',
    verified: true,
  },
  {
    id: 'case-004',
    county: 'Fort Lauderdale',
    city: 'Fort Lauderdale',
    scenarioType: 'energy-mismatch',
    lie: '"That upgrade won\'t affect comfort."',
    truth: 'SHGC mismatch caused unnecessary HVAC load. The quoted windows had a Solar Heat Gain Coefficient of 0.40 when 0.25 was appropriate for the home\'s orientation.',
    outcome: 'Corrected spec. Measurable cooling improvement.',
    verified: true,
  },
  {
    id: 'case-005',
    county: 'Naples',
    scenarioType: 'market-overpricing',
    lie: '"This is the best price you\'ll find."',
    truth: 'Market benchmarking showed overpricing above regional norms. The quote was 23% higher than the verified market range for identical specifications.',
    outcome: 'Contractor matched verified range. Savings: $2,100',
    savingsAmount: 2100,
    verified: true,
  },
];

// AI Voice Agent transcripts
export const transcripts: Transcript[] = [
  {
    id: 'transcript-001',
    topic: 'dp-rating',
    title: 'Undersized DP Rating Flagged',
    county: 'Miami-Dade',
    excerpt: 'The AI identified that the quoted windows had a Design Pressure rating of DP35, which is below the minimum required for the homeowner\'s coastal zone.',
    fullTranscript: `Homeowner: "The contractor said these windows are hurricane-rated. Is that true?"

AI Agent: "Let me check the specifications on your quote. I see the windows listed are rated at DP35. For your location in Miami-Dade County, specifically within 1 mile of the coast, you need a minimum of DP50 to meet the High-Velocity Hurricane Zone requirements. DP35 would be insufficient for your home."

Homeowner: "So they were trying to sell me windows that wouldn't even pass inspection?"

AI Agent: "The windows would technically be 'impact-rated,' but they wouldn't meet the Design Pressure requirements for your specific zone. This is a common area of confusion—impact resistance and pressure resistance are separate specifications. I'd recommend requesting windows with at least DP50 certification for your location."`,
    keyPhrases: ['DP35 is below minimum', 'High-Velocity Hurricane Zone', 'DP50 certification'],
    homeownerQuote: 'I had no idea there was a difference between impact-rated and pressure-rated. The AI saved me from a failed inspection.',
  },
  {
    id: 'transcript-002',
    topic: 'laminated-thickness',
    title: 'Laminated Glass Thickness Explained',
    county: 'Broward County',
    excerpt: 'The homeowner was told all laminated glass is the same. The AI explained why interlayer thickness matters for actual storm protection.',
    fullTranscript: `Homeowner: "They said laminated glass is laminated glass. Does the thickness really matter?"

AI Agent: "Yes, it matters significantly. The laminated interlayer—typically PVB or SGP—is what holds the glass together during impact. A 0.030-inch interlayer provides basic protection, but for true hurricane resistance, you want at least 0.060-inch, and ideally 0.090-inch for coastal areas. The quote you have specifies 0.030-inch, which is the minimum allowable but not optimal for your exposure category."

Homeowner: "What's the price difference for the thicker interlayer?"

AI Agent: "Typically 8-12% more per unit, but the protection improvement is substantial. The thicker interlayer also provides better sound insulation and UV protection as secondary benefits."`,
    keyPhrases: ['interlayer thickness', '0.060-inch minimum', 'exposure category'],
    homeownerQuote: 'They told me this window was hurricane-approved. The AI explained—in plain English—why it technically passed code but failed real-world storm scenarios.',
  },
  {
    id: 'transcript-003',
    topic: 'impact-rating',
    title: 'Mislabeled Impact-Rated Product',
    county: 'Palm Beach',
    excerpt: 'The AI identified a product marketed as "impact-rated" that didn\'t carry the required NOA certification for the homeowner\'s jurisdiction.',
    fullTranscript: `Homeowner: "The brochure says these are impact windows. Isn't that enough?"

AI Agent: "Marketing materials can be misleading. For Miami-Dade and Broward counties, windows must have a Notice of Acceptance—an NOA number—to be legally installed. I'm not finding an NOA for the specific product line on your quote. The manufacturer may have impact-rated products, but this particular model may not be certified for your area."

Homeowner: "How do I verify this?"

AI Agent: "You can search the Miami-Dade County Product Control database using the NOA number. If the contractor can't provide one, or if the number doesn't match the product being quoted, that's a significant red flag. Would you like me to walk you through how to verify?"`,
    keyPhrases: ['NOA certification', 'Product Control database', 'marketing vs certification'],
  },
];

// Scenario type labels for filtering
export const scenarioTypeLabels: Record<CaseStudy['scenarioType'], string> = {
  'spec-substitution': 'Spec Substitution',
  'bundled-pricing': 'Bundled Pricing',
  'insurance-gap': 'Insurance Gap',
  'energy-mismatch': 'Energy Mismatch',
  'market-overpricing': 'Market Overpricing',
};

// Topic labels for transcript filtering
export const topicLabels: Record<Transcript['topic'], string> = {
  'dp-rating': 'DP Rating',
  'laminated-thickness': 'Laminated Thickness',
  'impact-rating': 'Impact Rating',
  'code-compliance': 'Code Compliance',
  'spec-mismatch': 'Spec Mismatch',
};

// County list for filtering
export const counties = [
  'Miami-Dade',
  'Broward County',
  'Palm Beach',
  'Fort Lauderdale',
  'Naples',
];
