import { useState, useCallback, useRef } from 'react';

/**
 * useZipLookup - Auto-fill city/state from ZIP code using Zippopotam.us API
 * 
 * Features:
 * - Debounced API calls (only after 5 digits entered)
 * - Caches results to avoid duplicate requests
 * - Returns loading and error states
 * 
 * @example
 * const { lookup, isLoading, error } = useZipLookup();
 * 
 * const handleZipChange = async (zip: string) => {
 *   setFormData(prev => ({ ...prev, zip }));
 *   if (zip.length === 5) {
 *     const result = await lookup(zip);
 *     if (result) {
 *       setFormData(prev => ({ ...prev, city: result.city, state: result.state }));
 *     }
 *   }
 * };
 */

interface ZipLookupResult {
  city: string;
  state: string;
  stateCode: string;
  country: string;
}

interface ZippopotamResponse {
  'post code': string;
  country: string;
  'country abbreviation': string;
  places: Array<{
    'place name': string;
    longitude: string;
    state: string;
    'state abbreviation': string;
    latitude: string;
  }>;
}

interface UseZipLookupReturn {
  /** Lookup city/state from ZIP code */
  lookup: (zip: string) => Promise<ZipLookupResult | null>;
  /** Whether a lookup is in progress */
  isLoading: boolean;
  /** Error message if lookup failed */
  error: string | null;
  /** Clear error state */
  clearError: () => void;
}

// Simple in-memory cache
const zipCache = new Map<string, ZipLookupResult>();

export function useZipLookup(): UseZipLookupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const lookup = useCallback(async (zip: string): Promise<ZipLookupResult | null> => {
    // Clean the ZIP code
    const cleanZip = zip.replace(/\D/g, '').slice(0, 5);
    
    // Only lookup valid 5-digit US ZIP codes
    if (cleanZip.length !== 5) {
      return null;
    }

    // Check cache first
    const cached = zipCache.get(cleanZip);
    if (cached) {
      return cached;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.zippopotam.us/us/${cleanZip}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError('ZIP code not found');
          return null;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ZippopotamResponse = await response.json();
      
      if (!data.places || data.places.length === 0) {
        setError('No location found for this ZIP code');
        return null;
      }

      const place = data.places[0];
      const result: ZipLookupResult = {
        city: place['place name'],
        state: place.state,
        stateCode: place['state abbreviation'],
        country: data.country,
      };

      // Cache the result
      zipCache.set(cleanZip, result);
      
      return result;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, not an error
        return null;
      }
      
      console.error('[useZipLookup] API error:', err);
      setError('Unable to lookup ZIP code');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    lookup,
    isLoading,
    error,
    clearError,
  };
}
