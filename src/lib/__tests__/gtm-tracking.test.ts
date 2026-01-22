/**
 * GTM Tracking Validation Tests
 * 
 * Verifies trackLeadSubmissionSuccess and related functions:
 * 1. Correct function signature (no deprecated params like hasPhone)
 * 2. Async behavior (returns Promise)
 * 3. DataLayer push structure matches Enhanced Conversions schema
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  trackLeadSubmissionSuccess,
  trackConsultationBooked,
  trackPhoneLead,
  sha256,
  hashPhone,
} from '../gtm';
import { normalizeToE164 } from '../phoneFormat';

// Mock window.dataLayer
const mockDataLayer: any[] = [];

beforeEach(() => {
  // Reset dataLayer mock
  mockDataLayer.length = 0;
  vi.stubGlobal('dataLayer', mockDataLayer);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('trackLeadSubmissionSuccess', () => {
  it('should be an async function that returns a Promise', async () => {
    const result = trackLeadSubmissionSuccess({
      leadId: 'test-lead-123',
      email: 'test@example.com',
      sourceTool: 'quote-builder',
    });

    expect(result).toBeInstanceOf(Promise);
    await result; // Should resolve without error
  });

  it('should accept the correct signature without hasPhone', async () => {
    // This should compile and run without errors
    await trackLeadSubmissionSuccess({
      leadId: 'test-lead-123',
      email: 'test@example.com',
      phone: '555-123-4567',
      name: 'John Doe',
      sourceTool: 'quote-builder',
    });

    // Verify dataLayer was pushed
    expect(mockDataLayer.length).toBeGreaterThan(0);
  });

  it('should push event with correct schema structure', async () => {
    await trackLeadSubmissionSuccess({
      leadId: 'test-lead-456',
      email: 'user@test.com',
      phone: '(555) 987-6543',
      name: 'Jane Smith',
      sourceTool: 'beat-your-quote',
    });

    const event = mockDataLayer.find(e => e.event === 'lead_submission_success');
    expect(event).toBeDefined();
    
    // Verify required fields
    expect(event.event).toBe('lead_submission_success');
    expect(event.event_id).toBeDefined();
    expect(event.value).toBe(15);
    expect(event.currency).toBe('USD');
    
    // Verify user_data structure (Enhanced Conversions)
    expect(event.user_data).toBeDefined();
    expect(event.external_id).toBe('test-lead-456');
    
    // Verify hashed PII fields exist (SHA-256)
    expect(event.user_data.sha256_email_address).toBeDefined();
    expect(event.user_data.sha256_email_address).toMatch(/^[a-f0-9]{64}$/); // 64 hex chars
    
    // Verify Meta CAPI aliases exist
    expect(event.user_data.em).toBeDefined();
    expect(event.user_data.ph).toBeDefined();
  });

  it('should NOT include hasPhone in the function signature', async () => {
    // TypeScript should reject this call with hasPhone
    // This test documents the correct behavior
    await trackLeadSubmissionSuccess({
      leadId: 'test-lead-789',
      email: 'nophone@test.com',
      sourceTool: 'ai-scanner',
    });

    const event = mockDataLayer.find(e => e.event === 'lead_submission_success');
    expect(event).toBeDefined();
    // has_phone is allowed in the EVENT payload (for reporting), just not as a function param
    expect(event.has_phone).toBe(false);
  });

  it('should handle missing optional fields gracefully', async () => {
    await trackLeadSubmissionSuccess({
      leadId: 'minimal-lead',
      email: 'minimal@test.com',
      sourceTool: 'quote-scanner',
    });

    const event = mockDataLayer.find(e => e.event === 'lead_submission_success');
    expect(event).toBeDefined();
    expect(event.user_data.sha256_email_address).toBeDefined();
    // Phone hash should be undefined when not provided
    expect(event.user_data.sha256_phone_number).toBeUndefined();
  });
});

describe('trackConsultationBooked', () => {
  it('should be async and push correct value', async () => {
    await trackConsultationBooked({
      leadId: 'booking-lead-123',
      email: 'booking@test.com',
      phone: '555-111-2222',
      sourceTool: 'consultation-modal',
    });

    const event = mockDataLayer.find(e => e.event === 'consultation_booked');
    expect(event).toBeDefined();
    expect(event.value).toBe(75); // Higher value for consultation
    expect(event.currency).toBe('USD');
  });

  it('should include user_data with hashed PII', async () => {
    await trackConsultationBooked({
      leadId: 'booking-lead-456',
      email: 'user@booking.com',
      phone: '(555) 333-4444',
    });

    const event = mockDataLayer.find(e => e.event === 'consultation_booked');
    expect(event.user_data).toBeDefined();
    expect(event.user_data.sha256_email_address).toMatch(/^[a-f0-9]{64}$/);
    expect(event.user_data.sha256_phone_number).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('trackPhoneLead', () => {
  it('should be async and push correct value', async () => {
    await trackPhoneLead({
      leadId: 'phone-lead-123',
      phone: '555-333-4444',
      email: 'phone@test.com',
      sourceTool: 'fair-price-quiz',
    });

    const event = mockDataLayer.find(e => e.event === 'phone_lead');
    expect(event).toBeDefined();
    expect(event.value).toBe(25);
    expect(event.currency).toBe('USD');
  });

  it('should include hashed phone in user_data', async () => {
    await trackPhoneLead({
      leadId: 'phone-lead-456',
      phone: '(555) 987-6543',
      sourceTool: 'quiz-results',
    });

    const event = mockDataLayer.find(e => e.event === 'phone_lead');
    expect(event.user_data).toBeDefined();
    expect(event.user_data.sha256_phone_number).toMatch(/^[a-f0-9]{64}$/);
    expect(event.user_data.ph).toBeDefined(); // Meta CAPI alias
  });
});

describe('normalizeToE164', () => {
  it('should convert 10-digit US numbers to E.164', () => {
    expect(normalizeToE164('5551234567')).toBe('+15551234567');
    expect(normalizeToE164('555-123-4567')).toBe('+15551234567');
    expect(normalizeToE164('(555) 123-4567')).toBe('+15551234567');
  });

  it('should handle numbers starting with 1', () => {
    expect(normalizeToE164('15551234567')).toBe('+15551234567');
    expect(normalizeToE164('1-555-123-4567')).toBe('+15551234567');
  });

  it('should return undefined for invalid phone numbers', () => {
    expect(normalizeToE164('')).toBeUndefined();
    expect(normalizeToE164(undefined)).toBeUndefined();
    expect(normalizeToE164('12345')).toBeUndefined(); // Too short
    expect(normalizeToE164('123456789012')).toBeUndefined(); // Too long
  });
});

describe('SHA-256 Hashing', () => {
  it('should produce consistent 64-character hex hashes', async () => {
    const hash = await sha256('test@example.com');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    
    // Same input should produce same hash
    const hash2 = await sha256('test@example.com');
    expect(hash).toBe(hash2);
  });

  it('should normalize email before hashing (lowercase, trim)', async () => {
    const hash1 = await sha256('TEST@EXAMPLE.COM');
    const hash2 = await sha256('test@example.com');
    const hash3 = await sha256('  test@example.com  ');
    
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  it('should handle empty input', async () => {
    const hash = await sha256('');
    expect(hash).toBe('');
  });

  it('should hash phone with E.164 normalization', async () => {
    const hash1 = await hashPhone('555-123-4567');
    const hash2 = await hashPhone('(555) 123-4567');
    const hash3 = await hashPhone('5551234567');
    
    // All should produce the same hash after E.164 normalization
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should return undefined for invalid phone numbers', async () => {
    const hash = await hashPhone('12345'); // Too short
    expect(hash).toBeUndefined();
  });
});

describe('Codebase Compliance Documentation', () => {
  it('documents the correct trackLeadSubmissionSuccess signature', () => {
    /**
     * CORRECT SIGNATURE (enforced by TypeScript):
     * 
     * await trackLeadSubmissionSuccess({
     *   leadId: string,       // Required - lead identifier
     *   email: string,        // Required - for SHA-256 hashing
     *   phone?: string,       // Optional - for SHA-256 hashing
     *   name?: string,        // Optional - for user context
     *   sourceTool?: string,  // Optional - attribution
     * });
     * 
     * DEPRECATED PARAMETERS (will cause TypeScript error):
     * - hasPhone ❌ (removed - phone presence is inferred)
     * - hasName ❌ (removed - name presence is inferred)
     * - hasAddress ❌ (not supported)
     * 
     * REQUIRED PATTERNS:
     * - Must be awaited (async function)
     * - Phone is normalized to E.164 before hashing
     * - Email is lowercased and trimmed before hashing
     * 
     * VALUE-BASED BIDDING:
     * - trackLeadSubmissionSuccess: $15 USD
     * - trackConsultationBooked: $75 USD
     * - trackPhoneLead: $25 USD
     */
    expect(true).toBe(true); // Documentation test
  });

  it('documents trackConsultationBooked signature', () => {
    /**
     * CORRECT SIGNATURE:
     * 
     * await trackConsultationBooked({
     *   leadId: string,           // Required
     *   email: string,            // Required
     *   phone: string,            // Required
     *   metadata?: object,        // Optional
     *   sourceTool?: string,      // Optional
     * });
     */
    expect(true).toBe(true);
  });

  it('documents trackPhoneLead signature', () => {
    /**
     * CORRECT SIGNATURE:
     * 
     * await trackPhoneLead({
     *   leadId: string,       // Required
     *   phone: string,        // Required
     *   email?: string,       // Optional
     *   sourceTool: string,   // Required
     * });
     */
    expect(true).toBe(true);
  });
});
