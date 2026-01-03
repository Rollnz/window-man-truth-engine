import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClaimDocument } from '@/data/claimSurvivalData';
import { useToast } from '@/hooks/use-toast';
import { useSessionData } from '@/hooks/useSessionData';

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
  const { sessionData, updateField } = useSessionData();
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

      const { data, error } = await supabase.functions.invoke('analyze-evidence', {
        body: { documents: documentStatuses },
      });

      if (error) {
        // Handle rate limiting
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
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
      setAnalysisResult(resultWithTimestamp);
      updateField('claimAnalysisResult', resultWithTimestamp);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not complete the analysis. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [documents, progress, files, toast, updateField]);

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    analyzeEvidence,
    resetAnalysis,
  };
}
