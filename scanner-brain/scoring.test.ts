import { describe, it, expect } from 'vitest';
import {
  scoreFromSignals,
  calculateLetterGrade,
  generateSafePreview,
  generateForensicSummary,
  extractIdentity,
  DEFAULT_WEIGHTS,
} from './index';
import type { ExtractionSignals } from './schema';
import type { PillarWeights } from './scoring';

// ═══════════════════════════════════════════════════════════════════════════
// BASE FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

/** A "perfect" quote — all signals positive */
const GOOD_QUOTE: ExtractionSignals = {
  isValidQuote: true,
  validityReason: 'Valid window replacement proposal',
  totalPriceFound: true,
  totalPriceValue: 15000,
  openingCountEstimate: 10,
  hasComplianceKeyword: true,
  hasComplianceIdentifier: true,
  hasNOANumber: true,
  noaNumberValue: 'NOA-21-1234.56',
  hasLaminatedMention: true,
  hasGlassBuildDetail: true,
  hasTemperedOnlyRisk: false,
  hasNonImpactLanguage: false,
  licenseNumberPresent: true,
  licenseNumberValue: 'CGC1234567',
  hasOwnerBuilderLanguage: false,
  contractorNameExtracted: 'Acme Windows LLC',
  hasPermitMention: true,
  hasDemoInstallDetail: true,
  hasSpecificMaterials: true,
  hasWallRepairMention: true,
  hasFinishDetail: true,
  hasCleanupMention: true,
  hasBrandClarity: true,
  hasDetailedScope: true,
  hasSubjectToChange: false,
  hasRepairsExcluded: false,
  hasStandardInstallation: false,
  depositPercentage: 20,
  hasFinalPaymentTrap: false,
  hasSafePaymentTerms: true,
  hasPaymentBeforeCompletion: false,
  hasContractTraps: false,
  contractTrapsList: [],
  hasManagerDiscount: false,
  hasWarrantyMention: true,
  hasLaborWarranty: true,
  warrantyDurationYears: 10,
  hasLifetimeWarranty: true,
  hasTransferableWarranty: true,
  hasPremiumIndicators: false,
};

/** Worst-case predatory quote */
const BAD_QUOTE: ExtractionSignals = {
  isValidQuote: true,
  validityReason: 'Appears to be a window quote',
  totalPriceFound: true,
  totalPriceValue: 25000,
  openingCountEstimate: 5,
  hasComplianceKeyword: false,
  hasComplianceIdentifier: false,
  hasNOANumber: false,
  noaNumberValue: null,
  hasLaminatedMention: false,
  hasGlassBuildDetail: false,
  hasTemperedOnlyRisk: true,
  hasNonImpactLanguage: true,
  licenseNumberPresent: false,
  licenseNumberValue: null,
  hasOwnerBuilderLanguage: false,
  contractorNameExtracted: null,
  hasPermitMention: false,
  hasDemoInstallDetail: false,
  hasSpecificMaterials: false,
  hasWallRepairMention: false,
  hasFinishDetail: false,
  hasCleanupMention: false,
  hasBrandClarity: false,
  hasDetailedScope: false,
  hasSubjectToChange: true,
  hasRepairsExcluded: true,
  hasStandardInstallation: true,
  depositPercentage: 60,
  hasFinalPaymentTrap: true,
  hasSafePaymentTerms: false,
  hasPaymentBeforeCompletion: true,
  hasContractTraps: true,
  contractTrapsList: ['arbitration clause', 'lien waiver', 'cancellation penalty'],
  hasManagerDiscount: true,
  hasWarrantyMention: false,
  hasLaborWarranty: false,
  warrantyDurationYears: null,
  hasLifetimeWarranty: false,
  hasTransferableWarranty: false,
  hasPremiumIndicators: false,
};

const INVALID_DOC: ExtractionSignals = {
  ...GOOD_QUOTE,
  isValidQuote: false,
  validityReason: 'This is a grocery receipt',
};

/** Helper: clone GOOD_QUOTE with overrides */
function q(overrides: Partial<ExtractionSignals>): ExtractionSignals {
  return { ...GOOD_QUOTE, ...overrides };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. HAPPY / SAD PATH BASICS
// ═══════════════════════════════════════════════════════════════════════════

describe('scoreFromSignals — basic paths', () => {
  it('good quote → high grade, no hard cap', () => {
    const r = scoreFromSignals(GOOD_QUOTE, null);
    expect(r.hardCap.applied).toBe(false);
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
    expect(r.finalGrade).toMatch(/^[AB]/);
    expect(r.pricePerOpening).toBe('$1,500');
  });

  it('bad quote → capped at 25 (missing license)', () => {
    const r = scoreFromSignals(BAD_QUOTE, null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(25);
    expect(r.hardCap.statute).toBe('F.S. 489.119');
    expect(r.overallScore).toBeLessThanOrEqual(25);
    expect(r.finalGrade).toBe('F');
  });

  it('invalid document → score 0, grade F', () => {
    const r = scoreFromSignals(INVALID_DOC, null);
    expect(r.overallScore).toBe(0);
    expect(r.finalGrade).toBe('F');
    expect(r.warnings).toContain(
      'Not a window/door quote. Upload a contractor proposal/estimate for windows/doors.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. HARD CAP EDGE CASES — FLORIDA STATUTE ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════

describe('hard caps — Florida statute enforcement', () => {
  it('F.S. 489.119: missing license → cap 25', () => {
    const r = scoreFromSignals(q({ licenseNumberPresent: false, licenseNumberValue: null }), null);
    expect(r.hardCap.ceiling).toBe(25);
    expect(r.hardCap.statute).toBe('F.S. 489.119');
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it('F.S. 489.103: owner-builder language → cap 25', () => {
    const r = scoreFromSignals(q({ hasOwnerBuilderLanguage: true }), null);
    expect(r.hardCap.ceiling).toBe(25);
    expect(r.hardCap.statute).toBe('F.S. 489.103');
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it('F.S. 501.137: deposit 51% → cap 55', () => {
    const r = scoreFromSignals(q({ depositPercentage: 51 }), null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(55);
    expect(r.hardCap.statute).toBe('F.S. 501.137');
  });

  it('deposit exactly 50% → NO cap', () => {
    const r = scoreFromSignals(q({ depositPercentage: 50 }), null);
    // 50% is NOT > 50, so no deposit cap
    expect(r.hardCap.statute).not.toBe('F.S. 501.137');
  });

  it('F.S. 489.126: payment before completion → cap 40', () => {
    const r = scoreFromSignals(q({ hasPaymentBeforeCompletion: true }), null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(40);
    expect(r.hardCap.statute).toBe('F.S. 489.126');
  });

  it('tempered-only without laminated → cap 30', () => {
    const r = scoreFromSignals(q({ hasTemperedOnlyRisk: true, hasLaminatedMention: false }), null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(30);
  });

  it('tempered-only WITH laminated → no tempered cap', () => {
    const r = scoreFromSignals(q({ hasTemperedOnlyRisk: true, hasLaminatedMention: true }), null);
    // Tempered cap requires !hasLaminatedMention
    expect(r.hardCap.ceiling).toBeGreaterThan(30);
  });

  it('multiple caps → lowest ceiling wins (no license 25 beats deposit 55)', () => {
    const r = scoreFromSignals(q({
      licenseNumberPresent: false,
      depositPercentage: 60,
    }), null);
    expect(r.hardCap.ceiling).toBe(25);
    expect(r.hardCap.statute).toBe('F.S. 489.119');
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it('multiple caps → lowest ceiling wins (tempered 30 beats payment 40)', () => {
    const r = scoreFromSignals(q({
      hasTemperedOnlyRisk: true,
      hasLaminatedMention: false,
      hasPaymentBeforeCompletion: true,
    }), null);
    expect(r.hardCap.ceiling).toBe(30);
    expect(r.overallScore).toBeLessThanOrEqual(30);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. PRICE PER OPENING CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe('price per opening', () => {
  it('computes correctly: $15000 / 10 = $1,500', () => {
    const r = scoreFromSignals(GOOD_QUOTE, null);
    expect(r.pricePerOpening).toBe('$1,500');
  });

  it('rounds to nearest $50: $15000 / 7 ≈ $2,143 → $2,150', () => {
    const r = scoreFromSignals(q({ openingCountEstimate: 7 }), null);
    expect(r.pricePerOpening).toBe('$2,150');
  });

  it('no price found → N/A', () => {
    const r = scoreFromSignals(q({ totalPriceFound: false, totalPriceValue: null }), null);
    expect(r.pricePerOpening).toBe('N/A');
  });

  it('no opening count → N/A', () => {
    const r = scoreFromSignals(q({ openingCountEstimate: null }), null);
    expect(r.pricePerOpening).toBe('N/A');
  });

  it('zero openings → N/A (no division by zero)', () => {
    const r = scoreFromSignals(q({ openingCountEstimate: 0 }), null);
    expect(r.pricePerOpening).toBe('N/A');
  });

  it('openingCountHint fallback when estimate is null', () => {
    const r = scoreFromSignals(q({ openingCountEstimate: null }), 10);
    expect(r.pricePerOpening).toBe('$1,500');
  });

  it('estimate takes precedence over hint', () => {
    const r = scoreFromSignals(q({ openingCountEstimate: 5 }), 10);
    // $15000 / 5 = $3000
    expect(r.pricePerOpening).toBe('$3,000');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. PRICE SCORE BRACKETS
// ═══════════════════════════════════════════════════════════════════════════

describe('price score brackets', () => {
  const priceQuote = (total: number, openings: number, premium = false) =>
    q({ totalPriceValue: total, openingCountEstimate: openings, hasPremiumIndicators: premium });

  it('< $1000/opening → priceScore 40', () => {
    const r = scoreFromSignals(priceQuote(9000, 10), null); // $900/opening
    expect(r.priceScore).toBe(40);
  });

  it('$1000–$1199 → priceScore 65', () => {
    const r = scoreFromSignals(priceQuote(11000, 10), null); // $1100 → rounds to $1100
    expect(r.priceScore).toBe(65);
  });

  it('$1200–$1800 sweet spot → priceScore 95', () => {
    const r = scoreFromSignals(priceQuote(15000, 10), null); // $1500
    expect(r.priceScore).toBe(95);
  });

  it('$1801–$2500 → priceScore 75', () => {
    const r = scoreFromSignals(priceQuote(20000, 10), null); // $2000
    expect(r.priceScore).toBe(75);
  });

  it('> $2500 → priceScore 55', () => {
    const r = scoreFromSignals(priceQuote(30000, 10), null); // $3000
    expect(r.priceScore).toBe(55);
  });

  it('> $2500 with premium indicators → priceScore 65', () => {
    const r = scoreFromSignals(priceQuote(30000, 10, true), null);
    expect(r.priceScore).toBe(65);
  });

  it('no price data → priceScore 40 (default)', () => {
    const r = scoreFromSignals(q({ totalPriceFound: false, totalPriceValue: null }), null);
    expect(r.priceScore).toBe(40);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. CURVE FUNCTION — A+ MUST BE RARE
// ═══════════════════════════════════════════════════════════════════════════

describe('score curving', () => {
  it('score ≤ 70 → unchanged', () => {
    // Force a low raw overall by zeroing out all pillars except price
    const r = scoreFromSignals(q({
      hasComplianceKeyword: false, hasComplianceIdentifier: false,
      hasLaminatedMention: false, hasGlassBuildDetail: false,
      hasPermitMention: false, hasDemoInstallDetail: false,
      hasSpecificMaterials: false, hasWallRepairMention: false,
      hasFinishDetail: false, hasCleanupMention: false, hasBrandClarity: false,
      hasWarrantyMention: false, hasLaborWarranty: false,
      warrantyDurationYears: null, hasLifetimeWarranty: false, hasTransferableWarranty: false,
    }), null);
    // With most pillars near 0, raw overall should be well below 70
    expect(r.overallScore).toBeLessThanOrEqual(70);
  });

  it('good quote raw > 70 → curved below raw', () => {
    // Good quote has high raw score. Curve compresses above 70.
    const r = scoreFromSignals(GOOD_QUOTE, null);
    // The overallScore should be less than what a simple weighted average would give
    // (all pillars near 85-100 → weighted ~90+ raw → curved down)
    expect(r.overallScore).toBeLessThan(100);
    expect(r.overallScore).toBeGreaterThanOrEqual(80); // still good, just curved
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. CUSTOM WEIGHTS (Dynamic Weight Injection)
// ═══════════════════════════════════════════════════════════════════════════

describe('custom weights', () => {
  it('safety-only weight → overall ≈ safety score (before curve)', () => {
    const safetyOnly: PillarWeights = { safety: 1.0, scope: 0, price: 0, finePrint: 0, warranty: 0 };
    const r = scoreFromSignals(GOOD_QUOTE, null, safetyOnly);
    // Safety score for GOOD_QUOTE: compliance(25) + identifier(25) + laminated(25) + glassBuild(10) = 85
    // Curve(85) = 70 + 30 * ((15/30)^1.8) ≈ 70 + 30 * 0.287 ≈ 79
    expect(r.overallScore).toBeGreaterThanOrEqual(75);
    expect(r.overallScore).toBeLessThanOrEqual(85);
  });

  it('default weights sum to 1.0', () => {
    const sum = DEFAULT_WEIGHTS.safety + DEFAULT_WEIGHTS.scope + DEFAULT_WEIGHTS.price +
      DEFAULT_WEIGHTS.finePrint + DEFAULT_WEIGHTS.warranty;
    expect(sum).toBeCloseTo(1.0, 5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. WARNING & MISSING ITEM CAPS
// ═══════════════════════════════════════════════════════════════════════════

describe('output caps', () => {
  it('warnings capped at 6 items', () => {
    // BAD_QUOTE triggers many warnings
    const r = scoreFromSignals(BAD_QUOTE, null);
    expect(r.warnings.length).toBeLessThanOrEqual(6);
  });

  it('missing items capped at 6', () => {
    const r = scoreFromSignals(BAD_QUOTE, null);
    expect(r.missingItems.length).toBeLessThanOrEqual(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe('penalties', () => {
  it('"Standard Installation" → -10 to scope + warning', () => {
    const without = scoreFromSignals(GOOD_QUOTE, null);
    const with_ = scoreFromSignals(q({ hasStandardInstallation: true }), null);
    expect(with_.scopeScore).toBe(without.scopeScore - 10);
    expect(with_.warnings.some(w => w.includes('Standard installation'))).toBe(true);
  });

  it('"Manager Discount" → -15 to fine print + warning', () => {
    const without = scoreFromSignals(GOOD_QUOTE, null);
    const with_ = scoreFromSignals(q({ hasManagerDiscount: true }), null);
    expect(with_.finePrintScore).toBe(without.finePrintScore - 15);
    expect(with_.warnings.some(w => w.includes('manager discount'))).toBe(true);
  });

  it('"Subject to Change" → -30 to scope + warning', () => {
    const without = scoreFromSignals(GOOD_QUOTE, null);
    const with_ = scoreFromSignals(q({ hasSubjectToChange: true }), null);
    expect(with_.scopeScore).toBe(Math.max(without.scopeScore - 30, 0));
    expect(with_.warnings.some(w => w.includes('Subject to remeasure'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. LETTER GRADE BOUNDARIES (all 14 brackets)
// ═══════════════════════════════════════════════════════════════════════════

describe('calculateLetterGrade boundaries', () => {
  it.each([
    [100, 'A+'], [97, 'A+'], [96, 'A'], [93, 'A'], [92, 'A-'], [90, 'A-'],
    [89, 'B+'], [87, 'B+'], [86, 'B'], [83, 'B'], [82, 'B-'], [80, 'B-'],
    [79, 'C+'], [77, 'C+'], [76, 'C'], [73, 'C'], [72, 'C-'], [70, 'C-'],
    [69, 'D+'], [67, 'D+'], [66, 'D'], [63, 'D'], [62, 'D-'], [60, 'D-'],
    [59, 'F'], [30, 'F'], [0, 'F'],
  ])('score %i → %s', (score, grade) => {
    expect(calculateLetterGrade(score)).toBe(grade);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. SAFE PREVIEW — RISK LEVEL BOUNDARIES
// ═══════════════════════════════════════════════════════════════════════════

describe('generateSafePreview', () => {
  it('good quote → acceptable, no critical cap', () => {
    const scored = scoreFromSignals(GOOD_QUOTE, null);
    const preview = generateSafePreview(scored);
    expect(preview.riskLevel).toBe('acceptable');
    expect(preview.hasCriticalCap).toBe(false);
    expect(preview.grade).toBe(scored.finalGrade);
  });

  it('bad quote → critical, has critical cap', () => {
    const scored = scoreFromSignals(BAD_QUOTE, null);
    const preview = generateSafePreview(scored);
    expect(preview.riskLevel).toBe('critical');
    expect(preview.hasCriticalCap).toBe(true);
  });

  it('hasCriticalCap only true when cap ceiling ≤ 30', () => {
    // Deposit cap = 55 → not critical
    const scored = scoreFromSignals(q({ depositPercentage: 60 }), null);
    const preview = generateSafePreview(scored);
    expect(preview.hasCriticalCap).toBe(false);
  });

  it('tempered-only cap at 30 → hasCriticalCap true', () => {
    const scored = scoreFromSignals(q({
      hasTemperedOnlyRisk: true, hasLaminatedMention: false,
    }), null);
    const preview = generateSafePreview(scored);
    expect(preview.hasCriticalCap).toBe(true);
    expect(preview.riskLevel).toBe('critical');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. FORENSIC SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

describe('generateForensicSummary', () => {
  it('bad quote: cites F.S. 489.119, generates questions', () => {
    const scored = scoreFromSignals(BAD_QUOTE, null);
    const f = generateForensicSummary(BAD_QUOTE, scored);
    expect(f.riskLevel).toBe('critical');
    expect(f.hardCapApplied).toBe(true);
    expect(f.statuteCitations.some(c => c.includes('F.S. 489.119'))).toBe(true);
    expect(f.questionsToAsk.length).toBeGreaterThan(0);
    expect(f.positiveFindings).toHaveLength(0); // score < 60
  });

  it('good quote: lists positive findings', () => {
    const scored = scoreFromSignals(GOOD_QUOTE, null);
    const f = generateForensicSummary(GOOD_QUOTE, scored);
    expect(f.riskLevel).toBe('acceptable');
    expect(f.positiveFindings.length).toBeGreaterThan(0);
    expect(f.hardCapApplied).toBe(false);
  });

  it('capped quote with good signals still shows no positives (score < 75)', () => {
    // Owner-builder cap at 25, but all other signals are good
    const signals = q({ hasOwnerBuilderLanguage: true });
    const scored = scoreFromSignals(signals, null);
    const f = generateForensicSummary(signals, scored);
    expect(scored.overallScore).toBeLessThanOrEqual(25);
    expect(f.positiveFindings).toHaveLength(0);
  });

  it('generates permit question when permit not mentioned', () => {
    const signals = q({ hasPermitMention: false });
    const scored = scoreFromSignals(signals, null);
    const f = generateForensicSummary(signals, scored);
    expect(f.questionsToAsk.some(q => q.includes('permit'))).toBe(true);
  });

  it('generates wall repair question when not mentioned', () => {
    const signals = q({ hasWallRepairMention: false });
    const scored = scoreFromSignals(signals, null);
    const f = generateForensicSummary(signals, scored);
    expect(f.questionsToAsk.some(q => q.includes('wall repair') || q.includes('Wall repair'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. EXTRACT IDENTITY
// ═══════════════════════════════════════════════════════════════════════════

describe('extractIdentity', () => {
  it('extracts contractor info from good quote', () => {
    const id = extractIdentity(GOOD_QUOTE);
    expect(id.contractorName).toBe('Acme Windows LLC');
    expect(id.licenseNumber).toBe('CGC1234567');
    expect(id.noaNumbers).toContain('NOA-21-1234.56');
  });

  it('returns nulls for bad quote', () => {
    const id = extractIdentity(BAD_QUOTE);
    expect(id.contractorName).toBeNull();
    expect(id.licenseNumber).toBeNull();
    expect(id.noaNumbers).toHaveLength(0);
  });

  it('handles missing optional fields gracefully', () => {
    const id = extractIdentity(q({
      contractorNameExtracted: undefined,
      licenseNumberValue: undefined,
      noaNumberValue: undefined,
    }));
    expect(id.contractorName).toBeNull();
    expect(id.licenseNumber).toBeNull();
    expect(id.noaNumbers).toHaveLength(0);
  });
});
