// ═══════════════════════════════════════════════════════════════════════════
// useDeterministicScanner - Simplified state machine for audit analysis
// No animation timers - phases driven by actual state transitions
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
import { 
  DeterministicPhase, 
  AuditAnalysisResult, 
  ExplainScoreFormData 
} from '@/types/audit';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface DeterministicScannerState {
  phase: DeterministicPhase;
  file: File | null;
  result: AuditAnalysisResult | null;
  leadId: string | null;
  isLeadCaptured: boolean;
  isLoading: boolean;
  error: string | null;
  scanAttemptId: string | null;
}

interface UseDeterministicScannerReturn extends DeterministicScannerState {
  /** Start analysis with a file */
  analyzeFile: (file: File) => Promise<void>;
  /** Transition to gated state (show lead form) */
  showGate: () => void;
  /** Capture lead and unlock results */
  captureLead: (data: ExplainScoreFormData) => Promise<void>;
  /** Reset to initial state */
  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE COMPRESSION (reused from useQuoteScanner)
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
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

const INITIAL_STATE: DeterministicScannerState = {
  phase: 'idle',
  file: null,
  result: null,
  leadId: null,
  isLeadCaptured: false,
  isLoading: false,
  error: null,
  scanAttemptId: null,
};

export function useDeterministicScanner(): UseDeterministicScannerReturn {
  const { toast } = useToast();
  const { sessionData, sessionId, updateField } = useSessionData();
  const { leadId: existingLeadId, setLeadId } = useLeadIdentity();
  const { awardScore } = useCanonicalScore();
  
  const [state, setState] = useState<DeterministicScannerState>(INITIAL_STATE);
  
  // Ref for deduplication
  const scanAttemptIdRef = useRef<string>('');

  // Lead form submission handler
  const { submit: submitLead, isSubmitting: isLeadSubmitting } = useLeadFormSubmit({
    sourceTool: 'quote-scanner',
    formLocation: 'explain_score_gate',
    leadScore: 100,
    successTitle: 'Report Unlocked!',
    successDescription: 'Your full analysis is now available.',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYZE FILE
  // ═══════════════════════════════════════════════════════════════════════════

  const analyzeFile = useCallback(async (file: File) => {
    const scanAttemptId = crypto.randomUUID();
    scanAttemptIdRef.current = scanAttemptId;

    setState(prev => ({
      ...prev,
      phase: 'analyzing',
      file,
      error: null,
      scanAttemptId,
      isLoading: true,
    }));

    // Track analysis started
    trackEvent('analysis_started', {
      source_tool: 'audit-scanner',
      file_type: file.type,
      file_size_kb: Math.round(file.size / 1024),
    });

    try {
      const { base64, mimeType } = await compressImage(file);

      // Track upload event
      trackScannerUpload({
        scanAttemptId,
        sourceTool: 'audit-scanner',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        leadId: existingLeadId || undefined,
        sessionId,
      });

      // Call AI analysis API
      const { data, error: requestError } = await heavyAIRequest.sendRequest<AuditAnalysisResult & { error?: string }>(
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
      if (data?.error) throw new Error(data.error);

      const resultWithTimestamp: AuditAnalysisResult = {
        ...data!,
        analyzedAt: new Date().toISOString(),
      };

      // Track analysis complete
      trackEvent('analysis_complete', {
        score: resultWithTimestamp.overallScore,
        warnings_count: resultWithTimestamp.warnings?.length || 0,
        missing_count: resultWithTimestamp.missingItems?.length || 0,
        event_id: `analysis_complete:${scanAttemptId}`,
      });

      // Transition to partial results phase
      setState(prev => ({
        ...prev,
        phase: 'partial',
        result: resultWithTimestamp,
        isLoading: false,
      }));

      // Track partial results viewed
      trackEvent('partial_results_viewed', {
        score: resultWithTimestamp.overallScore,
        safety_score: resultWithTimestamp.safetyScore,
        scope_score: resultWithTimestamp.scopeScore,
        price_score: resultWithTimestamp.priceScore,
      });

    } catch (err) {
      console.error('Audit analysis error:', err);
      const message = getErrorMessage(err);
      
      setState(prev => ({
        ...prev,
        phase: 'idle',
        error: message,
        isLoading: false,
      }));

      toast({
        title: message.includes('timed out') ? 'Request Timed Out' : 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [sessionData.windowCount, sessionId, existingLeadId, toast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOW GATE
  // ═══════════════════════════════════════════════════════════════════════════

  const showGate = useCallback(() => {
    if (state.phase !== 'partial') return;
    
    setState(prev => ({ ...prev, phase: 'gated' }));
    
    trackModalOpen({
      modalName: 'explain_score_gate',
    });
  }, [state.phase]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPTURE LEAD
  // ═══════════════════════════════════════════════════════════════════════════

  const captureLead = useCallback(async (data: ExplainScoreFormData) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Submit lead using centralized hook
      // Combine firstName + lastName into name field for API compatibility
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

      // Update state to unlocked
      setState(prev => ({
        ...prev,
        phase: 'unlocked',
        isLeadCaptured: true,
        isLoading: false,
      }));

      // Award canonical score for quote upload
      if (state.scanAttemptId) {
        await awardScore({
          eventType: 'QUOTE_UPLOADED',
          sourceEntityType: 'quote',
          sourceEntityId: state.scanAttemptId,
        });

        // Track quote upload success ($50 value)
        await trackQuoteUploadSuccess({
          scanAttemptId: state.scanAttemptId,
          email: data.email,
          phone: data.phone,
          leadId: existingLeadId || undefined,
          sourceTool: 'audit-scanner',
        });
      }

      // Save result to session
      if (state.result) {
        updateField('quoteAnalysisResult', state.result);
      }

    } catch (err) {
      console.error('Lead capture error:', err);
      const message = getErrorMessage(err);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));

      toast({
        title: 'Submission Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [submitLead, state.scanAttemptId, state.result, existingLeadId, awardScore, updateField, toast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════════════════════════════════════════

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    scanAttemptIdRef.current = '';
  }, []);

  return {
    ...state,
    isLoading: state.isLoading || isLeadSubmitting,
    analyzeFile,
    showGate,
    captureLead,
    reset,
  };
}

export default useDeterministicScanner;
