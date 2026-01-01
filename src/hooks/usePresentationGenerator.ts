import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type ReportType = 'quote-analysis' | 'comparison-report';

interface GenerationResult {
  success: boolean;
  url?: string;
  error?: string;
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

      if (result?.success && result?.url) {
        console.log('Presentation generated:', result.url);
        
        // Open in new tab
        window.open(result.url, '_blank', 'noopener,noreferrer');
        
        toast({
          title: 'Presentation Ready!',
          description: 'Your presentation has been generated and opened in a new tab.',
        });

        return { success: true, url: result.url };
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
