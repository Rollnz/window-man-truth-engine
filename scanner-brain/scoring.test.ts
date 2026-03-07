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
// MOCK FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('scoreFromSignals', () => {
  it('scores a good quote with high grade and no hard cap', () => {
    const result = scoreFromSignals(GOOD_QUOTE, null);

    expect(result.hardCap.applied).toBe(false);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.finalGrade).toMatch(/^[AB]/);
    expect(result.pricePerOpening).toBe('$1,500');

    // All pillars above 40
    expect(result.safetyScore).toBeGreaterThan(40);
    expect(result.scopeScore).toBeGreaterThan(40);
    expect(result.priceScore).toBeGreaterThan(40);
    expect(result.finePrintScore).toBeGreaterThan(40);
    expect(result.warrantyScore).toBeGreaterThan(40);
  });

  it('caps a bad quote at 25 due to missing license (F.S. 489.119)', () => {
    const result = scoreFromSignals(BAD_QUOTE, null);

    expect(result.hardCap.applied).toBe(true);
    expect(result.hardCap.ceiling).toBe(25);
    expect(result.hardCap.statute).toBe('F.S. 489.119');
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.finalGrade).toBe('F');
  });

  it('returns score 0 and grade F for invalid documents', () => {
    const result = scoreFromSignals(INVALID_DOC, null);

    expect(result.overallScore).toBe(0);
    expect(result.finalGrade).toBe('F');
    expect(result.hardCap.applied).toBe(false);
    expect(result.warnings).toContain(
      'Not a window/door quote. Upload a contractor proposal/estimate for windows/doors.'
    );
  });
});

describe('generateSafePreview', () => {
  it('returns acceptable risk for good quote', () => {
    const scored = scoreFromSignals(GOOD_QUOTE, null);
    const preview = generateSafePreview(scored);

    expect(preview.riskLevel).toBe('acceptable');
    expect(preview.hasCriticalCap).toBe(false);
    expect(preview.grade).toBe(scored.finalGrade);
  });

  it('returns critical risk for bad quote', () => {
    const scored = scoreFromSignals(BAD_QUOTE, null);
    const preview = generateSafePreview(scored);

    expect(preview.riskLevel).toBe('critical');
    expect(preview.hasCriticalCap).toBe(true);
    expect(preview.warningCount).toBeGreaterThan(0);
  });
});

describe('generateForensicSummary', () => {
  it('cites F.S. 489.119 for bad quote', () => {
    const scored = scoreFromSignals(BAD_QUOTE, null);
    const forensic = generateForensicSummary(BAD_QUOTE, scored);

    expect(forensic.riskLevel).toBe('critical');
    expect(forensic.hardCapApplied).toBe(true);
    expect(forensic.statuteCitations.some(c => c.includes('F.S. 489.119'))).toBe(true);
    expect(forensic.questionsToAsk.length).toBeGreaterThan(0);
  });

  it('lists positive findings for good quote', () => {
    const scored = scoreFromSignals(GOOD_QUOTE, null);
    const forensic = generateForensicSummary(GOOD_QUOTE, scored);

    expect(forensic.riskLevel).toBe('acceptable');
    expect(forensic.positiveFindings.length).toBeGreaterThan(0);
  });
});

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
});

describe('calculateLetterGrade boundaries', () => {
  it.each([
    [97, 'A+'], [93, 'A'], [90, 'A-'],
    [87, 'B+'], [83, 'B'], [80, 'B-'],
    [77, 'C+'], [73, 'C'], [70, 'C-'],
    [67, 'D+'], [63, 'D'], [60, 'D-'],
    [59, 'F'],  [0, 'F'],
  ])('score %i → %s', (score, grade) => {
    expect(calculateLetterGrade(score)).toBe(grade);
  });
});
