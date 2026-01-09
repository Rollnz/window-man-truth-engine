// ============================================
// Quote Builder - AI Helper (Gemini via Edge Function)
// ============================================

import { heavyAIRequest } from "@/lib/aiRequest";
import { TimeoutError, RateLimitError } from "@/lib/errors";

/**
 * Secure AI call via Edge Function with 25s timeout and retries
 * Used by the Quote Builder for AI-powered features
 */
export const callGemini = async (prompt: string): Promise<string> => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < 3; i++) {
    try {
      const { data, error } = await heavyAIRequest.sendRequest<{ 
        text?: string; 
        error?: string; 
        isAnonymous?: boolean 
      }>(
        'generate-quote',
        { prompt }
      );

      // Check for rate limit error
      if (error instanceof RateLimitError) {
        throw error;
      }

      if (error) {
        throw error;
      }

      if (data?.error) {
        if (data.error.includes('Rate limit') || data.error.includes('429')) {
          throw new RateLimitError(data.error, data.isAnonymous ?? true);
        }
        throw new Error(data.error);
      }

      return data?.text || "I couldn't generate a response at this time.";
    } catch (error) {
      // Don't retry rate limit or timeout errors
      if (error instanceof RateLimitError || error instanceof TimeoutError) {
        throw error;
      }
      
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === 2) throw error;
      await delay(1000 * Math.pow(2, i));
    }
  }
  return "Service unavailable.";
};
