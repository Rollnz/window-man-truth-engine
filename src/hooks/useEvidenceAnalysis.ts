import { useState, useCallback, useEffect } from 'react';
import { fastAIRequest } from '@/lib/aiRequest';
import { getErrorMessage, isRateLimitError } from '@/lib/errors';
import { ClaimDocument } from '@/data/claimSurvivalData';
import { useToast } from '@/hooks/use-toast';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';

export interface AnalysisResult {
  overallScore: number;
  status: 'critical' | 'warning' | 'ready';
  summary: string;
  documentStatus: {
    docId: string;
    status: 'complete' | 'missing' | 'weak';
    recommendation: string;
  }[];
  nextSteps: string[];
  analyzedAt?: string;
}

interface UseEvidenceAnalysisProps {
  documents: ClaimDocument[];
  progress: Record<string, boolean>;
  files: Record<string, string>;
}

export function useEvidenceAnalysis({
  documents,
  progress,
  files,
}: UseEvidenceAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { sessionData, sessionId, updateField } = useSessionData();
  const { leadId } = useLeadIdentity();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    sessionData.claimAnalysisResult || null
  );
  const { toast } = useToast();

  // Load saved analysis on mount
  useEffect(() => {
    if (sessionData.claimAnalysisResult && !analysisResult) {
      setAnalysisResult(sessionData.claimAnalysisResult);
    }
  }, [analysisResult, sessionData.claimAnalysisResult]);

  const analyzeEvidence = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);

    try {
      // Build document status for AI
      const documentStatuses = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        hasCheckbox: progress[doc.id] || false,
        hasFile: !!files[doc.id],
        whatItProves: doc.whatItProves,
        whyClaimsFail: doc.whyClaimsFail,
      }));

      const { data, error } = await fastAIRequest.sendRequest<AnalysisResult>(
        'analyze-evidence',
        { 
          documents: documentStatuses,
          // Golden Thread: Pass session tracking data
          sessionId: sessionId || crypto.randomUUID(),
          leadId: leadId || undefined,
        }
      );

      if (error) {
        // Handle rate limiting
        if (isRateLimitError(error)) {
          toast({
            title: 'Too Many Requests',
            description: 'Please wait a moment before analyzing again.',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      // Add timestamp and save to session
      const resultWithTimestamp = {
        ...data,
        analyzedAt: new Date().toISOString(),
      };
      setAnalysisResult(resultWithTimestamp as AnalysisResult);
      updateField('claimAnalysisResult', resultWithTimestamp);
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      const message = getErrorMessage(error);
      setAnalysisError(message);
      
      toast({
        title: message.includes('timed out') ? 'Request Timed Out' : 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [documents, progress, files, toast, updateField, sessionId, leadId]);

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setAnalysisError(null);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    analysisError,
    analyzeEvidence,
    resetAnalysis,
  };
}
