/**
 * GTM Tracking Validation Tests (Post-Refactor)
 * 
 * Verifies canonical wmTracking functions:
 * 1. Hardcoded values ($10, $100, $500, $1000, $5000+)
 * 2. meta.category = 'opt' on all OPT events
 * 3. Hashed PII in user_data (Enhanced Conversions)
 * 4. Deduplication guards (scanner upload, qualified lead)
 * 5. Legacy bridge events fire as RT (no value)
 * 
 * Legacy functions (trackLeadSubmissionSuccess, trackBookingConfirmed, etc.)
 * have been removed — all conversion tracking goes through wmTracking.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sha256,
  hashPhone,
} from '../gtm';
import {
  wmLead,
  wmQualifiedLead,
  wmScannerUpload,
  wmAppointmentBooked,
  wmSold,
  wmRetarget,
  wmInternal,
  _resetScannerUploadGuard,
  _resetSessionGuards,
} from '../wmTracking';
import { normalizeToE164 } from '../phoneFormat';

// Mock dataLayer
const mockDataLayer: any[] = [];
const mockSessionStorage: Record<string, string> = {};

beforeEach(() => {
  mockDataLayer.length = 0;
  vi.stubGlobal('dataLayer', mockDataLayer);
  vi.stubGlobal('sessionStorage', {
    getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => { mockSessionStorage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete mockSessionStorage[key]; }),
    clear: vi.fn(),
  });
  _resetScannerUploadGuard();
  Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('wmLead', () => {
  it('should fire wm_lead with $10 value and meta.category=opt', async () => {
    await wmLead(
      { leadId: 'test-lead-1', email: 'test@example.com' },
      { source_tool: 'quote-builder' },
    );

    const event = mockDataLayer.find(e => e.event === 'wm_lead');
    expect(event).toBeDefined();
    expect(event.value).toBe(10);
    expect(event.currency).toBe('USD');
    expect(event.meta.send).toBe(true);
    expect(event.meta.category).toBe('opt');
    expect(event.event_id).toBe('lead:test-lead-1');
  });

  it('should fire legacy bridge lead_submission_success as RT', async () => {
    await wmLead({ leadId: 'bridge-1', email: 'b@test.com' });

    const bridge = mockDataLayer.find(e => e.event === 'lead_submission_success');
    expect(bridge).toBeDefined();
    expect(bridge.meta.category).toBe('rt');
    expect(bridge.value).toBeUndefined();
    expect(bridge.legacy_bridge).toBe(true);
  });

  it('should include hashed user_data for EMQ', async () => {
    await wmLead({
      leadId: 'emq-1',
      email: 'emq@test.com',
      phone: '555-123-4567',
    });

    const event = mockDataLayer.find(e => e.event === 'wm_lead');
    expect(event.user_data).toBeDefined();
    expect(event.user_data.em).toMatch(/^[a-f0-9]{64}$/);
    expect(event.user_data.external_id).toBe('emq-1');
  });
});

describe('wmQualifiedLead', () => {
  it('should fire wm_qualified_lead with $100 value', async () => {
    const fired = await wmQualifiedLead(
      { leadId: 'ql-1', email: 'ql@test.com' },
      { source_tool: 'quiz' },
    );

    expect(fired).toBe(true);
    const event = mockDataLayer.find(e => e.event === 'wm_qualified_lead');
    expect(event).toBeDefined();
    expect(event.value).toBe(100);
    expect(event.meta.category).toBe('opt');
  });

  it('should deduplicate per session', async () => {
    await wmQualifiedLead({ leadId: 'ql-dedup', email: 'ql@test.com' });
    const fired = await wmQualifiedLead({ leadId: 'ql-dedup', email: 'ql@test.com' });

    expect(fired).toBe(false);
    const events = mockDataLayer.filter(e => e.event === 'wm_qualified_lead');
    expect(events).toHaveLength(1);
  });
});

describe('wmScannerUpload', () => {
  it('should fire wm_scanner_upload with $500 value', async () => {
    const eventId = await wmScannerUpload(
      { leadId: 'scan-1', email: 'scan@test.com' },
      'attempt-abc',
    );

    expect(eventId).toBe('upload:attempt-abc');
    const event = mockDataLayer.find(e => e.event === 'wm_scanner_upload');
    expect(event).toBeDefined();
    expect(event.value).toBe(500);
    expect(event.meta.category).toBe('opt');
  });

  it('should deduplicate per scanAttemptId', async () => {
    await wmScannerUpload({ leadId: 'scan-2' } as any, 'attempt-dup');
    const result = await wmScannerUpload({ leadId: 'scan-2' } as any, 'attempt-dup');

    expect(result).toBeNull();
    const events = mockDataLayer.filter(e => e.event === 'wm_scanner_upload');
    expect(events).toHaveLength(1);
  });
});

describe('wmAppointmentBooked', () => {
  it('should fire wm_appointment_booked with $1000 value', async () => {
    await wmAppointmentBooked(
      { leadId: 'appt-1', email: 'appt@test.com' },
      'cal-456',
    );

    const event = mockDataLayer.find(e => e.event === 'wm_appointment_booked');
    expect(event).toBeDefined();
    expect(event.value).toBe(1000);
    expect(event.meta.category).toBe('opt');
    expect(event.event_id).toBe('appt:appt-1:cal-456');
  });
});

describe('wmSold', () => {
  it('should fire wm_sold with $5000 + saleAmount', async () => {
    await wmSold(
      { leadId: 'sold-1', email: 'sold@test.com' },
      12000,
      'deal-789',
    );

    const event = mockDataLayer.find(e => e.event === 'wm_sold');
    expect(event).toBeDefined();
    expect(event.value).toBe(17000); // 5000 + 12000
    expect(event.meta.category).toBe('opt');
    expect(event.event_id).toBe('sold:sold-1:deal-789');
  });
});

describe('wmRetarget', () => {
  it('should fire with meta.category=rt and NO value', () => {
    wmRetarget('wm_tool_completed', { source_tool: 'quiz' });

    const event = mockDataLayer.find(e => e.event === 'wm_tool_completed');
    expect(event).toBeDefined();
    expect(event.meta.category).toBe('rt');
    expect(event.meta.send).toBe(true);
    expect(event.value).toBeUndefined();
    expect(event.currency).toBeUndefined();
  });
});

describe('wmInternal', () => {
  it('should fire with meta.send=false and NO value', () => {
    wmInternal('internal_score_update', { score: 42 });

    const event = mockDataLayer.find(e => e.event === 'internal_score_update');
    expect(event).toBeDefined();
    expect(event.meta.send).toBe(false);
    expect(event.meta.category).toBe('internal');
    expect(event.value).toBeUndefined();
  });
});

describe('SHA-256 Utilities', () => {
  it('should hash email consistently', async () => {
    const hash1 = await sha256('test@example.com');
    const hash2 = await sha256('TEST@Example.COM');
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should normalize phone to E.164 before hashing', async () => {
    const hash1 = await hashPhone('(555) 123-4567');
    const hash2 = await hashPhone('555-123-4567');
    const hash3 = await hashPhone('5551234567');
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  it('should not double-hash already-hashed values', async () => {
    const original = await sha256('test@example.com');
    const doubleHash = await sha256(original);
    expect(doubleHash).toBe(original);
  });
});
