import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuoteScanner } from '../useQuoteScanner';
import type { QuoteAnalysisResult } from '../useQuoteScanner';

// Mock dependencies
vi.mock('@/lib/aiRequest', () => ({
  heavyAIRequest: {
    sendRequest: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSessionData', () => ({
  useSessionData: () => ({
    sessionData: {
      windowCount: 5,
      email: 'test@example.com',
      phone: '555-1234',
    },
    sessionId: 'test-session-id',
    updateField: vi.fn(),
  }),
}));

vi.mock('@/hooks/useLeadIdentity', () => ({
  useLeadIdentity: () => ({
    leadId: 'test-lead-id',
  }),
}));

vi.mock('@/hooks/useTrackToolCompletion', () => ({
  useTrackToolCompletion: () => ({
    trackToolComplete: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCanonicalScore', () => ({
  useCanonicalScore: () => ({
    awardScore: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/lib/highValueSignals', () => ({
  logScannerCompleted: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/tracking/scannerUpload', () => ({
  trackScannerUpload: vi.fn(),
}));

vi.mock('@/lib/gtm', () => ({
  trackQuoteUploadSuccess: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/errors', () => ({
  getErrorMessage: (error: unknown) => 
    error instanceof Error ? error.message : 'Unknown error',
  isRateLimitError: () => false,
}));

// Import mocked modules
import { heavyAIRequest } from '@/lib/aiRequest';
import { trackScannerUpload } from '@/lib/tracking/scannerUpload';
import { trackQuoteUploadSuccess } from '@/lib/gtm';
import { logScannerCompleted } from '@/lib/highValueSignals';

const mockSendRequest = heavyAIRequest.sendRequest as ReturnType<typeof vi.fn>;

const mockAnalysisResult: QuoteAnalysisResult = {
  overallScore: 75,
  safetyScore: 80,
  scopeScore: 70,
  priceScore: 65,
  finePrintScore: 85,
  warrantyScore: 75,
  pricePerOpening: '$650',
  warnings: ['Test warning'],
  missingItems: ['Test missing item'],
  summary: 'Test summary',
};

describe('useQuoteScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendRequest.mockResolvedValue({ data: mockAnalysisResult, error: null });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial state with all values set correctly', () => {
      const { result } = renderHook(() => useQuoteScanner());

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.isDraftingEmail).toBe(false);
      expect(result.current.isDraftingPhoneScript).toBe(false);
      expect(result.current.isAskingQuestion).toBe(false);
      expect(result.current.analysisResult).toBeNull();
      expect(result.current.emailDraft).toBeNull();
      expect(result.current.phoneScript).toBeNull();
      expect(result.current.qaAnswer).toBeNull();
      expect(result.current.imageBase64).toBeNull();
      expect(result.current.mimeType).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('exposes all action functions', () => {
      const { result } = renderHook(() => useQuoteScanner());

      expect(typeof result.current.analyzeQuote).toBe('function');
      expect(typeof result.current.generateEmailDraft).toBe('function');
      expect(typeof result.current.generatePhoneScript).toBe('function');
      expect(typeof result.current.askQuestion).toBe('function');
      expect(typeof result.current.resetScanner).toBe('function');
    });
  });

  describe('analyzeQuote', () => {
    it('sets isAnalyzing to true while analyzing', async () => {
      // Make the request hang
      mockSendRequest.mockImplementation(() => new Promise(() => {}));
      
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      act(() => {
        result.current.analyzeQuote(mockFile);
      });

      expect(result.current.isAnalyzing).toBe(true);
    });

    it('calls trackScannerUpload on file upload', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      expect(trackScannerUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceTool: 'quote-scanner',
          fileName: 'quote.pdf',
          fileSize: mockFile.size,
          fileType: 'application/pdf',
        })
      );
    });

    it('calls edge function with correct parameters', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      expect(mockSendRequest).toHaveBeenCalledWith(
        'quote-scanner',
        expect.objectContaining({
          mode: 'analyze',
          imageBase64: expect.any(String),
          mimeType: 'application/pdf',
          openingCount: 5, // From mocked sessionData
          areaName: 'Florida',
          sessionId: 'test-session-id',
          leadId: 'test-lead-id',
        })
      );
    });

    it('sets analysisResult on successful analysis', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      expect(result.current.analysisResult).toEqual(
        expect.objectContaining({
          overallScore: 75,
          summary: 'Test summary',
        })
      );
      expect(result.current.analysisResult?.analyzedAt).toBeDefined();
    });

    it('tracks conversion signals on success', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      expect(logScannerCompleted).toHaveBeenCalled();
      expect(trackQuoteUploadSuccess).toHaveBeenCalled();
    });

    it('sets isAnalyzing to false after completion', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      expect(result.current.isAnalyzing).toBe(false);
    });

    it('handles errors and sets error state', async () => {
      mockSendRequest.mockResolvedValue({ 
        data: null, 
        error: new Error('Analysis failed') 
      });

      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      expect(result.current.error).toBe('Analysis failed');
      expect(result.current.isAnalyzing).toBe(false);
    });

    it('clears previous drafts when analyzing new quote', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // Set some initial values (simulate previous analysis)
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      // Analyze again
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      // Email and phone drafts should be cleared
      expect(result.current.emailDraft).toBeNull();
      expect(result.current.phoneScript).toBeNull();
      expect(result.current.qaAnswer).toBeNull();
    });
  });

  describe('generateEmailDraft', () => {
    it('does nothing if no analysis result', async () => {
      const { result } = renderHook(() => useQuoteScanner());

      await act(async () => {
        await result.current.generateEmailDraft();
      });

      expect(mockSendRequest).not.toHaveBeenCalled();
    });

    it('sets isDraftingEmail to true while generating', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // First, get an analysis result
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      // Make the next request hang
      mockSendRequest.mockImplementation(() => new Promise(() => {}));

      act(() => {
        result.current.generateEmailDraft();
      });

      expect(result.current.isDraftingEmail).toBe(true);
    });

    it('calls edge function with email mode after analysis', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // First, get an analysis result
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      // Set up mock for email request
      mockSendRequest.mockResolvedValueOnce({ data: { content: 'Draft email' }, error: null });

      await act(async () => {
        await result.current.generateEmailDraft();
      });

      // Should have been called twice: once for analyze, once for email
      expect(mockSendRequest).toHaveBeenCalledTimes(2);
      expect(mockSendRequest).toHaveBeenLastCalledWith(
        'quote-scanner',
        expect.objectContaining({
          mode: 'email',
          analysisContext: expect.any(Object),
        })
      );
    });

    it('sets emailDraft on success', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // First, get an analysis result
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      // Set up mock for email request
      mockSendRequest.mockResolvedValueOnce({ data: { content: 'Draft email content' }, error: null });

      await act(async () => {
        await result.current.generateEmailDraft();
      });

      expect(result.current.emailDraft).toBe('Draft email content');
    });
  });

  describe('generatePhoneScript', () => {
    it('does nothing if no analysis result', async () => {
      mockSendRequest.mockClear();
      const { result } = renderHook(() => useQuoteScanner());

      await act(async () => {
        await result.current.generatePhoneScript();
      });

      expect(mockSendRequest).not.toHaveBeenCalled();
    });

    it('calls edge function with phoneScript mode after analysis', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // First, get an analysis result
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      // Set up mock for phone script request
      mockSendRequest.mockResolvedValueOnce({ data: { content: 'Phone script' }, error: null });

      await act(async () => {
        await result.current.generatePhoneScript();
      });

      expect(mockSendRequest).toHaveBeenLastCalledWith(
        'quote-scanner',
        expect.objectContaining({
          mode: 'phoneScript',
        })
      );
    });

    it('sets phoneScript on success', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // First, get an analysis result
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      // Set up mock for phone script request
      mockSendRequest.mockResolvedValueOnce({ data: { content: 'Phone script content' }, error: null });

      await act(async () => {
        await result.current.generatePhoneScript();
      });

      expect(result.current.phoneScript).toBe('Phone script content');
    });
  });

  describe('askQuestion', () => {
    it('does nothing if no analysis result', async () => {
      mockSendRequest.mockClear();
      const { result } = renderHook(() => useQuoteScanner());

      await act(async () => {
        await result.current.askQuestion('What about the warranty?');
      });

      expect(mockSendRequest).not.toHaveBeenCalled();
    });

    it('does nothing if question is empty', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // First, get an analysis result
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      const callCountBefore = mockSendRequest.mock.calls.length;

      await act(async () => {
        await result.current.askQuestion('');
      });

      expect(mockSendRequest.mock.calls.length).toBe(callCountBefore);
    });

    it('calls edge function with question mode after analysis', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // First, get an analysis result
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      // Set up mock for question request
      mockSendRequest.mockResolvedValueOnce({ data: { content: 'Answer' }, error: null });

      await act(async () => {
        await result.current.askQuestion('Is the permit included?');
      });

      expect(mockSendRequest).toHaveBeenLastCalledWith(
        'quote-scanner',
        expect.objectContaining({
          mode: 'question',
          question: 'Is the permit included?',
        })
      );
    });

    it('sets qaAnswer on success', async () => {
      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // First, get an analysis result
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      // Set up mock for question request
      mockSendRequest.mockResolvedValueOnce({ data: { content: 'Yes, permit is included.' }, error: null });

      await act(async () => {
        await result.current.askQuestion('Is the permit included?');
      });

      expect(result.current.qaAnswer).toBe('Yes, permit is included.');
    });
  });

  describe('resetScanner', () => {
    it('resets all state to initial values', async () => {
      mockSendRequest.mockResolvedValue({ data: mockAnalysisResult, error: null });

      const { result } = renderHook(() => useQuoteScanner());
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });

      // Populate state
      await act(async () => {
        await result.current.analyzeQuote(mockFile);
      });

      expect(result.current.analysisResult).not.toBeNull();

      // Reset
      act(() => {
        result.current.resetScanner();
      });

      expect(result.current.analysisResult).toBeNull();
      expect(result.current.imageBase64).toBeNull();
      expect(result.current.mimeType).toBeNull();
      expect(result.current.emailDraft).toBeNull();
      expect(result.current.phoneScript).toBeNull();
      expect(result.current.qaAnswer).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
