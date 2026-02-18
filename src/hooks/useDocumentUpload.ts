import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSessionData } from './useSessionData';
import { getOrCreateClientId } from '@/lib/tracking';

// ═══════════════════════════════════════════════════════════════════════════
// Types (exported for consumers)
// ═══════════════════════════════════════════════════════════════════════════

export type UploadStage =
  | 'idle'
  | 'validating'
  | 'sending'
  | 'processing'
  | 'done'
  | 'error';

export type DocumentUploadParams = {
  file: File;
  documentType: string;
  leadId?: string | null;
  sourceTool?: string;
};

export type DocumentUploadResult = {
  success: boolean;
  filePath?: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type DocumentUploadState = {
  stage: UploadStage;
  progress: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  lastResult?: DocumentUploadResult | null;
  isUploading: boolean;
};

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
];
const UPLOAD_TIMEOUT_MS = 25000; // 25 seconds
const SESSION_STORAGE_KEY = 'wm-session-id';

// UUID v4 regex for validation
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ═══════════════════════════════════════════════════════════════════════════
// Error Messages
// ═══════════════════════════════════════════════════════════════════════════

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMITED: 'Too many uploads. Please wait and try again.',
  FILE_TOO_LARGE: 'File is too large (max 10MB).',
  EMPTY_FILE: 'This file appears to be empty.',
  INVALID_MIME: 'Invalid file type. Use PDF, JPG, PNG, HEIC, or WebP.',
  INVALID_FILE_CONTENT: 'File appears corrupted or misnamed.',
  INVALID_SESSION: 'Session expired. Please refresh the page.',
  INVALID_DOC_TYPE: 'Invalid document type.',
  SERVICE_UNAVAILABLE: 'Upload service is temporarily unavailable. Please try again.',
  UPLOAD_FAILED: 'Failed to store file. Please try again.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
  METHOD_NOT_ALLOWED: 'Invalid request method.',
  TIMEOUT: 'Upload timed out. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
};

function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || 'Upload failed. Please try again.';
}

// ═══════════════════════════════════════════════════════════════════════════
// Session ID Helper
// ═══════════════════════════════════════════════════════════════════════════

function isValidUUID(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}

function getOrCreateSessionId(providedSessionId?: string): string {
  // If valid UUID provided, use it
  if (providedSessionId && isValidUUID(providedSessionId)) {
    return providedSessionId;
  }

  // Check localStorage
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored && isValidUUID(stored)) {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  // Generate new UUID and persist
  const newId = crypto.randomUUID();
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, newId);
  } catch {
    console.warn('[useDocumentUpload] Failed to persist sessionId');
  }

  return newId;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Helper
// ═══════════════════════════════════════════════════════════════════════════

export function validateFile(file: File): {
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  // Empty file check
  if (file.size === 0) {
    return {
      ok: false,
      errorCode: 'EMPTY_FILE',
      errorMessage: getErrorMessage('EMPTY_FILE'),
    };
  }

  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      errorCode: 'FILE_TOO_LARGE',
      errorMessage: getErrorMessage('FILE_TOO_LARGE'),
    };
  }

  // MIME type check
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      ok: false,
      errorCode: 'INVALID_MIME',
      errorMessage: getErrorMessage('INVALID_MIME'),
    };
  }

  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════════════════

const INITIAL_STATE: DocumentUploadState = {
  stage: 'idle',
  progress: 0,
  errorCode: null,
  errorMessage: null,
  lastResult: null,
  isUploading: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// Hook Implementation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handles multi-stage document uploads (validate → send → process → done).
 * Tracks upload progress, errors, and integrates with session/lead identity.
 */
export function useDocumentUpload(): {
  state: DocumentUploadState;
  upload: (params: DocumentUploadParams) => Promise<DocumentUploadResult>;
  reset: () => void;
  validateFile: typeof validateFile;
  allowedTypes: string[];
  maxFileSize: number;
  maxFileSizeMB: number;
} {
  const { sessionId: hookSessionId } = useSessionData();
  const [state, setState] = useState<DocumentUploadState>(INITIAL_STATE);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoize sessionId to prevent re-reads
  const sessionId = useMemo(
    () => getOrCreateSessionId(hookSessionId),
    [hookSessionId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Clear all refs helper
  const clearRefs = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    clearRefs();
    setState(INITIAL_STATE);
  }, [clearRefs]);

  // Upload function
  const upload = useCallback(
    async (params: DocumentUploadParams): Promise<DocumentUploadResult> => {
      const { file, documentType, leadId, sourceTool } = params;

      // ─────────────────────────────────────────────────────────────────────
      // Step 1: Validate sessionId
      // ─────────────────────────────────────────────────────────────────────
      if (!isValidUUID(sessionId)) {
        const result: DocumentUploadResult = {
          success: false,
          errorCode: 'INVALID_SESSION',
          errorMessage: getErrorMessage('INVALID_SESSION'),
        };
        setState({
          stage: 'error',
          progress: 0,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          lastResult: result,
          isUploading: false,
        });
        return result;
      }

      // ─────────────────────────────────────────────────────────────────────
      // Step 2: Client-side file validation
      // ─────────────────────────────────────────────────────────────────────
      setState({
        stage: 'validating',
        progress: 10,
        errorCode: null,
        errorMessage: null,
        lastResult: null,
        isUploading: true,
      });

      const validation = validateFile(file);
      if (!validation.ok) {
        const result: DocumentUploadResult = {
          success: false,
          errorCode: validation.errorCode,
          errorMessage: validation.errorMessage,
        };
        setState({
          stage: 'error',
          progress: 10, // Keep progress where it was
          errorCode: result.errorCode || null,
          errorMessage: result.errorMessage || null,
          lastResult: result,
          isUploading: false,
        });
        return result;
      }

      // ─────────────────────────────────────────────────────────────────────
      // Step 3: Prepare fetch with abort controller and timeout
      // ─────────────────────────────────────────────────────────────────────
      abortControllerRef.current = new AbortController();
      
      // Set up timeout watchdog
      timeoutRef.current = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, UPLOAD_TIMEOUT_MS);

      // ─────────────────────────────────────────────────────────────────────
      // Step 4: Build FormData and send
      // ─────────────────────────────────────────────────────────────────────
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('documentType', documentType);
      formData.append('clientId', getOrCreateClientId()); // Task C: Identity pass-through
      if (leadId) formData.append('leadId', leadId);
      if (sourceTool) formData.append('sourceTool', sourceTool);

      setState((prev) => ({
        ...prev,
        stage: 'sending',
        progress: 30,
      }));

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`,
          {
            method: 'POST',
            body: formData,
            signal: abortControllerRef.current.signal,
            // NO Authorization header - anonymous upload
          }
        );

        // Clear timeout on response received
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Step 5: Parse response - THEN set processing stage
        // ─────────────────────────────────────────────────────────────────────
        let data: {
          success?: boolean;
          file_path?: string;
          error_code?: string;
          message?: string;
        };
        
        try {
          data = await response.json();
        } catch {
          // JSON parse error
          const result: DocumentUploadResult = {
            success: false,
            errorCode: 'INTERNAL_ERROR',
            errorMessage: getErrorMessage('INTERNAL_ERROR'),
          };
          setState({
            stage: 'error',
            progress: 30,
            errorCode: result.errorCode || null,
            errorMessage: result.errorMessage || null,
            lastResult: result,
            isUploading: false,
          });
          return result;
        }

        // NOW set processing stage (after response.json() completes)
        setState((prev) => ({
          ...prev,
          stage: 'processing',
          progress: 70,
        }));

        // ─────────────────────────────────────────────────────────────────────
        // Step 6: Handle response
        // ─────────────────────────────────────────────────────────────────────
        if (!response.ok || !data.success) {
          const errorCode = data.error_code || 'UPLOAD_FAILED';
          const result: DocumentUploadResult = {
            success: false,
            errorCode,
            errorMessage: getErrorMessage(errorCode),
          };
          setState({
            stage: 'error',
            progress: 70,
            errorCode: result.errorCode || null,
            errorMessage: result.errorMessage || null,
            lastResult: result,
            isUploading: false,
          });
          return result;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Step 7: Success
        // ─────────────────────────────────────────────────────────────────────
        const result: DocumentUploadResult = {
          success: true,
          filePath: data.file_path,
          originalFileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        };

        setState({
          stage: 'done',
          progress: 100,
          errorCode: null,
          errorMessage: null,
          lastResult: result,
          isUploading: false,
        });

        return result;
      } catch (error) {
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        console.error('[useDocumentUpload] Upload error:', error);

        let errorCode = 'INTERNAL_ERROR';
        
        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          errorCode = 'TIMEOUT';
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
          errorCode = 'NETWORK_ERROR';
        }

        const result: DocumentUploadResult = {
          success: false,
          errorCode,
          errorMessage: getErrorMessage(errorCode),
        };

        setState((prev) => ({
          stage: 'error',
          progress: prev.progress, // Keep progress where it was
          errorCode: result.errorCode || null,
          errorMessage: result.errorMessage || null,
          lastResult: result,
          isUploading: false,
        }));

        return result;
      }
    },
    [sessionId, clearRefs]
  );

  return {
    state,
    upload,
    reset,
    validateFile,
    allowedTypes: ALLOWED_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE_MB,
  };
}
