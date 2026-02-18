/**
 * Lead Capture Integration Tests (Post-Refactor)
 * 
 * Verifies the canonical wmTracking pipeline:
 * 1. wmLead fires with hardcoded $10 value
 * 2. wmAppointmentBooked fires with hardcoded $1000 value
 * 3. All events include meta.category='opt' for GTM firewall
 * 4. Legacy lead_submission_success bridge fires as RT (no value)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  trackLeadCapture,
} from '../gtm';
import { wmLead, wmAppointmentBooked, _resetScannerUploadGuard } from '../wmTracking';
import { setLeadAnchor, getLeadAnchor, clearLeadAnchor } from '../leadAnchor';
import { setExplicitSubmission, hasExplicitSubmission, clearExplicitSubmission } from '../consent';

// Mock dataLayer
let mockDataLayer: Record<string, unknown>[] = [];

// Mock localStorage / sessionStorage for deduplication
const mockSessionStorage: Record<string, string> = {};

describe('Lead Capture Integration Flow', () => {
  beforeEach(() => {
    mockDataLayer = [];
    vi.stubGlobal('dataLayer', mockDataLayer);
    
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => { mockSessionStorage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete mockSessionStorage[key]; }),
      clear: vi.fn(() => { Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key]); }),
    });

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    clearLeadAnchor();
    clearExplicitSubmission();
    _resetScannerUploadGuard();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key]);
  });

  describe('Golden Thread: Lead Identity Persistence', () => {
    it('should persist leadId via setLeadAnchor after form submission', () => {
      const leadId = '550e8400-e29b-41d4-a716-446655440000';
      setLeadAnchor(leadId);
      const retrievedLeadId = getLeadAnchor();
      expect(retrievedLeadId).toBe(leadId);
    });

    it('should enable explicit submission tracking after successful POST', () => {
      const leadId = '660e8400-e29b-41d4-a716-446655440001';
      expect(hasExplicitSubmission()).toBe(false);
      setExplicitSubmission(leadId);
      expect(hasExplicitSubmission()).toBe(true);
    });
  });

  describe('Canonical wmLead Flow', () => {
    it('should fire wm_lead with hardcoded $10 value', async () => {
      const leadId = 'wm-lead-test-001';
      const email = 'test@test.com';

      await wmLead(
        { leadId, email },
        { source_tool: 'quote-builder' },
      );

      const event = mockDataLayer.find(e => e.event === 'wm_lead');
      expect(event).toBeDefined();
      expect(event?.value).toBe(10);
      expect(event?.currency).toBe('USD');
      expect(event?.external_id).toBe(leadId);

      // Verify meta firewall contract
      const meta = event?.meta as Record<string, unknown>;
      expect(meta?.send).toBe(true);
      expect(meta?.category).toBe('opt');
    });

    it('should fire legacy bridge as RT (no value)', async () => {
      const leadId = 'wm-lead-bridge-002';

      await wmLead(
        { leadId, email: 'bridge@test.com' },
        { source_tool: 'quote-builder' },
      );

      const bridgeEvent = mockDataLayer.find(e => e.event === 'lead_submission_success');
      expect(bridgeEvent).toBeDefined();

      // Bridge must be RT — no value/currency
      const meta = bridgeEvent?.meta as Record<string, unknown>;
      expect(meta?.category).toBe('rt');
      expect(bridgeEvent?.value).toBeUndefined();
      expect(bridgeEvent?.currency).toBeUndefined();
    });

    it('should use deterministic event_id format lead:{leadId}', async () => {
      const leadId = 'deterministic-id-003';

      await wmLead(
        { leadId, email: 'det@test.com' },
        { source_tool: 'quote-builder' },
      );

      const event = mockDataLayer.find(e => e.event === 'wm_lead');
      expect(event?.event_id).toBe(`lead:${leadId}`);
    });
  });

  describe('Canonical wmAppointmentBooked Flow', () => {
    it('should fire wm_appointment_booked with hardcoded $1000 value', async () => {
      const leadId = 'appt-test-004';

      await wmAppointmentBooked(
        { leadId, email: 'appt@test.com', phone: '555-111-2222' },
        'cal-123',
        { source_tool: 'consultation-modal' },
      );

      const event = mockDataLayer.find(e => e.event === 'wm_appointment_booked');
      expect(event).toBeDefined();
      expect(event?.value).toBe(1000);
      expect(event?.currency).toBe('USD');

      const meta = event?.meta as Record<string, unknown>;
      expect(meta?.send).toBe(true);
      expect(meta?.category).toBe('opt');
    });
  });

  describe('trackLeadCapture still works (internal analytics)', () => {
    it('should fire lead_captured with metadata', async () => {
      const leadId = 'lead-captured-005';
      const email = 'captured@test.com';

      await trackLeadCapture(
        { leadId, sourceTool: 'quote_builder', conversionAction: 'form_submit' },
        email,
      );

      const event = mockDataLayer.find(e => e.event === 'lead_captured');
      expect(event).toBeDefined();
      expect(event?.lead_score).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle wmLead with minimal data', async () => {
      await wmLead(
        { leadId: 'minimal-006', email: 'min@test.com' },
      );

      const event = mockDataLayer.find(e => e.event === 'wm_lead');
      expect(event).toBeDefined();
      expect(event?.value).toBe(10);
    });
  });
});

/**
 * Integration Test Coverage Summary (Post-Refactor)
 * 
 * ✅ Golden Thread: Lead identity persistence via leadAnchor
 * ✅ Explicit Submission: PII tracking enablement
 * ✅ wmLead: $10 hardcoded value, meta.category='opt'
 * ✅ Legacy bridge: lead_submission_success fires as RT (no value)
 * ✅ Deterministic event_id: lead:{leadId} format
 * ✅ wmAppointmentBooked: $1000 hardcoded value
 * ✅ trackLeadCapture: Internal analytics still works
 * ✅ Error Handling: Graceful minimal data
 */
