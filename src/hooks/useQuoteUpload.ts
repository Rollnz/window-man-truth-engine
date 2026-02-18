import { useState, useCallback } from 'react';
import { useSessionData } from './useSessionData';
import { useLeadIdentity } from './useLeadIdentity';
import { getAttributionData } from '@/lib/attribution';
import { trackEvent } from '@/lib/gtm';
import { getOrCreateClientId } from '@/lib/tracking';

// Error codes returned by the upload-quote Edge Function
export type UploadErrorCode =
  | 'NO_FILE'
  | 'INVALID_SESSION'
  | 'RATE_LIMITED'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'INVALID_MIME'
  | 'INVALID_FILE_CONTENT'
  | 'UPLOAD_FAILED'
  | 'DB_INSERT_FAILED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR';

export interface UploadResult {
  success: boolean;
  file_id?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  remaining_uploads?: number;
  error_code?: UploadErrorCode;
  message?: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number; // 0-100
  error: string | null;
  errorCode: UploadErrorCode | null;
  lastUpload: UploadResult | null;
}

// Human-readable error messages
const ERROR_MESSAGES: Record<UploadErrorCode, string> = {
  NO_FILE: 'No file was provided. Please select a file.',
  INVALID_SESSION: 'Session expired. Please refresh the page.',
  RATE_LIMITED: 'Too many uploads. Please wait an hour before trying again.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  EMPTY_FILE: 'The file appears to be empty.',
  INVALID_MIME: 'Only PDF, JPEG, and PNG files are accepted.',
  INVALID_FILE_CONTENT: 'File content doesn\'t match the expected format.',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  DB_INSERT_FAILED: 'Failed to save file metadata. Please try again.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

// Allowed file types (client-side validation)
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Handles quote file uploads to the `upload-quote` edge function.
 * Validates file type/size, sends with session + attribution metadata,
 * and returns the upload result with file ID and signed URL.
 */
export function useQuoteUpload() {
  const { sessionId } = useSessionData();
  const { leadId } = useLeadIdentity();
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    errorCode: null,
    lastUpload: null,
  });

  /**
   * Validate file before upload (client-side)
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string; errorCode?: UploadErrorCode } => {
    if (!file) {
      return { valid: false, error: ERROR_MESSAGES.NO_FILE, errorCode: 'NO_FILE' };
    }

    if (file.size === 0) {
      return { valid: false, error: ERROR_MESSAGES.EMPTY_FILE, errorCode: 'EMPTY_FILE' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE, errorCode: 'FILE_TOO_LARGE' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: ERROR_MESSAGES.INVALID_MIME, errorCode: 'INVALID_MIME' };
    }

    return { valid: true };
  }, []);

  /**
   * Upload a file to the upload-quote Edge Function
   */
  const uploadFile = useCallback(async (
    file: File,
    options?: {
      sourcePage?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<UploadResult> => {
    const { sourcePage = 'beat-your-quote', onProgress } = options || {};

    // Track upload started
    trackEvent('quote_upload_started', {
      event_category: 'tool',
      tool_name: 'beat-your-quote',
      file_type: file.type,
      file_size: file.size,
    });

    // Reset state
    setState({
      isUploading: true,
      progress: 0,
      error: null,
      errorCode: null,
      lastUpload: null,
    });

    // Client-side validation
    const validation = validateFile(file);
    if (!validation.valid) {
      const result: UploadResult = {
        success: false,
        error_code: validation.errorCode,
        message: validation.error,
      };

      setState(prev => ({
        ...prev,
        isUploading: false,
        error: validation.error || null,
        errorCode: validation.errorCode || null,
        lastUpload: result,
      }));

      trackEvent('quote_upload_failed', {
        event_category: 'tool',
        tool_name: 'beat-your-quote',
        error_code: validation.errorCode,
      });

      return result;
    }

    // Build form data with attribution and identity (Task C)
    const attribution = getAttributionData();
    const clientId = getOrCreateClientId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    formData.append('source_page', sourcePage);
    
    // Identity pass-through for ledger logging (Task C requirement)
    formData.append('client_id', clientId);
    if (leadId) formData.append('lead_id', leadId);
    
    if (attribution.utm_source) formData.append('utm_source', attribution.utm_source);
    if (attribution.utm_medium) formData.append('utm_medium', attribution.utm_medium);
    if (attribution.utm_campaign) formData.append('utm_campaign', attribution.utm_campaign);

    // Simulate progress (XHR would give real progress, but fetch doesn't)
    const progressInterval = setInterval(() => {
      setState(prev => {
        const newProgress = Math.min(prev.progress + 10, 90);
        onProgress?.(newProgress);
        return { ...prev, progress: newProgress };
      });
    }, 200);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/upload-quote`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const result: UploadResult = await response.json();

      if (result.success) {
        setState({
          isUploading: false,
          progress: 100,
          error: null,
          errorCode: null,
          lastUpload: result,
        });
        onProgress?.(100);

        trackEvent('quote_upload_success', {
          event_category: 'tool',
          tool_name: 'beat-your-quote',
          file_id: result.file_id,
          file_size: result.file_size,
        });
      } else {
        const errorCode = result.error_code || 'INTERNAL_ERROR';
        const errorMessage = ERROR_MESSAGES[errorCode] || result.message || 'Upload failed';

        setState({
          isUploading: false,
          progress: 0,
          error: errorMessage,
          errorCode: errorCode,
          lastUpload: result,
        });

        trackEvent('quote_upload_failed', {
          event_category: 'tool',
          tool_name: 'beat-your-quote',
          error_code: errorCode,
        });
      }

      return result;
    } catch (error) {
      clearInterval(progressInterval);

      const errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      const result: UploadResult = {
        success: false,
        error_code: 'NETWORK_ERROR',
        message: errorMessage,
      };

      setState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        errorCode: 'NETWORK_ERROR',
        lastUpload: result,
      });

      trackEvent('quote_upload_failed', {
        event_category: 'tool',
        tool_name: 'beat-your-quote',
        error_code: 'NETWORK_ERROR',
      });

      console.error('[useQuoteUpload] Upload error:', error);
      return result;
    }
  }, [sessionId, validateFile]);

  /**
   * Reset the upload state
   */
  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      errorCode: null,
      lastUpload: null,
    });
  }, []);

  /**
   * Clear error state only
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      errorCode: null,
    }));
  }, []);

  return {
    // State
    isUploading: state.isUploading,
    progress: state.progress,
    error: state.error,
    errorCode: state.errorCode,
    lastUpload: state.lastUpload,
    
    // Actions
    uploadFile,
    validateFile,
    reset,
    clearError,
    
    // Utilities
    allowedTypes: ALLOWED_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
  };
}
