// ═══════════════════════════════════════════════════════════════════════════
// useGatedAIScanner - Gated scanner for /ai-scanner page
// Flow: Upload → Lead Modal → Analyzing (Theater) → Revealed (Authority Report)
// State: idle | uploaded | locked | analyzing | revealed
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { heavyAIRequest } from '@/lib/aiRequest';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { trackEvent, trackModalOpen } from '@/lib/gtm';
import { wmScannerUpload } from '@/lib/wmTracking';
import { useCanonicalScore } from '@/hooks/useCanonicalScore';
import { logScannerCompleted } from '@/lib/highValueSignals';
import type { QuoteAnalysisResult } from '@/hooks/useQuoteScanner';
import type { ExplainScoreFormData } from '@/types/audit';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AIScannerPhase = 'idle' | 'uploaded' | 'locked' | 'analyzing' | 'revealed';

const SESSION_KEY = 'wte_ai_scanner_state';

interface PersistedState {
  phase: 'locked' | 'analyzing';
  leadId: string | null;
  scanAttemptId: string;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
}

interface GatedAIScannerState {
  phase: AIScannerPhase;
  file: File | null;
  filePreviewUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  analysisResult: QuoteAnalysisResult | null;
  leadId: string | null;
  isModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  scanAttemptId: string | null;
  imageBase64: string | null;
  mimeType: string | null;
  recoveryMessage: string | null;
}

export interface UseGatedAIScannerReturn extends GatedAIScannerState {
  handleFileSelect: (file: File) => void;
  closeModal: () => void;
  reopenModal: () => void;
  captureLead: (data: ExplainScoreFormData) => Promise<void>;
  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE COMPRESSION (copied from useGatedScanner)
// ═══════════════════════════════════════════════════════════════════════════

async function compressImage(file: File, maxBytes = 4_000_000): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      
      if (base64.length < maxBytes) {
        resolve({ base64, mimeType: file.type });
        return;
      }

      if (file.type === 'application/pdf') {
        if (base64.length > 6_000_000) {
          reject(new Error('PDF is too large. Please upload a smaller file (max 5MB).'));
          return;
        }
        resolve({ base64, mimeType: file.type });
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 2000;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Could not create canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ base64: compressed.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const INITIAL_STATE: GatedAIScannerState = {
  phase: 'idle',
  file: null,
  filePreviewUrl: null,
  fileName: null,
  fileType: null,
  fileSize: null,
  analysisResult: null,
  leadId: null,
  isModalOpen: false,
  isLoading: false,
  error: null,
  scanAttemptId: null,
  imageBase64: null,
  mimeType: null,
  recoveryMessage: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// SESSION STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function persistState(data: PersistedState): void {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}

function readPersistedState(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch { return null; }
}

function clearPersistedState(): void {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gated AI scanner state machine for the /ai-scanner page.
 * Flow: idle → uploaded → locked (lead modal) → analyzing (theater) → revealed.
 * Orchestrates file upload, lead capture gate, AI analysis, and result reveal.
 */
export function useGatedAIScanner(): UseGatedAIScannerReturn {
  const { toast } = useToast();
  const { sessionData, sessionId, updateField } = useSessionData();
  const { leadId: existingLeadId, setLeadId } = useLeadIdentity();
  const { awardScore } = useCanonicalScore();

  const [state, setState] = useState<GatedAIScannerState>(INITIAL_STATE);
  const scanAttemptIdRef = useRef<string>('');

  const { submit: submitLead, isSubmitting: isLeadSubmitting } = useLeadFormSubmit({
    sourceTool: 'quote-scanner',
    formLocation: 'quote_upload_gate',
    leadScore: 100,
    successTitle: 'Analysis Started!',
    successDescription: 'Scanning your quote now...',
  });

  // ── Mount: check sessionStorage for recovery ────────────────────────
  useEffect(() => {
    const persisted = readPersistedState();
    if (!persisted) return;

    if (persisted.phase === 'analyzing' && persisted.leadId) {
      const recoveredName = persisted.fileName ?? null;
      const nameSnippet = recoveredName ? ` of **${recoveredName}**` : '';
      // Lost file on refresh but have lead — show re-upload message
      setState(prev => ({
        ...prev,
        phase: 'idle',
        leadId: persisted.leadId,
        scanAttemptId: persisted.scanAttemptId,
        fileName: recoveredName,
        fileType: persisted.fileType ?? null,
        fileSize: persisted.fileSize ?? null,
        recoveryMessage: `We lost your upload${nameSnippet} due to a browser refresh. Please re-upload to regenerate your report.`,
      }));
    } else {
      // Locked with no lead or unknown — clean idle
      clearPersistedState();
    }
  }, []);

  // ── handleFileSelect ────────────────────────────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    const scanAttemptId = crypto.randomUUID();
    scanAttemptIdRef.current = scanAttemptId;
    const previewUrl = URL.createObjectURL(file);

    setState({
      ...INITIAL_STATE,
      phase: 'uploaded',
      file,
      filePreviewUrl: previewUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      scanAttemptId,
      isModalOpen: true,
    });

    trackEvent('quote_file_selected', {
      source_tool: 'quote-scanner',
      file_type: file.type,
      file_size_kb: Math.round(file.size / 1024),
    });
    trackModalOpen({ modalName: 'quote_upload_gate' });
  }, []);

  // ── closeModal → locked ─────────────────────────────────────────────
  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      phase: 'locked',
    }));

    if (state.scanAttemptId) {
      persistState({ phase: 'locked', leadId: null, scanAttemptId: state.scanAttemptId, fileName: state.fileName, fileType: state.fileType, fileSize: state.fileSize });
    }

    trackEvent('quote_upload_gate_dismissed', {
      phase: 'uploaded',
      had_file: !!state.file,
    });
  }, [state.scanAttemptId, state.file]);

  // ── reopenModal → uploaded ──────────────────────────────────────────
  const reopenModal = useCallback(() => {
    if (state.file) {
      setState(prev => ({ ...prev, phase: 'uploaded', isModalOpen: true }));
      trackModalOpen({ modalName: 'quote_upload_gate' });
    }
  }, [state.file]);

  // ── captureLead → analyzing → revealed ──────────────────────────────
  const captureLead = useCallback(async (data: ExplainScoreFormData) => {
    if (!state.file) {
      toast({ title: 'No file uploaded', description: 'Please upload a quote first.', variant: 'destructive' });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // 1. Submit lead
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
      const success = await submitLead({
        firstName: data.firstName,
        name: fullName || undefined,
        email: data.email,
        phone: data.phone,
      });
      if (!success) throw new Error('Failed to save lead');

      const capturedLeadId = existingLeadId || null;

      trackEvent('quote_upload_gate_success', {
        source_tool: 'quote-scanner',
        scan_attempt_id: state.scanAttemptId,
      });

      // 2. Persist before analysis (Safari resilience)
      if (state.scanAttemptId) {
        persistState({ phase: 'analyzing', leadId: capturedLeadId, scanAttemptId: state.scanAttemptId, fileName: state.fileName, fileType: state.fileType, fileSize: state.fileSize });
      }

      // 3. Transition to analyzing
      setState(prev => ({
        ...prev,
        isModalOpen: false,
        phase: 'analyzing',
        leadId: capturedLeadId,
      }));

      // 4. Compress and analyze
      const { base64, mimeType } = await compressImage(state.file);

      await wmScannerUpload(
        { email: data.email, phone: data.phone, leadId: capturedLeadId || undefined },
        state.scanAttemptId || '',
        { source_tool: 'quote-scanner' },
      );

      const { data: analysisData, error: requestError } = await heavyAIRequest.sendRequest<QuoteAnalysisResult & { error?: string }>(
        'quote-scanner',
        {
          mode: 'analyze',
          imageBase64: base64,
          mimeType,
          openingCount: sessionData.windowCount,
          areaName: 'Florida',
          sessionId,
          leadId: capturedLeadId || undefined,
        },
        { timeoutMs: 60000 }
      );

      if (requestError) throw requestError;
      if (analysisData?.error) throw new Error(analysisData.error);

      const resultWithTimestamp: QuoteAnalysisResult = {
        ...analysisData!,
        analyzedAt: new Date().toISOString(),
      };

      // Track completion
      trackEvent('analysis_complete', {
        score: resultWithTimestamp.overallScore,
        warnings_count: resultWithTimestamp.warnings?.length || 0,
        missing_count: resultWithTimestamp.missingItems?.length || 0,
        event_id: `analysis_complete:${state.scanAttemptId}`,
      });

      if (state.scanAttemptId) {
        await awardScore({
          eventType: 'QUOTE_UPLOADED',
          sourceEntityType: 'quote',
          sourceEntityId: state.scanAttemptId,
        });
        await wmScannerUpload(
          { email: data.email, phone: data.phone, leadId: capturedLeadId || undefined },
          state.scanAttemptId,
          { source_tool: 'quote-scanner' },
        );
      }

      await logScannerCompleted({
        score: resultWithTimestamp.overallScore,
        quoteAmount: parseFloat(resultWithTimestamp.pricePerOpening.replace(/[^0-9.]/g, '')) || undefined,
        fileSize: state.file.size,
        fileType: state.file.type,
        leadId: capturedLeadId || undefined,
        email: data.email,
        phone: data.phone,
      });

      updateField('quoteAnalysisResult', resultWithTimestamp);
      clearPersistedState();

      // 5. Reveal
      setState(prev => ({
        ...prev,
        phase: 'revealed',
        analysisResult: resultWithTimestamp,
        imageBase64: base64,
        mimeType,
        isLoading: false,
      }));

    } catch (err) {
      console.error('[useGatedAIScanner] Error:', err);
      const message = getErrorMessage(err);
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      toast({
        title: message.includes('timed out') ? 'Request Timed Out' : 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [state.file, state.scanAttemptId, submitLead, sessionData.windowCount, sessionId, existingLeadId, awardScore, updateField, toast]);

  // ── reset ───────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (state.filePreviewUrl) URL.revokeObjectURL(state.filePreviewUrl);
    setState(INITIAL_STATE);
    scanAttemptIdRef.current = '';
    clearPersistedState();
  }, [state.filePreviewUrl]);

  return {
    ...state,
    isLoading: state.isLoading || isLeadSubmitting,
    handleFileSelect,
    closeModal,
    reopenModal,
    captureLead,
    reset,
  };
}
