/**
 * wmTracking.ts — Canonical Tracking Chokepoint Tests
 *
 * Validates:
 * - OPT events push correct hardcoded value/currency
 * - meta.category and meta.send are correct for each tier
 * - RT events NEVER include value or currency
 * - INTERNAL events have meta.send === false
 * - Event IDs are deterministic where specified
 * - Scanner upload dedupe guard works
 * - QualifiedLead session dedupe + upload suppression
 * - qualifiesForQualifiedLead threshold logic
 * - Legacy bridge events fire as RT (no value)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  wmLead,
  wmQualifiedLead,
  wmScannerUpload,
  wmAppointmentBooked,
  wmSold,
  wmRetarget,
  wmInternal,
  qualifiesForQualifiedLead,
  _resetScannerUploadGuard,
  _resetSessionGuards,
} from '../wmTracking';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

// Mock gtm.ts — intercept all dataLayer pushes
const mockDataLayer: Record<string, unknown>[] = [];

vi.mock('../gtm', () => ({
  trackEvent: vi.fn((eventName: string, data?: Record<string, unknown>) => {
    mockDataLayer.push({ event: eventName, ...data });
  }),
  buildEnhancedUserData: vi.fn(async () => ({
    em: 'hashed_email',
    ph: 'hashed_phone',
    external_id: 'test-lead',
  })),
  generateEventId: vi.fn(() => 'mock-uuid-1234'),
}));

// Mock sessionStorage
const mockSessionStorage = new Map<string, string>();
vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => mockSessionStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockSessionStorage.set(key, value),
  removeItem: (key: string) => mockSessionStorage.delete(key),
});

// ═══════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════

const TEST_LEAD_ID = 'test-lead-abc';

const testIdentity = {
  leadId: TEST_LEAD_ID,
  email: 'user@example.com',
  phone: '+15551234567',
};

beforeEach(() => {
  mockDataLayer.length = 0;
  mockSessionStorage.clear();
  _resetScannerUploadGuard();
  _resetSessionGuards(TEST_LEAD_ID);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// OPT EVENT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('wmLead', () => {
  it('pushes wm_lead with value: 10, currency: USD', async () => {
    await wmLead(testIdentity, { source_tool: 'sample-report' });

    const event = mockDataLayer.find(e => e.event === 'wm_lead');
    expect(event).toBeDefined();
    expect(event!.value).toBe(10);
    expect(event!.currency).toBe('USD');
  });

  it('includes meta.category === "opt" and meta.send === true', async () => {
    await wmLead(testIdentity);

    const event = mockDataLayer.find(e => e.event === 'wm_lead');
    const meta = event!.meta as Record<string, unknown>;
    expect(meta.category).toBe('opt');
    expect(meta.send).toBe(true);
    expect(meta.meta_event_name).toBe('Lead');
  });

  it('uses deterministic event_id: lead:{leadId}', async () => {
    await wmLead(testIdentity);

    const event = mockDataLayer.find(e => e.event === 'wm_lead');
    expect(event!.event_id).toBe(`lead:${TEST_LEAD_ID}`);
  });

  it('fires legacy bridge lead_submission_success as RT (no value)', async () => {
    await wmLead(testIdentity);

    const bridge = mockDataLayer.find(e => e.event === 'lead_submission_success');
    expect(bridge).toBeDefined();
    expect(bridge!.legacy_bridge).toBe(true);
    expect(bridge!.value).toBeUndefined();
    expect(bridge!.currency).toBeUndefined();
    const meta = bridge!.meta as Record<string, unknown>;
    expect(meta.category).toBe('rt');
  });

  it('includes lead_id and external_id from identity', async () => {
    await wmLead(testIdentity);

    const event = mockDataLayer.find(e => e.event === 'wm_lead');
    expect(event!.lead_id).toBe(TEST_LEAD_ID);
    expect(event!.external_id).toBe(TEST_LEAD_ID);
  });
});

describe('wmQualifiedLead', () => {
  it('pushes wm_qualified_lead with value: 100', async () => {
    const fired = await wmQualifiedLead(testIdentity);

    expect(fired).toBe(true);
    const event = mockDataLayer.find(e => e.event === 'wm_qualified_lead');
    expect(event).toBeDefined();
    expect(event!.value).toBe(100);
    expect(event!.currency).toBe('USD');
  });

  it('uses deterministic event_id: ql:{leadId}', async () => {
    await wmQualifiedLead(testIdentity);

    const event = mockDataLayer.find(e => e.event === 'wm_qualified_lead');
    expect(event!.event_id).toBe(`ql:${TEST_LEAD_ID}`);
  });

  it('deduplicates per leadId (second call returns false)', async () => {
    const first = await wmQualifiedLead(testIdentity);
    const second = await wmQualifiedLead(testIdentity);

    expect(first).toBe(true);
    expect(second).toBe(false);
    const events = mockDataLayer.filter(e => e.event === 'wm_qualified_lead');
    expect(events).toHaveLength(1);
  });

  it('allows different leadIds', async () => {
    const first = await wmQualifiedLead({ ...testIdentity, leadId: 'lead-a' });
    const second = await wmQualifiedLead({ ...testIdentity, leadId: 'lead-b' });

    expect(first).toBe(true);
    expect(second).toBe(true);
    const events = mockDataLayer.filter(e => e.event === 'wm_qualified_lead');
    expect(events).toHaveLength(2);
  });

  it('suppressed when scanner upload already fired for this leadId', async () => {
    // Fire scanner upload first
    await wmScannerUpload(testIdentity, 'scan-001');

    const fired = await wmQualifiedLead(testIdentity);
    expect(fired).toBe(false);
  });

  it('fires legacy bridge phone_lead_captured as RT', async () => {
    await wmQualifiedLead(testIdentity);

    const bridge = mockDataLayer.find(e => e.event === 'phone_lead_captured');
    expect(bridge).toBeDefined();
    expect(bridge!.legacy_bridge).toBe(true);
    expect(bridge!.value).toBeUndefined();
  });
});

describe('wmScannerUpload', () => {
  it('pushes wm_scanner_upload with value: 500', async () => {
    const eventId = await wmScannerUpload(testIdentity, 'scan-001');

    expect(eventId).toBe('upload:scan-001');
    const event = mockDataLayer.find(e => e.event === 'wm_scanner_upload');
    expect(event).toBeDefined();
    expect(event!.value).toBe(500);
    expect(event!.currency).toBe('USD');
  });

  it('deduplicates per scanAttemptId (second call returns null)', async () => {
    const first = await wmScannerUpload(testIdentity, 'scan-001');
    const second = await wmScannerUpload(testIdentity, 'scan-001');

    expect(first).toBe('upload:scan-001');
    expect(second).toBeNull();
    const events = mockDataLayer.filter(e => e.event === 'wm_scanner_upload');
    expect(events).toHaveLength(1);
  });

  it('fires for a different scanAttemptId after first', async () => {
    await wmScannerUpload(testIdentity, 'scan-001');
    const second = await wmScannerUpload(testIdentity, 'scan-002');

    expect(second).toBe('upload:scan-002');
    const events = mockDataLayer.filter(e => e.event === 'wm_scanner_upload');
    expect(events).toHaveLength(2);
  });

  it('sets upload-fired session flag so QL is suppressed', async () => {
    await wmScannerUpload(testIdentity, 'scan-001');

    expect(mockSessionStorage.get(`wm_upload_fired:${TEST_LEAD_ID}`)).toBe('1');
  });

  it('fires legacy bridge quote_upload_success as RT', async () => {
    await wmScannerUpload(testIdentity, 'scan-001');

    const bridge = mockDataLayer.find(e => e.event === 'quote_upload_success');
    expect(bridge).toBeDefined();
    expect(bridge!.legacy_bridge).toBe(true);
    expect(bridge!.value).toBeUndefined();
  });
});

describe('wmAppointmentBooked', () => {
  it('pushes wm_appointment_booked with value: 1000', async () => {
    await wmAppointmentBooked(testIdentity, 'appt-id-123');

    const event = mockDataLayer.find(e => e.event === 'wm_appointment_booked');
    expect(event).toBeDefined();
    expect(event!.value).toBe(1000);
    expect(event!.currency).toBe('USD');
  });

  it('uses collision-safe event_id: appt:{leadId}:{appointmentKey}', async () => {
    await wmAppointmentBooked(testIdentity, 'appt-id-123');

    const event = mockDataLayer.find(e => e.event === 'wm_appointment_booked');
    expect(event!.event_id).toBe(`appt:${TEST_LEAD_ID}:appt-id-123`);
  });

  it('falls back to timestamp suffix when no appointmentKey', async () => {
    await wmAppointmentBooked(testIdentity);

    const event = mockDataLayer.find(e => e.event === 'wm_appointment_booked');
    expect((event!.event_id as string).startsWith(`appt:${TEST_LEAD_ID}:`)).toBe(true);
  });

  it('fires legacy bridge booking_confirmed as RT', async () => {
    await wmAppointmentBooked(testIdentity, 'key-1');

    const bridge = mockDataLayer.find(e => e.event === 'booking_confirmed');
    expect(bridge).toBeDefined();
    expect(bridge!.legacy_bridge).toBe(true);
    expect(bridge!.value).toBeUndefined();
  });
});

describe('wmSold', () => {
  it('pushes wm_sold with value: 5000 + saleAmount', async () => {
    await wmSold(testIdentity, 3000, 'deal-456');

    const event = mockDataLayer.find(e => e.event === 'wm_sold');
    expect(event).toBeDefined();
    expect(event!.value).toBe(8000);
    expect(event!.sale_amount).toBe(3000);
  });

  it('uses collision-safe event_id: sold:{leadId}:{dealKey}', async () => {
    await wmSold(testIdentity, 1000, 'deal-456');

    const event = mockDataLayer.find(e => e.event === 'wm_sold');
    expect(event!.event_id).toBe(`sold:${TEST_LEAD_ID}:deal-456`);
  });

  it('clamps negative saleAmount to 0', async () => {
    await wmSold(testIdentity, -500, 'deal-789');

    const event = mockDataLayer.find(e => e.event === 'wm_sold');
    expect(event!.value).toBe(5000); // 5000 + max(0, -500) = 5000
  });

  it('falls back to timestamp suffix when no dealKey', async () => {
    await wmSold(testIdentity, 1000);

    const event = mockDataLayer.find(e => e.event === 'wm_sold');
    expect((event!.event_id as string).startsWith(`sold:${TEST_LEAD_ID}:`)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RT EVENT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('wmRetarget', () => {
  it('NEVER includes value or currency', () => {
    wmRetarget('tool_completed', { source_tool: 'quiz' });

    const event = mockDataLayer.find(e => e.event === 'tool_completed');
    expect(event).toBeDefined();
    expect(event!.value).toBeUndefined();
    expect(event!.currency).toBeUndefined();
  });

  it('includes meta.category === "rt" and meta.send === true', () => {
    wmRetarget('some_event');

    const event = mockDataLayer.find(e => e.event === 'some_event');
    const meta = event!.meta as Record<string, unknown>;
    expect(meta.category).toBe('rt');
    expect(meta.send).toBe(true);
  });

  it('includes source_system and page_path', () => {
    wmRetarget('test_event', { source_tool: 'test' });

    const event = mockDataLayer.find(e => e.event === 'test_event');
    expect(event!.source_system).toBe('website');
  });

  it('passes context properties through', () => {
    wmRetarget('test_event', { source_tool: 'scanner', custom_field: 42 });

    const event = mockDataLayer.find(e => e.event === 'test_event');
    expect(event!.source_tool).toBe('scanner');
    expect(event!.custom_field).toBe(42);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL EVENT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('wmInternal', () => {
  it('includes meta.send === false', () => {
    wmInternal('engagement_score', { total_score: 125 });

    const event = mockDataLayer.find(e => e.event === 'engagement_score');
    expect(event).toBeDefined();
    const meta = event!.meta as Record<string, unknown>;
    expect(meta.send).toBe(false);
    expect(meta.category).toBe('internal');
  });

  it('NEVER includes value or currency', () => {
    wmInternal('HighIntentUser', { total_score: 100 });

    const event = mockDataLayer.find(e => e.event === 'HighIntentUser');
    expect(event!.value).toBeUndefined();
    expect(event!.currency).toBeUndefined();
  });

  it('passes data properties through', () => {
    wmInternal('debug_event', { foo: 'bar', count: 5 });

    const event = mockDataLayer.find(e => e.event === 'debug_event');
    expect(event!.foo).toBe('bar');
    expect(event!.count).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// QUALIFIED LEAD THRESHOLD TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('qualifiesForQualifiedLead', () => {
  it('returns true for 6_15 windows + 30days timeline', () => {
    expect(qualifiesForQualifiedLead({ windowScope: '6_15', timeline: '30days' })).toBe(true);
  });

  it('returns true for whole_house + 90days timeline', () => {
    expect(qualifiesForQualifiedLead({ windowScope: 'whole_house', timeline: '90days' })).toBe(true);
  });

  it('returns true for 16_plus + 30days timeline', () => {
    expect(qualifiesForQualifiedLead({ windowScope: '16_plus', timeline: '30days' })).toBe(true);
  });

  it('returns false for 1_5 windows (too few)', () => {
    expect(qualifiesForQualifiedLead({ windowScope: '1_5', timeline: '30days' })).toBe(false);
  });

  it('returns false for 6months timeline (not urgent)', () => {
    expect(qualifiesForQualifiedLead({ windowScope: '6_15', timeline: '6months' })).toBe(false);
  });

  it('returns false for research timeline (not urgent)', () => {
    expect(qualifiesForQualifiedLead({ windowScope: '6_15', timeline: 'research' })).toBe(false);
  });

  it('returns false when windowScope is null', () => {
    expect(qualifiesForQualifiedLead({ windowScope: null, timeline: '30days' })).toBe(false);
  });

  it('returns false when timeline is null', () => {
    expect(qualifiesForQualifiedLead({ windowScope: '6_15', timeline: null })).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// META FIELD CONSISTENCY
// ═══════════════════════════════════════════════════════════════════════════

describe('meta field structure', () => {
  it('all OPT events include meta with wm_tracking_version', async () => {
    await wmLead({ leadId: 'a', email: 'a@b.com' });
    await wmQualifiedLead({ leadId: 'b', email: 'b@b.com' });
    await wmScannerUpload({ leadId: 'c' }, 'scan-meta');
    await wmAppointmentBooked({ leadId: 'd' }, 'key-1');
    await wmSold({ leadId: 'e' }, 1000, 'deal-1');

    const optEvents = mockDataLayer.filter(e =>
      typeof e.event === 'string' && (e.event as string).startsWith('wm_')
    );

    expect(optEvents.length).toBe(5);
    for (const evt of optEvents) {
      const meta = evt.meta as Record<string, unknown>;
      expect(meta).toBeDefined();
      expect(meta.wm_tracking_version).toBe('1.0.0');
      expect(meta.category).toBe('opt');
      expect(meta.send).toBe(true);
    }
  });

  it('RT events include meta with wm_tracking_version', () => {
    wmRetarget('test_rt');

    const event = mockDataLayer.find(e => e.event === 'test_rt');
    const meta = event!.meta as Record<string, unknown>;
    expect(meta.wm_tracking_version).toBe('1.0.0');
  });

  it('INTERNAL events include meta with wm_tracking_version', () => {
    wmInternal('test_internal');

    const event = mockDataLayer.find(e => e.event === 'test_internal');
    const meta = event!.meta as Record<string, unknown>;
    expect(meta.wm_tracking_version).toBe('1.0.0');
  });
});
