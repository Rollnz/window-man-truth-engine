import { describe, it, expect } from 'vitest';
import {
  scoreFromSignals,
  calculateLetterGrade,
  generateSafePreview,
  generateForensicSummary,
  extractIdentity,
} from '../../supabase/functions/_shared/scanner-brain/index';
import type { ExtractionSignals } from '../../supabase/functions/_shared/scanner-brain/schema';

describe('Scoring Scenarios', () => {
  it('Scenario 1: Basic Valid Quote', () => {
    const signals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Acme Windows',
      supplierPhone: '555-123-4567',
      supplierAddress: '123 Main St',
      items: [{ description: 'Window 1', quantity: 1, price: 500 }],
      totalPrice: 500,
      disclaimerText: null,
      projectScope: 'Window replacement',
      paymentSchedule: null,
      leadTimeDays: 30,
      warrantyDetails: 'Limited lifetime warranty',
      licenseNumber: 'ABC-123',
      emergencyContact: null,
      cancellationPolicy: null,
      changeOrderPolicy: null,
      insuranceDetails: null,
      siteAccessDetails: null,
      quoteDate: '2024-01-01',
      expirationDate: '2024-02-01',
      contractorName: 'Acme Contractor',
      estimatedProjectCost: 500,
      noaNumbers: [],
      discountPercentage: null,
      discountAmount: null,
      taxRate: null,
      taxAmount: null,
      shippingCost: null,
      installationCost: null,
      materialsCost: null,
      laborCost: null,
      profitMargin: null,
      paymentTerms: null,
      projectDuration: null,
      openingQuantity: 1,
      validityScore: 1,
    };

    const scored = scoreFromSignals(signals, 1);
    expect(scored.overallScore).toBeGreaterThan(0);
    expect(scored.finalGrade).toBeDefined();
  });

  it('Scenario 2: Missing Warranty', () => {
    const signals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Acme Windows',
      supplierPhone: '555-123-4567',
      supplierAddress: '123 Main St',
      items: [{ description: 'Window 1', quantity: 1, price: 500 }],
      totalPrice: 500,
      disclaimerText: null,
      projectScope: 'Window replacement',
      paymentSchedule: null,
      leadTimeDays: 30,
      warrantyDetails: null, // Missing warranty
      licenseNumber: 'ABC-123',
      emergencyContact: null,
      cancellationPolicy: null,
      changeOrderPolicy: null,
      insuranceDetails: null,
      siteAccessDetails: null,
      quoteDate: '2024-01-01',
      expirationDate: '2024-02-01',
      contractorName: 'Acme Contractor',
      estimatedProjectCost: 500,
      noaNumbers: [],
      discountPercentage: null,
      discountAmount: null,
      taxRate: null,
      taxAmount: null,
      shippingCost: null,
      installationCost: null,
      materialsCost: null,
      laborCost: null,
      profitMargin: null,
      paymentTerms: null,
      projectDuration: null,
      openingQuantity: 1,
      validityScore: 1,
    };

    const scored = scoreFromSignals(signals, 1);
    expect(scored.overallScore).toBeLessThan(100); // Score should be lower due to missing warranty
  });

  it('Scenario 3: Invalid Quote', () => {
    const signals: ExtractionSignals = {
      isValidQuote: false,
      validityReason: 'Not a window quote',
      supplierName: null,
      supplierPhone: null,
      supplierAddress: null,
      items: [],
      totalPrice: null,
      disclaimerText: null,
      projectScope: null,
      paymentSchedule: null,
      leadTimeDays: null,
      warrantyDetails: null,
      licenseNumber: null,
      emergencyContact: null,
      cancellationPolicy: null,
      changeOrderPolicy: null,
      insuranceDetails: null,
      siteAccessDetails: null,
      quoteDate: null,
      expirationDate: null,
      contractorName: null,
      estimatedProjectCost: null,
      noaNumbers: [],
      discountPercentage: null,
      discountAmount: null,
      taxRate: null,
      taxAmount: null,
      shippingCost: null,
      installationCost: null,
      materialsCost: null,
      laborCost: null,
      profitMargin: null,
      paymentTerms: null,
      projectDuration: null,
      openingQuantity: null,
      validityScore: 0,
    };

    const scored = scoreFromSignals(signals, 1);
    expect(scored.overallScore).toBe(0); // Score should be zero for invalid quotes
    expect(scored.finalGrade).toBe('F');
  });

  it('Scenario 4: High Price, Few Details', () => {
    const signals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Expensive Windows Inc.',
      supplierPhone: '555-987-6543',
      supplierAddress: '456 High Price Ln',
      items: [{ description: 'Luxury Window', quantity: 1, price: 1500 }],
      totalPrice: 1500,
      disclaimerText: 'Some restrictions apply',
      projectScope: 'Window replacement',
      paymentSchedule: '50% upfront',
      leadTimeDays: 60,
      warrantyDetails: null,
      licenseNumber: 'XYZ-789',
      emergencyContact: null,
      cancellationPolicy: null,
      changeOrderPolicy: null,
      insuranceDetails: null,
      siteAccessDetails: null,
      quoteDate: '2024-01-15',
      expirationDate: '2024-02-15',
      contractorName: 'Expensive Contractor',
      estimatedProjectCost: 1500,
      noaNumbers: [],
      discountPercentage: null,
      discountAmount: null,
      taxRate: null,
      taxAmount: null,
      shippingCost: null,
      installationCost: null,
      materialsCost: null,
      laborCost: null,
      profitMargin: null,
      paymentTerms: null,
      projectDuration: null,
      openingQuantity: 1,
      validityScore: 1,
    };

    const scored = scoreFromSignals(signals, 1);
    expect(scored.overallScore).toBeLessThan(70); // Expect a lower score due to high price and missing details
  });

  it('Scenario 5: Multiple Openings, Discount Applied', () => {
    const signals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Discount Windows Co.',
      supplierPhone: '555-456-7890',
      supplierAddress: '789 Discount Ave',
      items: [
        { description: 'Window 1', quantity: 2, price: 400 },
        { description: 'Window 2', quantity: 2, price: 350 },
      ],
      totalPrice: 1400,
      disclaimerText: 'Limited time offer',
      projectScope: 'Full house window replacement',
      paymentSchedule: 'Flexible payment options',
      leadTimeDays: 45,
      warrantyDetails: '10 year warranty',
      licenseNumber: 'DEF-456',
      emergencyContact: null,
      cancellationPolicy: null,
      changeOrderPolicy: null,
      insuranceDetails: null,
      siteAccessDetails: null,
      quoteDate: '2024-02-01',
      expirationDate: '2024-03-01',
      contractorName: 'Discount Contractor',
      estimatedProjectCost: 1400,
      noaNumbers: [],
      discountPercentage: 10,
      discountAmount: 140,
      taxRate: null,
      taxAmount: null,
      shippingCost: null,
      installationCost: null,
      materialsCost: null,
      laborCost: null,
      profitMargin: null,
      paymentTerms: null,
      projectDuration: null,
      openingQuantity: 4,
      validityScore: 1,
    };

    const scored = scoreFromSignals(signals, 4);
    expect(scored.overallScore).toBeGreaterThan(75); // Expect a good score with multiple openings and a discount
  });

  it('Scenario 6: NOA Numbers Present', () => {
    const signals: ExtractionSignals = {
      isValidQuote: true,
      validityReason: null,
      supplierName: 'Impact Windows R Us',
      supplierPhone: '555-456-7890',
      supplierAddress: '789 Discount Ave',
      items: [
        { description: 'Window 1', quantity: 2, price: 400 },
        { description: 'Window 2', quantity: 2, price: 350 },
      ],
      totalPrice: 1400,
      disclaimerText: 'Limited time offer',
      projectScope: 'Full house window replacement',
      paymentSchedule: 'Flexible payment options',
      leadTimeDays: 45,
      warrantyDetails: '10 year warranty',
      licenseNumber: 'DEF-456',
      emergencyContact: null,
      cancellationPolicy: null,
      changeOrderPolicy: null,
      insuranceDetails: null,
      siteAccessDetails: null,
      quoteDate: '2024-02-01',
      expirationDate: '2024-03-01',
      contractorName: 'Discount Contractor',
      estimatedProjectCost: 1400,
      noaNumbers: ['24-1234.01', '24-4567.02'],
      discountPercentage: 10,
      discountAmount: 140,
      taxRate: null,
      taxAmount: null,
      shippingCost: null,
      installationCost: null,
      materialsCost: null,
      laborCost: null,
      profitMargin: null,
      paymentTerms: null,
      projectDuration: null,
      openingQuantity: 4,
      validityScore: 1,
    };

    const scored = scoreFromSignals(signals, 4);
    expect(scored.overallScore).toBeGreaterThan(75); // Expect a good score with multiple openings and a discount
  });
});
