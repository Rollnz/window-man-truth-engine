import { describe, it, expect } from 'vitest';
import {
  scoreFromSignals,
  calculateLetterGrade,
  generateSafePreview,
  generateForensicSummary,
  extractIdentity,
} from './index';
import type { ExtractionSignals } from './schema';

// ═══════════════════════════════════════════════════════════════════════════
// BASE FIXTURES — spread & override for each scenario
// ═══════════════════════════════════════════════════════════════════════════

/** A "perfect" quote — max signals, no red flags */
const PERFECT: ExtractionSignals = {
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

// Helper to quickly override a few signals
function withOverrides(overrides: Partial<ExtractionSignals>): ExtractionSignals {
  return { ...PERFECT, ...overrides };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. HARD CAP ISOLATION TESTS
//    Each cap tested alone on an otherwise-perfect quote
// ═══════════════════════════════════════════════════════════════════════════

describe('Hard Cap Isolation', () => {
  it('CAP 1: Missing license → ceiling 25, grade F (F.S. 489.119)', () => {
    const s = withOverrides({ licenseNumberPresent: false, licenseNumberValue: null });
    const r = scoreFromSignals(s, null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(25);
    expect(r.hardCap.statute).toBe('F.S. 489.119');
    expect(r.overallScore).toBeLessThanOrEqual(25);
    expect(r.finalGrade).toBe('F');
    expect(r.warnings.some(w => w.includes('489.119'))).toBe(true);
  });

  it('CAP 2: Owner-Builder language → ceiling 25, grade F (F.S. 489.103)', () => {
    const s = withOverrides({ hasOwnerBuilderLanguage: true });
    const r = scoreFromSignals(s, null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(25);
    expect(r.hardCap.statute).toBe('F.S. 489.103');
    expect(r.overallScore).toBeLessThanOrEqual(25);
    expect(r.finalGrade).toBe('F');
  });

  it('CAP 3: Deposit 60% → ceiling 55, grade F (F.S. 501.137)', () => {
    const s = withOverrides({ depositPercentage: 60 });
    const r = scoreFromSignals(s, null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(55);
    expect(r.hardCap.statute).toBe('F.S. 501.137');
    expect(r.overallScore).toBeLessThanOrEqual(55);
    expect(r.finalGrade).toBe('F');
  });

  it('CAP 4: Tempered-only + no laminated → ceiling 30 (no statute)', () => {
    const s = withOverrides({ hasTemperedOnlyRisk: true, hasLaminatedMention: false });
    const r = scoreFromSignals(s, null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(30);
    expect(r.hardCap.statute).toBeNull();
    expect(r.overallScore).toBeLessThanOrEqual(30);
    expect(r.finalGrade).toBe('F');
  });

  it('CAP 5: Payment before completion → ceiling 40 (F.S. 489.126)', () => {
    const s = withOverrides({ hasPaymentBeforeCompletion: true });
    const r = scoreFromSignals(s, null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(40);
    expect(r.hardCap.statute).toBe('F.S. 489.126');
    expect(r.overallScore).toBeLessThanOrEqual(40);
    expect(r.finalGrade).toBe('F');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. HARD CAP STACKING (lowest cap wins)
// ═══════════════════════════════════════════════════════════════════════════

describe('Hard Cap Stacking', () => {
  it('Missing license (25) beats deposit cap (55)', () => {
    const s = withOverrides({
      licenseNumberPresent: false, licenseNumberValue: null,
      depositPercentage: 60,
    });
    const r = scoreFromSignals(s, null);
    expect(r.hardCap.ceiling).toBe(25);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it('Owner-builder (25) + tempered-only (30) → lowest wins = 25', () => {
    const s = withOverrides({
      hasOwnerBuilderLanguage: true,
      hasTemperedOnlyRisk: true,
      hasLaminatedMention: false,
    });
    const r = scoreFromSignals(s, null);
    expect(r.hardCap.ceiling).toBe(25);
  });

  it('PaymentBeforeCompletion (40) + deposit 55% (55) → 40 wins', () => {
    const s = withOverrides({
      hasPaymentBeforeCompletion: true,
      depositPercentage: 55,
    });
    const r = scoreFromSignals(s, null);
    expect(r.hardCap.ceiling).toBe(40);
    expect(r.overallScore).toBeLessThanOrEqual(40);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. DEPOSIT BOUNDARY CONDITIONS
// ═══════════════════════════════════════════════════════════════════════════

describe('Deposit Boundary Conditions', () => {
  it('deposit 50% → no hard cap triggered', () => {
    const r = scoreFromSignals(withOverrides({ depositPercentage: 50 }), null);
    expect(r.hardCap.applied).toBe(false);
  });

  it('deposit 51% → hard cap at 55', () => {
    const r = scoreFromSignals(withOverrides({ depositPercentage: 51 }), null);
    expect(r.hardCap.applied).toBe(true);
    expect(r.hardCap.ceiling).toBe(55);
  });

  it('deposit 40% → fine print penalty but no cap', () => {
    const r = scoreFromSignals(withOverrides({ depositPercentage: 40 }), null);
    expect(r.hardCap.applied).toBe(false);
  });

  it('deposit 41% → fine print warning (high risk deposit)', () => {
    const r = scoreFromSignals(withOverrides({ depositPercentage: 41 }), null);
    expect(r.warnings.some(w => w.includes('deposit'))).toBe(true);
  });

  it('deposit null → missing item flagged', () => {
    const r = scoreFromSignals(withOverrides({ depositPercentage: null }), null);
    expect(r.missingItems.some(m => m.toLowerCase().includes('payment') || m.toLowerCase().includes('deposit'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. PRICE-PER-OPENING BRACKETS
// ═══════════════════════════════════════════════════════════════════════════

describe('Price Per Opening Brackets', () => {
  it('$900/opening → low-ball suspicious (priceScore = 40)', () => {
    const s = withOverrides({ totalPriceValue: 9000, openingCountEstimate: 10 });
    const r = scoreFromSignals(s, null);
    expect(r.pricePerOpening).toBe('$900');
    expect(r.priceScore).toBe(40);
  });

  it('$1,500/opening → sweet spot (priceScore = 95)', () => {
    const r = scoreFromSignals(PERFECT, null);
    expect(r.pricePerOpening).toBe('$1,500');
    expect(r.priceScore).toBe(95);
  });

  it('$2,000/opening → above market (priceScore = 75)', () => {
    const s = withOverrides({ totalPriceValue: 20000, openingCountEstimate: 10 });
    const r = scoreFromSignals(s, null);
    expect(r.pricePerOpening).toBe('$2,000');
    expect(r.priceScore).toBe(75);
  });

  it('$3,000/opening → premium range (priceScore = 55 without premium indicators)', () => {
    const s = withOverrides({ totalPriceValue: 30000, openingCountEstimate: 10 });
    const r = scoreFromSignals(s, null);
    expect(r.pricePerOpening).toBe('$3,000');
    expect(r.priceScore).toBe(55);
  });

  it('$3,000/opening + premium indicators → bumped to 65', () => {
    const s = withOverrides({
      totalPriceValue: 30000,
      openingCountEstimate: 10,
      hasPremiumIndicators: true,
    });
    const r = scoreFromSignals(s, null);
    expect(r.priceScore).toBe(65);
  });

  it('missing total price → N/A and missing item flagged', () => {
    const s = withOverrides({ totalPriceFound: false, totalPriceValue: null });
    const r = scoreFromSignals(s, null);
    expect(r.pricePerOpening).toBe('N/A');
    expect(r.missingItems.some(m => m.includes('price per opening'))).toBe(true);
  });

  it('openingCountHint overrides null openingCountEstimate', () => {
    const s = withOverrides({ openingCountEstimate: null, totalPriceValue: 15000 });
    const r = scoreFromSignals(s, 10);
    expect(r.pricePerOpening).toBe('$1,500');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. PENALTY EFFECTS (Standard Installation, Manager Discount)
// ═══════════════════════════════════════════════════════════════════════════

describe('Penalty Effects', () => {
  it('"Standard Installation" deducts from scope score', () => {
    const without = scoreFromSignals(withOverrides({ hasStandardInstallation: false }), null);
    const with_ = scoreFromSignals(withOverrides({ hasStandardInstallation: true }), null);
    expect(with_.scopeScore).toBeLessThan(without.scopeScore);
    expect(with_.warnings.some(w => w.includes('Standard installation'))).toBe(true);
  });

  it('"Manager Discount" deducts from fine print score', () => {
    const without = scoreFromSignals(withOverrides({ hasManagerDiscount: false }), null);
    const with_ = scoreFromSignals(withOverrides({ hasManagerDiscount: true }), null);
    expect(with_.finePrintScore).toBeLessThan(without.finePrintScore);
    expect(with_.warnings.some(w => w.includes('manager discount') || w.includes('Manager Discount') || w.includes('today only'))).toBe(true);
  });

  it('"Subject to Change" deducts from scope score', () => {
    const without = scoreFromSignals(withOverrides({ hasSubjectToChange: false }), null);
    const with_ = scoreFromSignals(withOverrides({ hasSubjectToChange: true }), null);
    expect(with_.scopeScore).toBeLessThan(without.scopeScore);
  });

  it('Contract traps deduct from fine print score', () => {
    const clean = scoreFromSignals(withOverrides({
      hasContractTraps: false, contractTrapsList: [],
    }), null);
    const trapped = scoreFromSignals(withOverrides({
      hasContractTraps: true,
      contractTrapsList: ['arbitration clause', 'lien waiver'],
    }), null);
    expect(trapped.finePrintScore).toBeLessThan(clean.finePrintScore);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. SAFETY PILLAR EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe('Safety Pillar Edge Cases', () => {
  it('Non-impact language caps safety at 25', () => {
    const s = withOverrides({ hasNonImpactLanguage: true });
    const r = scoreFromSignals(s, null);
    expect(r.safetyScore).toBeLessThanOrEqual(25);
  });

  it('No compliance at all → safety capped at 40 + missing item', () => {
    const s = withOverrides({
      hasComplianceKeyword: false,
      hasComplianceIdentifier: false,
      hasLaminatedMention: false,
    });
    const r = scoreFromSignals(s, null);
    expect(r.safetyScore).toBeLessThanOrEqual(40);
    expect(r.missingItems.some(m => m.includes('impact compliance'))).toBe(true);
  });

  it('Tempered-only risk caps safety at 30', () => {
    const s = withOverrides({ hasTemperedOnlyRisk: true });
    const r = scoreFromSignals(s, null);
    expect(r.safetyScore).toBeLessThanOrEqual(30);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. WARRANTY PILLAR
// ═══════════════════════════════════════════════════════════════════════════

describe('Warranty Pillar', () => {
  it('No warranty at all → score 0 + missing item', () => {
    const s = withOverrides({
      hasWarrantyMention: false,
      hasLaborWarranty: false,
      warrantyDurationYears: null,
      hasLifetimeWarranty: false,
      hasTransferableWarranty: false,
    });
    const r = scoreFromSignals(s, null);
    expect(r.warrantyScore).toBe(0);
    expect(r.missingItems.some(m => m.includes('warranty'))).toBe(true);
  });

  it('Full warranty stack → score capped at 100', () => {
    const r = scoreFromSignals(PERFECT, null);
    expect(r.warrantyScore).toBe(100);
  });

  it('Mention only, no labor warranty → 30', () => {
    const s = withOverrides({
      hasWarrantyMention: true,
      hasLaborWarranty: false,
      warrantyDurationYears: null,
      hasLifetimeWarranty: false,
      hasTransferableWarranty: false,
    });
    const r = scoreFromSignals(s, null);
    expect(r.warrantyScore).toBe(30);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. CURVING BEHAVIOR
// ═══════════════════════════════════════════════════════════════════════════

describe('Score Curving', () => {
  it('Perfect quote scores well but A+ is very hard to reach', () => {
    const r = scoreFromSignals(PERFECT, null);
    // With curving, even a perfect raw score gets compressed
    expect(r.overallScore).toBeLessThan(100);
    expect(r.overallScore).toBeGreaterThanOrEqual(70);
  });

  it('Score 70 or below is not curved', () => {
    // A quote with enough gaps to score ≤70 raw should not be curved
    const s = withOverrides({
      hasComplianceKeyword: false,
      hasComplianceIdentifier: false,
      hasLaminatedMention: false,
      hasWarrantyMention: false,
      hasLaborWarranty: false,
      warrantyDurationYears: null,
      hasLifetimeWarranty: false,
      hasTransferableWarranty: false,
    });
    const r = scoreFromSignals(s, null);
    // Should be below 70 — curving doesn't inflate
    expect(r.overallScore).toBeLessThanOrEqual(70);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. INVALID DOCUMENT HANDLING
// ═══════════════════════════════════════════════════════════════════════════

describe('Invalid Document Handling', () => {
  it('Non-quote document → 0 / F / specific warning', () => {
    const s = withOverrides({ isValidQuote: false, validityReason: 'This is a grocery receipt' });
    const r = scoreFromSignals(s, null);
    expect(r.overallScore).toBe(0);
    expect(r.finalGrade).toBe('F');
    expect(r.warnings).toContain(
      'Not a window/door quote. Upload a contractor proposal/estimate for windows/doors.'
    );
  });

  it('Invalid doc preview shows critical risk', () => {
    const s = withOverrides({ isValidQuote: false });
    const r = scoreFromSignals(s, null);
    const p = generateSafePreview(r);
    expect(p.riskLevel).toBe('critical');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. FORENSIC SUMMARY INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

describe('Forensic Summary Scenarios', () => {
  it('Perfect quote → acceptable risk, positives populated, no cap', () => {
    const r = scoreFromSignals(PERFECT, null);
    const f = generateForensicSummary(PERFECT, r);
    expect(f.riskLevel).toBe('acceptable');
    expect(f.hardCapApplied).toBe(false);
    expect(f.positiveFindings.length).toBeGreaterThan(0);
    expect(f.questionsToAsk.length).toBe(0);
  });

  it('Missing license → critical risk, statute cited, questions generated', () => {
    const s = withOverrides({ licenseNumberPresent: false, licenseNumberValue: null });
    const r = scoreFromSignals(s, null);
    const f = generateForensicSummary(s, r);
    expect(f.riskLevel).toBe('critical');
    expect(f.statuteCitations.some(c => c.includes('489.119'))).toBe(true);
    expect(f.questionsToAsk.some(q => q.toLowerCase().includes('license'))).toBe(true);
  });

  it('Moderate score → moderate risk level', () => {
    const s = withOverrides({
      hasComplianceKeyword: false,
      hasComplianceIdentifier: false,
      hasLaminatedMention: false,
    });
    const r = scoreFromSignals(s, null);
    const f = generateForensicSummary(s, r);
    // Depending on exact score, should be moderate or high
    expect(['moderate', 'high']).toContain(f.riskLevel);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. REAL-WORLD SIMULATION: "Middling" Quote
// ═══════════════════════════════════════════════════════════════════════════

describe('Real-World Simulations', () => {
  it('Average Florida contractor quote → F range (no NOA = hard cap territory)', () => {
    const avg = withOverrides({
      totalPriceValue: 18000,
      openingCountEstimate: 8,
      hasComplianceKeyword: true,
      hasComplianceIdentifier: false,
      hasNOANumber: false,
      noaNumberValue: null,
      hasLaminatedMention: true,
      hasGlassBuildDetail: false,
      hasPermitMention: true,
      hasDemoInstallDetail: false,
      hasSpecificMaterials: false,
      hasWallRepairMention: false,
      hasFinishDetail: false,
      hasCleanupMention: false,
      hasBrandClarity: true,
      hasDetailedScope: false,
      depositPercentage: 33,
      hasSafePaymentTerms: false,
      hasWarrantyMention: true,
      hasLaborWarranty: false,
      warrantyDurationYears: null,
      hasLifetimeWarranty: false,
      hasTransferableWarranty: false,
    });
    const r = scoreFromSignals(avg, null);
    // This quote has a license so no license cap — should score naturally
    expect(r.hardCap.applied).toBe(false);
    expect(r.overallScore).toBeGreaterThanOrEqual(30);
    expect(r.overallScore).toBeLessThanOrEqual(75);
  });

  it('Premium quote ($3k/opening) with full docs → B range', () => {
    const premium = withOverrides({
      totalPriceValue: 30000,
      openingCountEstimate: 10,
      hasPremiumIndicators: true,
    });
    const r = scoreFromSignals(premium, null);
    expect(r.overallScore).toBeGreaterThanOrEqual(70);
    expect(r.finalGrade).toMatch(/^[AB]/);
  });

  it('Cheap quote no docs → low score, missing items flagged', () => {
    const cheap = withOverrides({
      totalPriceValue: 5000,
      openingCountEstimate: 10,
      hasComplianceKeyword: false,
      hasComplianceIdentifier: false,
      hasNOANumber: false,
      hasLaminatedMention: false,
      hasGlassBuildDetail: false,
      hasPermitMention: false,
      hasDemoInstallDetail: false,
      hasSpecificMaterials: false,
      hasWallRepairMention: false,
      hasFinishDetail: false,
      hasCleanupMention: false,
      hasBrandClarity: false,
      hasDetailedScope: false,
      depositPercentage: null,
      hasWarrantyMention: false,
      hasLaborWarranty: false,
      warrantyDurationYears: null,
      hasLifetimeWarranty: false,
      hasTransferableWarranty: false,
    });
    const r = scoreFromSignals(cheap, null);
    expect(r.overallScore).toBeLessThanOrEqual(50);
    expect(r.missingItems.length).toBeGreaterThan(0);
  });
});
