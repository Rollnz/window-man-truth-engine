/**
 * Centralized AI Request Architecture
 * 
 * Provides a factory function for making AI requests with:
 * - Real AbortSignal support via native fetch
 * - Configurable timeouts
 * - Proper error typing
 * - Consistent auth headers
 */

import { TimeoutError, RateLimitError, ServiceError, NetworkError } from './errors';

// Timeout tiers
export const AI_TIMEOUTS = {
  FAST: 15000,    // 15s - Chat, roleplay, evidence analysis
  HEAVY: 25000,   // 25s - Document scanning, quote generation
} as const;

interface AIRequestOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

interface AIResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Creates a configured AI request sender
 * 
 * @param defaultTimeoutMs - Default timeout in milliseconds
 * @returns A function that sends requests to edge functions
 */
export function createAIRequest(defaultTimeoutMs: number = AI_TIMEOUTS.FAST) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
  }

  /**
   * Send a request to a Supabase Edge Function with proper timeout handling
   * 
   * @param functionName - Name of the edge function (e.g., 'roleplay-chat')
   * @param body - Request body to send
   * @param options - Optional configuration overrides
   * @returns Promise with typed response data
   */
  async function sendRequest<T = unknown>(
    functionName: string,
    body: unknown,
    options: AIRequestOptions = {}
  ): Promise<AIResponse<T>> {
    const {
      timeoutMs = defaultTimeoutMs,
      retries = 0,
      retryDelayMs = 1000,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Rate limit (429)
          if (response.status === 429) {
            throw new RateLimitError(
              errorData.error || 'Rate limit exceeded',
              errorData.isAnonymous ?? true
            );
          }
          
          // Service unavailable (503)
          if (response.status === 503) {
            throw new ServiceError('Service temporarily unavailable', 503);
          }
          
          // Other errors
          throw new ServiceError(
            errorData.error || `Request failed with status ${response.status}`,
            response.status
          );
        }

        const data = await response.json();
        
        // Check for error in response body (some functions return errors this way)
        if (data.error) {
          if (data.error.includes('Rate limit') || data.error.includes('429')) {
            throw new RateLimitError(data.error, data.isAnonymous ?? true);
          }
          throw new ServiceError(data.error);
        }

        return { data: data as T, error: null };

      } catch (error) {
        clearTimeout(timeoutId);

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new TimeoutError('Request timed out. Please try again.');
          // Don't retry timeouts
          break;
        }

        // Don't retry rate limits
        if (error instanceof RateLimitError) {
          return { data: null, error };
        }

        // Network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          lastError = new NetworkError();
          // Retry network errors
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, retryDelayMs * Math.pow(2, attempt)));
            continue;
          }
          break;
        }

        // Other errors
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Retry if we have attempts left
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, retryDelayMs * Math.pow(2, attempt)));
          continue;
        }
      }
    }

    return { data: null, error: lastError };
  }

  /**
   * Send a streaming request (for chat interfaces)
   * Returns the raw Response for stream processing
   */
  async function sendStreamingRequest(
    functionName: string,
    body: unknown,
    options: AIRequestOptions = {}
  ): Promise<Response> {
    const { timeoutMs = defaultTimeoutMs } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new RateLimitError(errorData.error || 'Rate limit exceeded', true);
        }
        
        throw new ServiceError(
          errorData.error || `Request failed with status ${response.status}`,
          response.status
        );
      }

      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError('Request timed out. Please try again.');
      }
      
      throw error;
    }
  }

  return {
    sendRequest,
    sendStreamingRequest,
  };
}

// Pre-configured instances for common use cases
export const fastAIRequest = createAIRequest(AI_TIMEOUTS.FAST);
export const heavyAIRequest = createAIRequest(AI_TIMEOUTS.HEAVY);
