import { useState, useCallback, useMemo } from 'react';
import { useQuoteUpload } from './useQuoteUpload';
import { useDocumentUpload, type DocumentUploadResult } from './useDocumentUpload';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type UnifiedUploadKind = 'quote' | 'document';

export type UnifiedUploadStage =
  | 'idle'
  | 'validating'
  | 'sending'
  | 'processing'
  | 'done'
  | 'error';

export type UnifiedUploadState = {
  kind: UnifiedUploadKind | null;
  stage: UnifiedUploadStage;
  progress: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  lastResult?: UnifiedUploadResult | null;
  isUploading: boolean;
};

export type QuoteUploadParams = {
  kind: 'quote';
  file: File;
  sourceTool?: string;
  leadId?: string | null;
};

export type DocumentUploadParams = {
  kind: 'document';
  file: File;
  documentType: string;
  sourceTool?: string;
  leadId?: string | null;
};

export type UnifiedUploadParams = QuoteUploadParams | DocumentUploadParams;

export type UnifiedUploadResult = {
  success: boolean;
  kind: UnifiedUploadKind;

  // normalized file output
  filePath?: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;

  // errors
  errorCode?: string;
  errorMessage?: string;

  // optional passthrough fields
  raw?: unknown;
};

// ═══════════════════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════════════════

const INITIAL_STATE: UnifiedUploadState = {
  kind: null,
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
 * Unified upload facade that delegates to either `useQuoteUpload` or
 * `useDocumentUpload` based on the upload kind. Normalizes state and
 * results into a single consistent API for consumer components.
 */
export function useUnifiedUpload(): {
  state: UnifiedUploadState;
  upload: (params: UnifiedUploadParams) => Promise<UnifiedUploadResult>;
  reset: () => void;
  validateFile: (params: UnifiedUploadParams) => { ok: boolean; errorCode?: string; errorMessage?: string };

  // helpful UI exports
  quote: {
    allowedTypes: string[];
    maxFileSize: number;
    maxFileSizeMB: number;
  };
  document: {
    allowedTypes: string[];
    maxFileSize: number;
    maxFileSizeMB: number;
  };
} {
  // Underlying hooks
  const quoteUpload = useQuoteUpload();
  const documentUpload = useDocumentUpload();

  // Wrapper state
  const [state, setState] = useState<UnifiedUploadState>(INITIAL_STATE);

  // ─────────────────────────────────────────────────────────────────────────
  // Map quote upload state to unified stage
  // useQuoteUpload doesn't have explicit stages, just isUploading + progress
  // ─────────────────────────────────────────────────────────────────────────
  const deriveQuoteStage = useCallback((): UnifiedUploadStage => {
    if (quoteUpload.errorCode) return 'error';
    if (!quoteUpload.isUploading && quoteUpload.progress === 100) return 'done';
    if (!quoteUpload.isUploading && quoteUpload.progress === 0) return 'idle';
    // During upload, map progress to stages
    if (quoteUpload.progress < 20) return 'validating';
    if (quoteUpload.progress < 90) return 'sending';
    return 'processing';
  }, [quoteUpload.isUploading, quoteUpload.progress, quoteUpload.errorCode]);

  // ─────────────────────────────────────────────────────────────────────────
  // validateFile routing
  // ─────────────────────────────────────────────────────────────────────────
  const validateFile = useCallback(
    (params: UnifiedUploadParams): { ok: boolean; errorCode?: string; errorMessage?: string } => {
      if (params.kind === 'document') {
        const result = documentUpload.validateFile(params.file);
        return {
          ok: result.ok,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        };
      }

      if (params.kind === 'quote') {
        const result = quoteUpload.validateFile(params.file);
        return {
          ok: result.valid,
          errorCode: result.errorCode,
          errorMessage: result.error,
        };
      }

      return { ok: true };
    },
    [documentUpload, quoteUpload]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // upload routing
  // ─────────────────────────────────────────────────────────────────────────
  const upload = useCallback(
    async (params: UnifiedUploadParams): Promise<UnifiedUploadResult> => {
      const { kind, file, sourceTool, leadId } = params;

      // Set kind immediately
      setState((prev) => ({
        ...prev,
        kind,
        stage: 'validating',
        progress: 10,
        isUploading: true,
        errorCode: null,
        errorMessage: null,
        lastResult: null,
      }));

      // ───────────────────────────────────────────────────────────────────
      // Document upload path
      // ───────────────────────────────────────────────────────────────────
      if (kind === 'document') {
        const docParams = params as DocumentUploadParams;

        // Update state as we progress
        setState((prev) => ({ ...prev, stage: 'sending', progress: 30 }));

        const result: DocumentUploadResult = await documentUpload.upload({
          file,
          documentType: docParams.documentType,
          leadId: leadId || undefined,
          sourceTool,
        });

        // Normalize result
        const unified: UnifiedUploadResult = {
          success: result.success,
          kind: 'document',
          filePath: result.filePath,
          originalFileName: result.originalFileName,
          fileSize: result.fileSize,
          fileType: result.fileType,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          raw: result,
        };

        // Update wrapper state based on result
        if (result.success) {
          setState({
            kind: 'document',
            stage: 'done',
            progress: 100,
            errorCode: null,
            errorMessage: null,
            lastResult: unified,
            isUploading: false,
          });
        } else {
          setState({
            kind: 'document',
            stage: 'error',
            progress: documentUpload.state.progress,
            errorCode: result.errorCode || null,
            errorMessage: result.errorMessage || null,
            lastResult: unified,
            isUploading: false,
          });
        }

        return unified;
      }

      // ───────────────────────────────────────────────────────────────────
      // Quote upload path
      // ───────────────────────────────────────────────────────────────────
      if (kind === 'quote') {
        // Update state
        setState((prev) => ({ ...prev, stage: 'sending', progress: 30 }));

        const result = await quoteUpload.uploadFile(file, {
          sourcePage: sourceTool || 'beat-your-quote',
          onProgress: (progress) => {
            // Map progress to stages
            let stage: UnifiedUploadStage = 'sending';
            if (progress < 20) stage = 'validating';
            else if (progress >= 90) stage = 'processing';
            
            setState((prev) => ({
              ...prev,
              stage,
              progress,
            }));
          },
        });

        // Normalize result
        const unified: UnifiedUploadResult = {
          success: result.success,
          kind: 'quote',
          filePath: result.file_path,
          originalFileName: result.file_name,
          fileSize: result.file_size,
          fileType: file.type,
          errorCode: result.error_code,
          errorMessage: result.message,
          raw: result,
        };

        // Update wrapper state based on result
        if (result.success) {
          setState({
            kind: 'quote',
            stage: 'done',
            progress: 100,
            errorCode: null,
            errorMessage: null,
            lastResult: unified,
            isUploading: false,
          });
        } else {
          setState({
            kind: 'quote',
            stage: 'error',
            progress: quoteUpload.progress,
            errorCode: result.error_code || null,
            errorMessage: result.message || null,
            lastResult: unified,
            isUploading: false,
          });
        }

        return unified;
      }

      // Fallback (should never happen with proper typing)
      const fallbackResult: UnifiedUploadResult = {
        success: false,
        kind: kind as UnifiedUploadKind,
        errorCode: 'INTERNAL_ERROR',
        errorMessage: 'Invalid upload kind specified.',
      };

      setState({
        kind: null,
        stage: 'error',
        progress: 0,
        errorCode: 'INTERNAL_ERROR',
        errorMessage: 'Invalid upload kind specified.',
        lastResult: fallbackResult,
        isUploading: false,
      });

      return fallbackResult;
    },
    [documentUpload, quoteUpload]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // reset
  // ─────────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    // Reset both underlying hooks (safe to call even if not used)
    quoteUpload.reset();
    documentUpload.reset();

    // Reset wrapper state
    setState(INITIAL_STATE);
  }, [quoteUpload, documentUpload]);

  // ─────────────────────────────────────────────────────────────────────────
  // Memoized constants exports
  // ─────────────────────────────────────────────────────────────────────────
  const quoteConstants = useMemo(
    () => ({
      allowedTypes: quoteUpload.allowedTypes,
      maxFileSize: quoteUpload.maxFileSize,
      maxFileSizeMB: quoteUpload.maxFileSizeMB,
    }),
    [quoteUpload.allowedTypes, quoteUpload.maxFileSize, quoteUpload.maxFileSizeMB]
  );

  const documentConstants = useMemo(
    () => ({
      allowedTypes: documentUpload.allowedTypes,
      maxFileSize: documentUpload.maxFileSize,
      maxFileSizeMB: documentUpload.maxFileSizeMB,
    }),
    [documentUpload.allowedTypes, documentUpload.maxFileSize, documentUpload.maxFileSizeMB]
  );

  return {
    state,
    upload,
    reset,
    validateFile,
    quote: quoteConstants,
    document: documentConstants,
  };
}
