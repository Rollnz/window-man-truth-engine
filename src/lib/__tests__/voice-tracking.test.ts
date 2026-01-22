/**
 * Voice Estimate Confirmed Tracking Tests
 * 
 * Validates EMQ compliance for voice_estimate_confirmed events:
 * - event_id for Meta CAPI deduplication
 * - user_data with hashed PII (em, ph, sha256_email_address, sha256_phone_number)
 * - value + currency for value-based bidding
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { trackVoiceEstimateConfirmed } from '../secondarySignalEvents';

// Mock dataLayer
let mockDataLayer: Record<string, unknown>[] = [];

describe('trackVoiceEstimateConfirmed', () => {
  beforeEach(() => {
    mockDataLayer = [];
    vi.stubGlobal('window', {
      dataLayer: mockDataLayer,
    });
    vi.stubGlobal('crypto', {
      randomUUID: () => 'test-uuid-1234',
      subtle: {
        digest: async (_algo: string, data: ArrayBuffer) => {
          // Simple mock hash - returns consistent 32-byte buffer
          const bytes = new Uint8Array(32);
          const input = new TextDecoder().decode(data);
          for (let i = 0; i < 32; i++) {
            bytes[i] = (input.charCodeAt(i % input.length) + i) % 256;
          }
          return bytes.buffer;
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be an async function that returns a Promise', () => {
    const result = trackVoiceEstimateConfirmed({
      call_duration: 120,
      agent_confidence: 0.95,
    });
    expect(result).toBeInstanceOf(Promise);
  });

  it('should push event with event_id for deduplication', async () => {
    await trackVoiceEstimateConfirmed({
      leadId: 'lead-123',
      call_duration: 180,
      agent_confidence: 0.9,
    });

    expect(mockDataLayer.length).toBeGreaterThan(0);
    const event = mockDataLayer.find(e => e.event === 'voice_estimate_confirmed');
    expect(event).toBeDefined();
    expect(event?.event_id).toBe('test-uuid-1234');
  });

  it('should include value and currency for value-based bidding', async () => {
    await trackVoiceEstimateConfirmed({
      call_duration: 120,
      agent_confidence: 0.85,
    });

    const event = mockDataLayer.find(e => e.event === 'voice_estimate_confirmed');
    expect(event?.value).toBe(30); // VOICE_ESTIMATE_VALUE constant
    expect(event?.currency).toBe('USD');
  });

  it('should include user_data with hashed email when provided', async () => {
    await trackVoiceEstimateConfirmed({
      leadId: 'lead-456',
      email: 'Test@Example.COM',
      call_duration: 240,
      agent_confidence: 0.95,
    });

    const event = mockDataLayer.find(e => e.event === 'voice_estimate_confirmed');
    expect(event?.user_data).toBeDefined();
    
    const userData = event?.user_data as Record<string, unknown>;
    // Both Google (sha256_email_address) and Meta (em) formats
    expect(userData.sha256_email_address).toBeDefined();
    expect(userData.em).toBeDefined();
    expect(userData.sha256_email_address).toBe(userData.em); // Same hash
    expect(typeof userData.sha256_email_address).toBe('string');
    expect((userData.sha256_email_address as string).length).toBe(64); // SHA-256 hex
  });

  it('should include user_data with hashed phone when provided', async () => {
    await trackVoiceEstimateConfirmed({
      leadId: 'lead-789',
      phone_number: '(555) 123-4567',
      call_duration: 300,
      agent_confidence: 0.88,
    });

    const event = mockDataLayer.find(e => e.event === 'voice_estimate_confirmed');
    expect(event?.user_data).toBeDefined();
    
    const userData = event?.user_data as Record<string, unknown>;
    // Both Google (sha256_phone_number) and Meta (ph) formats
    expect(userData.sha256_phone_number).toBeDefined();
    expect(userData.ph).toBeDefined();
    expect(userData.sha256_phone_number).toBe(userData.ph); // Same hash
  });

  it('should include external_id in user_data for identity matching', async () => {
    await trackVoiceEstimateConfirmed({
      leadId: 'lead-external-001',
      call_duration: 150,
      agent_confidence: 0.92,
    });

    const event = mockDataLayer.find(e => e.event === 'voice_estimate_confirmed');
    const userData = event?.user_data as Record<string, unknown>;
    expect(userData.external_id).toBe('lead-external-001');
  });

  it('should include all call metadata', async () => {
    await trackVoiceEstimateConfirmed({
      leadId: 'lead-full',
      email: 'user@test.com',
      phone_number: '5551234567',
      call_duration: 420,
      agent_id: 'agent-001',
      agent_confidence: 0.97,
      estimate_value: 15000,
      estimate_currency: 'USD',
      sentiment_score: 0.85,
      next_step: 'schedule_appointment',
    });

    const event = mockDataLayer.find(e => e.event === 'voice_estimate_confirmed');
    expect(event?.call_duration).toBe(420);
    expect(event?.agent_id).toBe('agent-001');
    expect(event?.agent_confidence).toBe(0.97);
    expect(event?.estimate_value).toBe(15000);
    expect(event?.sentiment_score).toBe(0.85);
    expect(event?.next_step).toBe('schedule_appointment');
  });

  it('should normalize phone to E.164 format', async () => {
    await trackVoiceEstimateConfirmed({
      phone_number: '(561) 468-5571',
      call_duration: 180,
      agent_confidence: 0.9,
    });

    const event = mockDataLayer.find(e => e.event === 'voice_estimate_confirmed');
    expect(event?.phone_e164).toBe('+15614685571');
  });

  it('should handle missing optional PII gracefully', async () => {
    await trackVoiceEstimateConfirmed({
      call_duration: 60,
      agent_confidence: 0.5,
    });

    const event = mockDataLayer.find(e => e.event === 'voice_estimate_confirmed');
    expect(event).toBeDefined();
    
    const userData = event?.user_data as Record<string, unknown>;
    expect(userData.external_id).toBeUndefined(); // No leadId provided
    expect(userData.sha256_email_address).toBeUndefined();
    expect(userData.sha256_phone_number).toBeUndefined();
  });
});

/**
 * EMQ Compliance Checklist for voice_estimate_confirmed
 * 
 * ✅ event_id: UUID for Meta CAPI deduplication
 * ✅ user_data.em: SHA-256 hashed email (Meta format)
 * ✅ user_data.ph: SHA-256 hashed phone in E.164 (Meta format)
 * ✅ user_data.sha256_email_address: SHA-256 hashed email (Google format)
 * ✅ user_data.sha256_phone_number: SHA-256 hashed phone (Google format)
 * ✅ user_data.external_id: Lead ID for cross-platform matching
 * ✅ value: $30 USD for value-based bidding
 * ✅ currency: USD
 */
