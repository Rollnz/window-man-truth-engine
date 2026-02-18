import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGatedScanner } from '../useGatedScanner';
import type { AuditAnalysisResult } from '@/types/audit';

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
    },
    sessionId: 'test-session-id',
    updateField: vi.fn(),
  }),
}));

vi.mock('@/hooks/useLeadIdentity', () => ({
  useLeadIdentity: () => ({
    leadId: 'test-lead-id',
    setLeadId: vi.fn(),
  }),
}));

vi.mock('@/hooks/useLeadFormSubmit', () => ({
  useLeadFormSubmit: () => ({
    submit: vi.fn().mockResolvedValue(true),
    isSubmitting: false,
  }),
}));

vi.mock('@/hooks/useCanonicalScore', () => ({
  useCanonicalScore: () => ({
    awardScore: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/lib/tracking/scannerUpload', () => ({
  trackScannerUpload: vi.fn(),
}));

vi.mock('@/lib/gtm', () => ({
  trackEvent: vi.fn(),
  trackModalOpen: vi.fn(),
  trackQuoteUploadSuccess: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/errors', () => ({
  getErrorMessage: (error: unknown) => 
    error instanceof Error ? error.message : 'Unknown error',
}));

// Import mocked modules
import { heavyAIRequest } from '@/lib/aiRequest';
import { trackScannerUpload } from '@/lib/tracking/scannerUpload';
import { trackQuoteUploadSuccess } from '@/lib/gtm';

const mockSendRequest = heavyAIRequest.sendRequest as ReturnType<typeof vi.fn>;
const mockTrackScannerUpload = trackScannerUpload as ReturnType<typeof vi.fn>;
const mockTrackQuoteUploadSuccess = trackQuoteUploadSuccess as ReturnType<typeof vi.fn>;

const mockAnalysisResult: AuditAnalysisResult = {
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
  analyzedAt: new Date().toISOString(),
};

// Mock File object for testing
const createMockFile = (name = 'test.png', type = 'image/png', size = 1024): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock image compression - minimal setup
global.FileReader = class MockFileReader {
  readAsDataURL() {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ 
          target: { 
            result: 'data:image/png;base64,mockbase64data' 
          } 
        } as ProgressEvent<FileReader>);
      }
    }, 0);
  }
} as any;

global.Image = class MockImage {
  onload: (() => void) | null = null;
  width = 100;
  height = 100;
  
  set src(_value: string) {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
} as any;

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  })) as any;
  
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,compressedbase64data');
}

describe('useGatedScanner - Tracking Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendRequest.mockResolvedValue({ data: mockAnalysisResult, error: null });
    mockTrackScannerUpload.mockReturnValue('event-id-123');
    mockTrackQuoteUploadSuccess.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('trackScannerUpload failure handling', () => {
    it('should continue AI analysis even if trackScannerUpload throws', async () => {
      // Setup: Make trackScannerUpload throw an error
      const trackingError = new Error('Network error');
      mockTrackScannerUpload.mockImplementation(() => {
        throw trackingError;
      });

      const { result } = renderHook(() => useGatedScanner());

      // Step 1: Select file
      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileSelect(mockFile);
      });

      expect(result.current.phase).toBe('pre-gate');

      // Step 2: Complete pre-gate
      act(() => {
        result.current.completePreGate();
      });

      expect(result.current.phase).toBe('uploaded');
      expect(result.current.isModalOpen).toBe(true);

      // Step 3: Capture lead (this should trigger AI analysis despite tracking error)
      await act(async () => {
        await result.current.captureLead({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
        });
      });

      // Wait for analysis to complete
      await waitFor(() => {
        expect(result.current.phase).toBe('revealed');
      });

      // Verify: Analysis completed successfully despite tracking error
      expect(result.current.result).toEqual(expect.objectContaining({
        overallScore: 75,
        summary: 'Test summary',
      }));
      expect(result.current.error).toBeNull();
      
      // Verify: AI request was still made
      expect(mockSendRequest).toHaveBeenCalledWith(
        'quote-scanner',
        expect.objectContaining({
          mode: 'analyze',
        })
      );
    });

    it('should log tracking error without affecting user experience', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockTrackScannerUpload.mockImplementation(() => {
        throw new Error('Tracking API timeout');
      });

      const { result } = renderHook(() => useGatedScanner());

      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileSelect(mockFile);
      });

      act(() => {
        result.current.completePreGate();
      });

      await act(async () => {
        await result.current.captureLead({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '555-5678',
        });
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('revealed');
      });

      // Verify: Error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Non-critical] Scanner upload tracking failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('trackQuoteUploadSuccess failure handling', () => {
    it('should complete analysis flow even if trackQuoteUploadSuccess fails', async () => {
      // Setup: Make trackQuoteUploadSuccess reject
      const trackingError = new Error('Meta CAPI error');
      mockTrackQuoteUploadSuccess.mockRejectedValue(trackingError);

      const { result } = renderHook(() => useGatedScanner());

      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileSelect(mockFile);
      });

      act(() => {
        result.current.completePreGate();
      });

      await act(async () => {
        await result.current.captureLead({
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          phone: '555-9999',
        });
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('revealed');
      });

      // Verify: Analysis completed successfully
      expect(result.current.result).toBeTruthy();
      expect(result.current.error).toBeNull();
      
      // Verify: trackQuoteUploadSuccess was called
      expect(mockTrackQuoteUploadSuccess).toHaveBeenCalled();
    });

    it('should log quote upload tracking error silently', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockTrackQuoteUploadSuccess.mockRejectedValue(new Error('GTM timeout'));

      const { result } = renderHook(() => useGatedScanner());

      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileSelect(mockFile);
      });

      act(() => {
        result.current.completePreGate();
      });

      await act(async () => {
        await result.current.captureLead({
          firstName: 'Alice',
          lastName: 'Williams',
          email: 'alice@example.com',
          phone: '555-7777',
        });
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('revealed');
      });

      // Wait a bit for the async catch handler to execute
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify: Error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Non-critical] Quote upload tracking failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Both tracking functions fail', () => {
    it('should complete analysis successfully when both tracking calls fail', async () => {
      // Setup: Make both tracking functions fail
      mockTrackScannerUpload.mockImplementation(() => {
        throw new Error('Scanner tracking failed');
      });
      mockTrackQuoteUploadSuccess.mockRejectedValue(new Error('Quote tracking failed'));

      const { result } = renderHook(() => useGatedScanner());

      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileSelect(mockFile);
      });

      act(() => {
        result.current.completePreGate();
      });

      await act(async () => {
        await result.current.captureLead({
          firstName: 'Charlie',
          lastName: 'Brown',
          email: 'charlie@example.com',
          phone: '555-4444',
        });
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('revealed');
      });

      // Verify: Analysis completed successfully
      expect(result.current.result).toEqual(expect.objectContaining({
        overallScore: 75,
        summary: 'Test summary',
      }));
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
