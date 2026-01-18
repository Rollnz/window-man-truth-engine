import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedUpload } from '../useUnifiedUpload';

// ═══════════════════════════════════════════════════════════════════════════
// Mocks
// ═══════════════════════════════════════════════════════════════════════════

// Mock useSessionData
vi.mock('../useSessionData', () => ({
  useSessionData: () => ({
    sessionId: 'test-session-id-1234',
    sessionData: {},
    updateField: vi.fn(),
    updateFields: vi.fn(),
    markToolCompleted: vi.fn(),
    isToolCompleted: vi.fn(() => false),
    clearSession: vi.fn(),
    getPrefilledValue: vi.fn(),
    hasExistingData: false,
  }),
}));

// Mock GTM tracking
vi.mock('@/lib/gtm', () => ({
  trackEvent: vi.fn(),
}));

// Mock attribution
vi.mock('@/lib/attribution', () => ({
  getAttributionData: vi.fn(() => ({})),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ═══════════════════════════════════════════════════════════════════════════
// Test Utilities
// ═══════════════════════════════════════════════════════════════════════════

function createMockFile(name: string, size: number, type: string): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
}

function mockSuccessfulDocumentUpload() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      file_path: 'anon/test-session/insurance-policy/123-doc.pdf',
    }),
  });
}

function mockSuccessfulQuoteUpload() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      file_id: 'quote-file-id-123',
      file_path: 'quotes/test-session/quote.pdf',
      file_name: 'test-quote.pdf',
      file_size: 1024,
      remaining_uploads: 4,
    }),
  });
}

function mockFailedUpload(errorCode: string, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({
      success: false,
      error_code: errorCode,
      message,
    }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('useUnifiedUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Initial State', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useUnifiedUpload());

      expect(result.current.state).toEqual({
        kind: null,
        stage: 'idle',
        progress: 0,
        errorCode: null,
        errorMessage: null,
        lastResult: null,
        isUploading: false,
      });
    });

    it('should expose quote and document constants', () => {
      const { result } = renderHook(() => useUnifiedUpload());

      expect(result.current.quote.allowedTypes).toContain('application/pdf');
      expect(result.current.quote.maxFileSize).toBe(10 * 1024 * 1024);
      expect(result.current.quote.maxFileSizeMB).toBe(10);

      expect(result.current.document.allowedTypes).toContain('application/pdf');
      expect(result.current.document.allowedTypes).toContain('image/heic');
      expect(result.current.document.maxFileSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('validateFile routing', () => {
    it('should validate document files using document hook validation', () => {
      const { result } = renderHook(() => useUnifiedUpload());
      const validFile = createMockFile('test.pdf', 1024, 'application/pdf');

      const validation = result.current.validateFile({
        kind: 'document',
        file: validFile,
        documentType: 'insurance-policy',
      });

      expect(validation.ok).toBe(true);
    });

    it('should validate quote files using quote hook validation', () => {
      const { result } = renderHook(() => useUnifiedUpload());
      const validFile = createMockFile('quote.pdf', 1024, 'application/pdf');

      const validation = result.current.validateFile({
        kind: 'quote',
        file: validFile,
      });

      expect(validation.ok).toBe(true);
    });

    it('should reject empty document files', () => {
      const { result } = renderHook(() => useUnifiedUpload());
      const emptyFile = createMockFile('empty.pdf', 0, 'application/pdf');

      const validation = result.current.validateFile({
        kind: 'document',
        file: emptyFile,
        documentType: 'insurance-policy',
      });

      expect(validation.ok).toBe(false);
      expect(validation.errorCode).toBe('EMPTY_FILE');
    });

    it('should reject oversized files', () => {
      const { result } = renderHook(() => useUnifiedUpload());
      const bigFile = createMockFile('big.pdf', 15 * 1024 * 1024, 'application/pdf');

      const validation = result.current.validateFile({
        kind: 'document',
        file: bigFile,
        documentType: 'insurance-policy',
      });

      expect(validation.ok).toBe(false);
      expect(validation.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('should reject invalid MIME types for documents', () => {
      const { result } = renderHook(() => useUnifiedUpload());
      const invalidFile = createMockFile('test.exe', 1024, 'application/x-msdownload');

      const validation = result.current.validateFile({
        kind: 'document',
        file: invalidFile,
        documentType: 'insurance-policy',
      });

      expect(validation.ok).toBe(false);
      expect(validation.errorCode).toBe('INVALID_MIME');
    });

    it('should accept HEIC for documents but not for quotes', () => {
      const { result } = renderHook(() => useUnifiedUpload());
      const heicFile = createMockFile('photo.heic', 1024, 'image/heic');

      // Document accepts HEIC
      const docValidation = result.current.validateFile({
        kind: 'document',
        file: heicFile,
        documentType: 'damage-photos',
      });
      expect(docValidation.ok).toBe(true);

      // Quote does NOT accept HEIC (only PDF, JPEG, PNG)
      const quoteValidation = result.current.validateFile({
        kind: 'quote',
        file: heicFile,
      });
      expect(quoteValidation.ok).toBe(false);
    });
  });

  describe('upload routing - Document path', () => {
    it('should route document uploads to upload-document endpoint', async () => {
      mockSuccessfulDocumentUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('policy.pdf', 1024, 'application/pdf');

      await act(async () => {
        await result.current.upload({
          kind: 'document',
          file,
          documentType: 'insurance-policy',
          sourceTool: 'claim-survival',
        });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/upload-document'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should set kind to document on document upload', async () => {
      mockSuccessfulDocumentUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('policy.pdf', 1024, 'application/pdf');

      await act(async () => {
        await result.current.upload({
          kind: 'document',
          file,
          documentType: 'insurance-policy',
        });
      });

      expect(result.current.state.kind).toBe('document');
    });

    it('should normalize document upload result', async () => {
      mockSuccessfulDocumentUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('policy.pdf', 1024, 'application/pdf');

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.upload({
          kind: 'document',
          file,
          documentType: 'insurance-policy',
        });
      });

      expect(uploadResult).toMatchObject({
        success: true,
        kind: 'document',
        filePath: expect.stringContaining('anon/'),
        originalFileName: 'policy.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
      });
      expect(uploadResult.raw).toBeDefined();
    });
  });

  describe('upload routing - Quote path', () => {
    it('should route quote uploads to upload-quote endpoint', async () => {
      mockSuccessfulQuoteUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('quote.pdf', 1024, 'application/pdf');

      await act(async () => {
        await result.current.upload({
          kind: 'quote',
          file,
          sourceTool: 'beat-your-quote',
        });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/upload-quote'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should set kind to quote on quote upload', async () => {
      mockSuccessfulQuoteUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('quote.pdf', 1024, 'application/pdf');

      await act(async () => {
        await result.current.upload({
          kind: 'quote',
          file,
        });
      });

      expect(result.current.state.kind).toBe('quote');
    });

    it('should normalize quote upload result (file_path → filePath)', async () => {
      mockSuccessfulQuoteUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('quote.pdf', 1024, 'application/pdf');

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.upload({
          kind: 'quote',
          file,
        });
      });

      expect(uploadResult).toMatchObject({
        success: true,
        kind: 'quote',
        filePath: expect.stringContaining('quotes/'),
        originalFileName: 'test-quote.pdf',
        fileSize: 1024,
      });
      expect(uploadResult.raw).toBeDefined();
      expect(uploadResult.raw.file_id).toBe('quote-file-id-123');
    });
  });

  describe('State transitions', () => {
    it('should transition through stages: idle → validating → sending → done', async () => {
      mockSuccessfulDocumentUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('doc.pdf', 1024, 'application/pdf');

      expect(result.current.state.stage).toBe('idle');

      await act(async () => {
        const uploadPromise = result.current.upload({
          kind: 'document',
          file,
          documentType: 'insurance-policy',
        });

        // During upload, should be uploading
        expect(result.current.state.isUploading).toBe(true);

        await uploadPromise;
      });

      expect(result.current.state.stage).toBe('done');
      expect(result.current.state.progress).toBe(100);
      expect(result.current.state.isUploading).toBe(false);
    });

    it('should transition to error state on failure', async () => {
      mockFailedUpload('RATE_LIMITED', 'Too many uploads');
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('doc.pdf', 1024, 'application/pdf');

      await act(async () => {
        await result.current.upload({
          kind: 'document',
          file,
          documentType: 'insurance-policy',
        });
      });

      expect(result.current.state.stage).toBe('error');
      expect(result.current.state.errorCode).toBe('RATE_LIMITED');
      expect(result.current.state.isUploading).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      mockSuccessfulDocumentUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('doc.pdf', 1024, 'application/pdf');

      // First, do an upload
      await act(async () => {
        await result.current.upload({
          kind: 'document',
          file,
          documentType: 'insurance-policy',
        });
      });

      expect(result.current.state.kind).toBe('document');
      expect(result.current.state.stage).toBe('done');

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toEqual({
        kind: null,
        stage: 'idle',
        progress: 0,
        errorCode: null,
        errorMessage: null,
        lastResult: null,
        isUploading: false,
      });
    });

    it('should reset after error state', async () => {
      mockFailedUpload('UPLOAD_FAILED', 'Storage error');
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('doc.pdf', 1024, 'application/pdf');

      await act(async () => {
        await result.current.upload({
          kind: 'document',
          file,
          documentType: 'insurance-policy',
        });
      });

      expect(result.current.state.stage).toBe('error');

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.stage).toBe('idle');
      expect(result.current.state.errorCode).toBeNull();
    });
  });

  describe('Result normalization', () => {
    it('should include raw result from underlying hook', async () => {
      mockSuccessfulQuoteUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('quote.pdf', 1024, 'application/pdf');

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.upload({
          kind: 'quote',
          file,
        });
      });

      // raw should contain the original result
      expect(uploadResult.raw).toMatchObject({
        success: true,
        file_id: 'quote-file-id-123',
        file_path: 'quotes/test-session/quote.pdf',
        remaining_uploads: 4,
      });
    });

    it('should normalize error results correctly', async () => {
      mockFailedUpload('INVALID_FILE_CONTENT', 'File appears corrupted');
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('bad.pdf', 1024, 'application/pdf');

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.upload({
          kind: 'document',
          file,
          documentType: 'insurance-policy',
        });
      });

      expect(uploadResult).toMatchObject({
        success: false,
        kind: 'document',
        errorCode: 'INVALID_FILE_CONTENT',
      });
    });
  });

  describe('No side effects in wrapper', () => {
    it('should not add Authorization headers (anonymous upload)', async () => {
      mockSuccessfulDocumentUpload();
      const { result } = renderHook(() => useUnifiedUpload());
      const file = createMockFile('doc.pdf', 1024, 'application/pdf');

      await act(async () => {
        await result.current.upload({
          kind: 'document',
          file,
          documentType: 'insurance-policy',
        });
      });

      // Check that no Authorization header was sent
      const fetchCall = mockFetch.mock.calls[0];
      const requestInit = fetchCall[1];
      
      // For document upload, no headers should be set (FormData handles it)
      // The absence of headers object or Authorization key confirms anonymous upload
      if (requestInit?.headers) {
        expect(requestInit.headers.Authorization).toBeUndefined();
      }
    });
  });
});
