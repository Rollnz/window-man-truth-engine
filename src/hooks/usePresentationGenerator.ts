import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type ReportType = 'quote-analysis' | 'comparison-report';

interface GenerationResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface PollResult {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error';
  url?: string;
  error?: string;
}

async function pollForPresentation(
  generationId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<string> {
  console.log(`[pollForPresentation] Starting poll for: ${generationId}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[pollForPresentation] Attempt ${attempt}/${maxAttempts}`);

    const { data, error } = await supabase.functions.invoke<PollResult>(
      'get-presentation-status',
      { body: { generationId } }
    );

    if (error) {
      console.error('[pollForPresentation] Function error:', error);
      throw new Error(error.message || 'Failed to check presentation status');
    }

    if (!data) {
      throw new Error('No response from status check');
    }

    console.log(`[pollForPresentation] Status: ${data.status}`);

    if (data.status === 'completed' && data.url) {
      console.log('[pollForPresentation] Presentation ready:', data.url);
      return data.url;
    }

    if (data.status === 'failed' || data.status === 'error') {
      throw new Error(data.error || 'Presentation generation failed');
    }

    // Still pending/processing - wait and try again
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Presentation generation timed out. Please try again.');
}

export function usePresentationGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePresentation = useCallback(async (
    reportType: ReportType,
    data: Record<string, unknown>
  ): Promise<GenerationResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log(`Starting ${reportType} presentation generation...`);

      const { data: result, error: fnError } = await supabase.functions.invoke(
        'generate-presentation',
        {
          body: { reportType, data },
        }
      );

      if (fnError) {
        console.error('Edge function error:', fnError);
        const errorMessage = fnError.message || 'Failed to generate presentation';
        setError(errorMessage);
        toast({
          title: 'Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: errorMessage };
      }

      if (result?.error) {
        console.error('Generation error:', result.error);
        setError(result.error);
        toast({
          title: 'Generation Failed',
          description: result.error,
          variant: 'destructive',
        });
        return { success: false, error: result.error };
      }

      // Handle immediate URL response (backward compatibility)
      if (result?.success && result?.url) {
        console.log('Presentation generated immediately:', result.url);
        window.open(result.url, '_blank', 'noopener,noreferrer');
        toast({
          title: 'Presentation Ready!',
          description: 'Your presentation has been generated and opened in a new tab.',
        });
        return { success: true, url: result.url };
      }

      // Handle async generation - poll for completion
      if (result?.status === 'pending' && result?.generationId) {
        console.log('Async generation started, polling for completion...');
        
        // Show progress toast
        toast({
          title: 'Generating Presentation...',
          description: 'This may take 15-30 seconds. Please wait.',
        });

        try {
          const url = await pollForPresentation(result.generationId);
          
          // Open the completed presentation
          window.open(url, '_blank', 'noopener,noreferrer');
          
          toast({
            title: 'Presentation Ready!',
            description: 'Your presentation has been generated and opened in a new tab.',
          });

          return { success: true, url };
        } catch (pollError) {
          const pollErrorMessage = pollError instanceof Error ? pollError.message : 'Polling failed';
          console.error('Polling error:', pollError);
          setError(pollErrorMessage);
          toast({
            title: 'Generation Failed',
            description: pollErrorMessage,
            variant: 'destructive',
          });
          return { success: false, error: pollErrorMessage };
        }
      }

      const unknownError = 'Unexpected response from presentation service';
      setError(unknownError);
      toast({
        title: 'Generation Failed',
        description: unknownError,
        variant: 'destructive',
      });
      return { success: false, error: unknownError };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('Generation error:', err);
      setError(errorMessage);
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    generatePresentation,
    isGenerating,
    error,
    reset,
  };
}
