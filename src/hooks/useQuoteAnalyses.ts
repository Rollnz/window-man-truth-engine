import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface QuoteAnalysis {
  id: string;
  created_at: string;
  overall_score: number;
  safety_score: number;
  scope_score: number;
  price_score: number;
  fine_print_score: number;
  warranty_score: number;
  price_per_opening: string | null;
  warnings_count: number;
  missing_items_count: number;
  analysis_json: Record<string, unknown>;
}

export function useQuoteAnalyses() {
  const [analyses, setAnalyses] = useState<QuoteAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchAnalyses() {
      setIsLoading(true);
      setError(null);

      try {
        // If user is not authenticated, RLS won't allow SELECT
        // so we skip the fetch entirely
        if (!user) {
          setAnalyses([]);
          setIsLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('quote_analyses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (fetchError) {
          console.error('[useQuoteAnalyses] Fetch error:', fetchError.message);
          setError(fetchError.message);
          setAnalyses([]);
        } else {
          setAnalyses((data as QuoteAnalysis[]) || []);
        }
      } catch (err) {
        console.error('[useQuoteAnalyses] Unexpected error:', err);
        setError('Failed to load analyses');
        setAnalyses([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalyses();
  }, [user]);

  // Get the most recent analysis (for Vault card display)
  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;

  return {
    analyses,
    latestAnalysis,
    isLoading,
    error,
    hasAnalyses: analyses.length > 0,
  };
}
