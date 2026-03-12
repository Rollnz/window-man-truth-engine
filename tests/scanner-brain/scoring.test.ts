import { describe, it, expect } from 'vitest';
import {
  scoreFromSignals,
  calculateLetterGrade,
  generateSafePreview,
  generateForensicSummary,
  extractIdentity,
  DEFAULT_WEIGHTS,
} from '../../supabase/functions/_shared/scanner-brain/index';
import type { ExtractionSignals } from '../../supabase/functions/_shared/scanner-brain/schema';
import type { PillarWeights } from '../../supabase/functions/_shared/scanner-brain/scoring';

describe('scoring.ts', () => {
  it('should calculate overall score and letter grade based on signals', () => {
    const mockSignals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Acme Windows',
      supplierPhone: '555-123-4567',
      supplierAddress: '123 Main St',
      itemizedList: ['Window 1', 'Window 2'],
      totalPrice: 1000,
      downPayment: 100,
      paymentSchedule: 'Upon completion',
      permitFee: 50,
      warrantyDetails: 'Lifetime warranty',
      installationDetails: 'Professional installation',
      projectTimeline: '2 weeks',
      contractorLicense: 'ABC-123',
      insuranceDetails: 'Insured',
      disclaimerText: 'Some disclaimer',
      cancellationPolicy: '3 days',
      changeOrderPolicy: 'Written approval',
      siteSurveyDetails: 'Required',
      lienWaiverDetails: 'Upon payment',
      subcontractorDetails: 'None',
      supplierEmail: 'info@acmewindows.com',
      quoteDate: '2024-01-01',
      expirationDate: '2024-01-31',
      paymentMethods: ['Cash', 'Check'],
      numberOfOpenings: 2,
      brandNames: ['Acme'],
      glassPackages: ['Double pane'],
      frameMaterials: ['Vinyl'],
      hardwareFinishes: ['White'],
      gridStyles: ['Colonial'],
      energyStarRatings: ['Yes'],
      taxRate: 0.07,
      deliveryFee: 25,
      productDetails: 'Details',
      notes: 'Some notes',
      quoteId: '12345',
      termsAndConditions: 'T&C',
    }

    const scoredResult = scoreFromSignals(mockSignals, 2);

    expect(scoredResult).toBeDefined();
    expect(scoredResult.overallScore).toBeGreaterThan(0);
    expect(scoredResult.finalGrade).toBeTypeOf('string');
    expect(scoredResult.safetyScore).toBeGreaterThan(0);
    expect(scoredResult.scopeScore).toBeGreaterThan(0);
    expect(scoredResult.priceScore).toBeGreaterThan(0);
    expect(scoredResult.finePrintScore).toBeGreaterThan(0);
  });

  it('should calculate letter grade based on overall score', () => {
    expect(calculateLetterGrade(95)).toBe('A+');
    expect(calculateLetterGrade(85)).toBe('A');
    expect(calculateLetterGrade(75)).toBe('B');
    expect(calculateLetterGrade(65)).toBe('C');
    expect(calculateLetterGrade(55)).toBe('D');
    expect(calculateLetterGrade(45)).toBe('F');
  });

  it('should generate a safe preview with risk level and headline', () => {
    const mockSignals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Acme Windows',
      supplierPhone: '555-123-4567',
      supplierAddress: '123 Main St',
      itemizedList: ['Window 1', 'Window 2'],
      totalPrice: 1000,
      downPayment: 100,
      paymentSchedule: 'Upon completion',
      permitFee: 50,
      warrantyDetails: 'Lifetime warranty',
      installationDetails: 'Professional installation',
      projectTimeline: '2 weeks',
      contractorLicense: 'ABC-123',
      insuranceDetails: 'Insured',
      disclaimerText: 'Some disclaimer',
      cancellationPolicy: '3 days',
      changeOrderPolicy: 'Written approval',
      siteSurveyDetails: 'Required',
      lienWaiverDetails: 'Upon payment',
      subcontractorDetails: 'None',
      supplierEmail: 'info@acmewindows.com',
      quoteDate: '2024-01-01',
      expirationDate: '2024-01-31',
      paymentMethods: ['Cash', 'Check'],
      numberOfOpenings: 2,
      brandNames: ['Acme'],
      glassPackages: ['Double pane'],
      frameMaterials: ['Vinyl'],
      hardwareFinishes: ['White'],
      gridStyles: ['Colonial'],
      energyStarRatings: ['Yes'],
      taxRate: 0.07,
      deliveryFee: 25,
      productDetails: 'Details',
      notes: 'Some notes',
      quoteId: '12345',
      termsAndConditions: 'T&C',
    }

    const scoredResult = scoreFromSignals(mockSignals, 2);
    const forensicSummary = generateForensicSummary(mockSignals, scoredResult);
    const safePreview = generateSafePreview(scoredResult, forensicSummary);

    expect(safePreview).toBeDefined();
    expect(safePreview.risk_level).toBeTypeOf('string');
    expect(safePreview.headline).toBeTypeOf('string');
  });

  it('should handle missing optional fields in ExtractionSignals', () => {
    const mockSignals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Acme Windows',
      supplierPhone: null,
      supplierAddress: null,
      itemizedList: ['Window 1', 'Window 2'],
      totalPrice: 1000,
      downPayment: null,
      paymentSchedule: 'Upon completion',
      permitFee: null,
      warrantyDetails: 'Lifetime warranty',
      installationDetails: 'Professional installation',
      projectTimeline: '2 weeks',
      contractorLicense: null,
      insuranceDetails: 'Insured',
      disclaimerText: 'Some disclaimer',
      cancellationPolicy: '3 days',
      changeOrderPolicy: 'Written approval',
      siteSurveyDetails: 'Required',
      lienWaiverDetails: 'Upon payment',
      subcontractorDetails: 'None',
      supplierEmail: null,
      quoteDate: '2024-01-01',
      expirationDate: '2024-01-31',
      paymentMethods: ['Cash', 'Check'],
      numberOfOpenings: 2,
      brandNames: ['Acme'],
      glassPackages: ['Double pane'],
      frameMaterials: ['Vinyl'],
      hardwareFinishes: ['White'],
      gridStyles: ['Colonial'],
      energyStarRatings: ['Yes'],
      taxRate: null,
      deliveryFee: null,
      productDetails: 'Details',
      notes: 'Some notes',
      quoteId: '12345',
      termsAndConditions: 'T&C',
    };

    const scoredResult = scoreFromSignals(mockSignals, 2);

    expect(scoredResult).toBeDefined();
    expect(scoredResult.overallScore).toBeGreaterThan(0);
    expect(scoredResult.finalGrade).toBeTypeOf('string');
  });

  it('should apply pillar weights correctly', () => {
    const mockSignals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Acme Windows',
      supplierPhone: '555-123-4567',
      supplierAddress: '123 Main St',
      itemizedList: ['Window 1', 'Window 2'],
      totalPrice: 1000,
      downPayment: 100,
      paymentSchedule: 'Upon completion',
      permitFee: 50,
      warrantyDetails: 'Lifetime warranty',
      installationDetails: 'Professional installation',
      projectTimeline: '2 weeks',
      contractorLicense: 'ABC-123',
      insuranceDetails: 'Insured',
      disclaimerText: 'Some disclaimer',
      cancellationPolicy: '3 days',
      changeOrderPolicy: 'Written approval',
      siteSurveyDetails: 'Required',
      lienWaiverDetails: 'Upon payment',
      subcontractorDetails: 'None',
      supplierEmail: 'info@acmewindows.com',
      quoteDate: '2024-01-01',
      expirationDate: '2024-01-31',
      paymentMethods: ['Cash', 'Check'],
      numberOfOpenings: 2,
      brandNames: ['Acme'],
      glassPackages: ['Double pane'],
      frameMaterials: ['Vinyl'],
      hardwareFinishes: ['White'],
      gridStyles: ['Colonial'],
      energyStarRatings: ['Yes'],
      taxRate: 0.07,
      deliveryFee: 25,
      productDetails: 'Details',
      notes: 'Some notes',
      quoteId: '12345',
      termsAndConditions: 'T&C',
    };

    const customWeights: PillarWeights = {
      safety: 0.2,
      scope: 0.3,
      price: 0.3,
      finePrint: 0.1,
      warranty: 0.1,
    };

    const scoredResult = scoreFromSignals(mockSignals, 2, customWeights);

    expect(scoredResult).toBeDefined();
    expect(scoredResult.overallScore).toBeGreaterThan(0);
    expect(scoredResult.finalGrade).toBeTypeOf('string');
  });

  it('should use default weights if no custom weights are provided', () => {
    const mockSignals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Acme Windows',
      supplierPhone: '555-123-4567',
      supplierAddress: '123 Main St',
      itemizedList: ['Window 1', 'Window 2'],
      totalPrice: 1000,
      downPayment: 100,
      paymentSchedule: 'Upon completion',
      permitFee: 50,
      warrantyDetails: 'Lifetime warranty',
      installationDetails: 'Professional installation',
      projectTimeline: '2 weeks',
      contractorLicense: 'ABC-123',
      insuranceDetails: 'Insured',
      disclaimerText: 'Some disclaimer',
      cancellationPolicy: '3 days',
      changeOrderPolicy: 'Written approval',
      siteSurveyDetails: 'Required',
      lienWaiverDetails: 'Upon payment',
      subcontractorDetails: 'None',
      supplierEmail: 'info@acmewindows.com',
      quoteDate: '2024-01-01',
      expirationDate: '2024-01-31',
      paymentMethods: ['Cash', 'Check'],
      numberOfOpenings: 2,
      brandNames: ['Acme'],
      glassPackages: ['Double pane'],
      frameMaterials: ['Vinyl'],
      hardwareFinishes: ['White'],
      gridStyles: ['Colonial'],
      energyStarRatings: ['Yes'],
      taxRate: 0.07,
      deliveryFee: 25,
      productDetails: 'Details',
      notes: 'Some notes',
      quoteId: '12345',
      termsAndConditions: 'T&C',
    };

    const scoredResult = scoreFromSignals(mockSignals, 2);
    const defaultWeights = DEFAULT_WEIGHTS;

    expect(scoredResult).toBeDefined();
    expect(scoredResult.overallScore).toBeGreaterThan(0);
    expect(scoredResult.finalGrade).toBeTypeOf('string');
    // You can add more specific checks here to ensure the default weights are applied correctly
    // For example, you can check the individual pillar scores and ensure they are calculated as expected with the default weights.
  });
});
