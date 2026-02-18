import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────

// wmTracking – the functions under test
const mockWmScannerUpload = vi.fn();
vi.mock('@/lib/wmTracking', () => ({
  wmScannerUpload: (...args: unknown[]) => mockWmScannerUpload(...args),
}));

// Canonical score
const mockAwardScore = vi.fn();
vi.mock('@/hooks/useCanonicalScore', () => ({
  useCanonicalScore: () => ({ awardScore: mockAwardScore }),
}));

// heavyAIRequest – always succeeds
vi.mock('@/lib/aiRequest', () => ({
  heavyAIRequest: {
    sendRequest: vi.fn().mockResolvedValue({
      data: {
        overallScore: 72,
        warnings: [],
        missingItems: [],
        priceScore: 80,
        scopeScore: 70,
        warrantyScore: 65,
        finePrintScore: 75,
        safetyScore: 90,
      },
      error: null,
    }),
  },
}));

// Lead form submit – always succeeds
vi.mock('@/hooks/useLeadFormSubmit', () => ({
  useLeadFormSubmit: () => ({
    submit: vi.fn().mockResolvedValue(true),
    isSubmitting: false,
  }),
}));

// Session / identity stubs
vi.mock('@/hooks/useSessionData', () => ({
  useSessionData: () => ({
    sessionData: { windowCount: 5 },
    sessionId: 'test-session',
    updateField: vi.fn(),
  }),
}));

vi.mock('@/hooks/useLeadIdentity', () => ({
  useLeadIdentity: () => ({
    leadId: 'test-lead-id',
    setLeadId: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/gtm', () => ({
  trackEvent: vi.fn(),
  trackModalOpen: vi.fn(),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react';
import { useGatedScanner } from '../useGatedScanner';

// Helper to create a tiny test file
function makeFile() {
  // 1x1 white PNG (base64)
  const base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return new File([bytes], 'test-quote.png', { type: 'image/png' });
}

describe('useGatedScanner – fire-and-forget tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWmScannerUpload.mockResolvedValue(undefined);
    mockAwardScore.mockResolvedValue(undefined);
  });

  it('AI analysis succeeds when pre-analysis wmScannerUpload rejects', async () => {
    mockWmScannerUpload.mockRejectedValue(new Error('tracking down'));

    const { result } = renderHook(() => useGatedScanner());

    // Upload file → pre-gate
    act(() => result.current.handleFileSelect(makeFile()));
    expect(result.current.phase).toBe('pre-gate');

    // Complete pre-gate → uploaded
    act(() => result.current.completePreGate());
    expect(result.current.phase).toBe('uploaded');

    // Capture lead → should reach 'revealed' despite tracking failure
    await act(async () => {
      await result.current.captureLead({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '5551234567',
      });
    });

    expect(result.current.phase).toBe('revealed');
    expect(result.current.result).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('result reveal succeeds when awardScore rejects', async () => {
    mockAwardScore.mockRejectedValue(new Error('score API down'));

    const { result } = renderHook(() => useGatedScanner());

    act(() => result.current.handleFileSelect(makeFile()));
    act(() => result.current.completePreGate());

    await act(async () => {
      await result.current.captureLead({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '5551234567',
      });
    });

    expect(result.current.phase).toBe('revealed');
    expect(result.current.error).toBeNull();
  });

  it('analysis succeeds when all three non-critical calls reject simultaneously', async () => {
    mockWmScannerUpload.mockRejectedValue(new Error('tracking down'));
    mockAwardScore.mockRejectedValue(new Error('score API down'));

    const { result } = renderHook(() => useGatedScanner());

    act(() => result.current.handleFileSelect(makeFile()));
    act(() => result.current.completePreGate());

    await act(async () => {
      await result.current.captureLead({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '5551234567',
      });
    });

    expect(result.current.phase).toBe('revealed');
    expect(result.current.result).not.toBeNull();
    expect(result.current.error).toBeNull();
    // Both wmScannerUpload calls fired (pre + post analysis)
    expect(mockWmScannerUpload).toHaveBeenCalledTimes(2);
    expect(mockAwardScore).toHaveBeenCalledTimes(1);
  });
});
