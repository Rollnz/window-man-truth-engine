// ═══════════════════════════════════════════════════════════════════════════
// useGatedScanner - CRO-optimized scanner with IMMEDIATE lead gate
// Flow: Upload → Blur Preview → Lead Modal → Theater → Reveal
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { heavyAIRequest } from '@/lib/aiRequest';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { trackEvent, trackModalOpen, trackQuoteUploadSuccess } from '@/lib/gtm';
import { trackScannerUpload } from '@/lib/tracking/scannerUpload';
import { useCanonicalScore } from '@/hooks/useCanonicalScore';
import type { AuditAnalysisResult, ExplainScoreFormData } from '@/types/audit';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Phases for the gated scanner flow:
 * - idle: No file uploaded
 * - uploaded: File uploaded, showing blurred preview, modal open
 * - analyzing: Lead captured, running AI analysis with theater
 * - revealed: Analysis complete, full results visible
 */
export type GatedScannerPhase = 'idle' | 'uploaded' | 'analyzing' | 'revealed';

interface GatedScannerState {
  phase: GatedScannerPhase;
  file: File | null;
  filePreviewUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  result: AuditAnalysisResult | null;
  leadId: string | null;
  isLeadCaptured: boolean;
  isModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  scanAttemptId: string | null;
}

interface UseGatedScannerReturn extends GatedScannerState {
  /** Handle file selection - shows blurred preview + opens modal */
  handleFileSelect: (file: File) => void;
  /** Close the lead modal (preserves file state) */
  closeModal: () => void;
  /** Re-open the lead modal */
  reopenModal: () => void;
  /** Capture lead and start analysis */
  captureLead: (data: ExplainScoreFormData) => Promise<void>;
  /** Reset to initial state */
  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE COMPRESSION
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
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const compressedBase64 = compressed.split(',')[1];
        
        resolve({ base64: compressedBase64, mimeType: 'image/jpeg' });
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

const INITIAL_STATE: GatedScannerState = {
  phase: 'idle',
  file: null,
  filePreviewUrl: null,
  fileName: null,
  fileType: null,
  fileSize: null,
  result: null,
  leadId: null,
  isLeadCaptured: false,
  isModalOpen: false,
  isLoading: false,
  error: null,
  scanAttemptId: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export function useGatedScanner(): UseGatedScannerReturn {
  const { toast } = useToast();
  const { sessionData, sessionId, updateField } = useSessionData();
  const { leadId: existingLeadId, setLeadId } = useLeadIdentity();
  const { awardScore } = useCanonicalScore();
  
  const [state, setState] = useState<GatedScannerState>(INITIAL_STATE);
  const scanAttemptIdRef = useRef<string>('');

  // Lead form submission handler
  const { submit: submitLead, isSubmitting: isLeadSubmitting } = useLeadFormSubmit({
    sourceTool: 'quote-scanner',
    formLocation: 'quote_upload_gate',
    leadScore: 100,
    successTitle: 'Analysis Started!',
    successDescription: 'Scanning your quote now...',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE FILE SELECT - Immediate gate trigger
  // ═══════════════════════════════════════════════════════════════════════════

  const handleFileSelect = useCallback((file: File) => {
    const scanAttemptId = crypto.randomUUID();
    scanAttemptIdRef.current = scanAttemptId;

    // Create preview URL for blurred display
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
      isModalOpen: true, // IMMEDIATELY open lead modal
    });

    // Track file upload (pre-gate)
    trackEvent('quote_file_selected', {
      source_tool: 'audit-scanner',
      file_type: file.type,
      file_size_kb: Math.round(file.size / 1024),
    });

    trackModalOpen({ modalName: 'quote_upload_gate' });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL CONTROLS
  // ═══════════════════════════════════════════════════════════════════════════

  const closeModal = useCallback(() => {
    setState(prev => ({ ...prev, isModalOpen: false }));
    
    trackEvent('quote_upload_gate_dismissed', {
      phase: state.phase,
      had_file: !!state.file,
    });
  }, [state.phase, state.file]);

  const reopenModal = useCallback(() => {
    if (state.phase === 'uploaded' && state.file) {
      setState(prev => ({ ...prev, isModalOpen: true }));
      trackModalOpen({ modalName: 'quote_upload_gate' });
    }
  }, [state.phase, state.file]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPTURE LEAD & START ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  const captureLead = useCallback(async (data: ExplainScoreFormData) => {
    if (!state.file) {
      toast({
        title: 'No file uploaded',
        description: 'Please upload a quote first.',
        variant: 'destructive',
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // 1. Submit lead FIRST
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
      const success = await submitLead({
        firstName: data.firstName,
        name: fullName || undefined,
        email: data.email,
        phone: data.phone,
      });

      if (!success) {
        throw new Error('Failed to save lead');
      }

      // Track lead captured
      trackEvent('quote_upload_gate_success', {
        source_tool: 'quote-scanner',
        scan_attempt_id: state.scanAttemptId,
      });

      // 2. Close modal and transition to analyzing phase
      setState(prev => ({
        ...prev,
        isLeadCaptured: true,
        isModalOpen: false,
        phase: 'analyzing',
      }));

      // 3. Start AI analysis
      const { base64, mimeType } = await compressImage(state.file);

      // Track scanner upload
      trackScannerUpload({
        scanAttemptId: state.scanAttemptId || '',
        sourceTool: 'audit-scanner',
        fileName: state.file.name,
        fileSize: state.file.size,
        fileType: state.file.type,
        leadId: existingLeadId || undefined,
        sessionId,
      });

      // Call AI analysis API
      const { data: analysisData, error: requestError } = await heavyAIRequest.sendRequest<AuditAnalysisResult & { error?: string }>(
        'quote-scanner',
        {
          mode: 'analyze',
          imageBase64: base64,
          mimeType,
          openingCount: sessionData.windowCount,
          areaName: 'Florida',
          sessionId,
          leadId: existingLeadId || undefined,
        }
      );

      if (requestError) throw requestError;
      if (analysisData?.error) throw new Error(analysisData.error);

      const resultWithTimestamp: AuditAnalysisResult = {
        ...analysisData!,
        analyzedAt: new Date().toISOString(),
      };

      // Track analysis complete
      trackEvent('analysis_complete', {
        score: resultWithTimestamp.overallScore,
        warnings_count: resultWithTimestamp.warnings?.length || 0,
        missing_count: resultWithTimestamp.missingItems?.length || 0,
        event_id: `analysis_complete:${state.scanAttemptId}`,
      });

      // Award canonical score
      if (state.scanAttemptId) {
        await awardScore({
          eventType: 'QUOTE_UPLOADED',
          sourceEntityType: 'quote',
          sourceEntityId: state.scanAttemptId,
        });

        await trackQuoteUploadSuccess({
          scanAttemptId: state.scanAttemptId,
          email: data.email,
          phone: data.phone,
          leadId: existingLeadId || undefined,
          sourceTool: 'audit-scanner',
        });
      }

      // Save result to session
      updateField('quoteAnalysisResult', resultWithTimestamp);

      // 4. Transition to revealed phase
      setState(prev => ({
        ...prev,
        phase: 'revealed',
        result: resultWithTimestamp,
        isLoading: false,
      }));

    } catch (err) {
      console.error('Gated scanner error:', err);
      const message = getErrorMessage(err);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));

      toast({
        title: message.includes('timed out') ? 'Request Timed Out' : 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [state.file, state.scanAttemptId, submitLead, sessionData.windowCount, sessionId, existingLeadId, awardScore, updateField, toast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════════════════════════════════════════

  const reset = useCallback(() => {
    // Cleanup preview URL
    if (state.filePreviewUrl) {
      URL.revokeObjectURL(state.filePreviewUrl);
    }
    setState(INITIAL_STATE);
    scanAttemptIdRef.current = '';
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

export default useGatedScanner;
