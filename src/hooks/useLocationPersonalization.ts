import { useState, useEffect, useCallback } from 'react';
import { useSessionData } from '@/hooks/useSessionData';
import { useZipLookup } from '@/hooks/forms/useZipLookup';
import {
  getCountyFromZip,
  getCountyData,
  type CountyData,
} from '@/lib/floridaCountyData';

export interface LocationPersonalization {
  zip: string;
  city: string;
  state: string;
  stateCode: string;
  county: string;
  countyData: CountyData;
}

interface UseLocationPersonalizationReturn {
  /** Resolved location data (null if not yet known) */
  locationData: LocationPersonalization | null;
  /** Whether a ZIP lookup is in progress */
  isLoading: boolean;
  /** Manually resolve a ZIP code entered by the user */
  resolveZip: (zip: string) => Promise<void>;
}

/**
 * useLocationPersonalization - Provides county-aware content personalization.
 *
 * Resolution order:
 * 1. sessionData.zipCode (already collected on site)
 * 2. Manual resolveZip() call from LocationBadge
 *
 * Does NOT call external geolocation APIs unprompted.
 */
export function useLocationPersonalization(): UseLocationPersonalizationReturn {
  const { sessionData, updateFields } = useSessionData();
  const { lookup, isLoading: zipLoading } = useZipLookup();
  const [locationData, setLocationData] = useState<LocationPersonalization | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Build location from known data
  const buildLocation = useCallback(
    (zip: string, city: string, stateCode: string, county: string): LocationPersonalization => {
      return {
        zip,
        city,
        state: stateCode === 'FL' ? 'Florida' : stateCode,
        stateCode,
        county,
        countyData: getCountyData(county),
      };
    },
    []
  );

  // On mount, try to resolve from sessionData
  useEffect(() => {
    const zip = sessionData.zipCode;
    if (!zip || zip.length < 5) return;

    // Try static lookup first
    const county = getCountyFromZip(zip);
    if (county && sessionData.city) {
      setLocationData(
        buildLocation(zip, sessionData.city, sessionData.state || 'FL', county)
      );
      return;
    }

    // If we have a ZIP but no county match, do API lookup
    (async () => {
      setIsLoading(true);
      const result = await lookup(zip);
      if (result) {
        const resolvedCounty = getCountyFromZip(zip) || result.city;
        setLocationData(
          buildLocation(zip, result.city, result.stateCode, resolvedCounty)
        );
      }
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual resolve for LocationBadge ZIP input
  const resolveZip = useCallback(
    async (zip: string) => {
      const clean = zip.replace(/\D/g, '').slice(0, 5);
      if (clean.length !== 5) return;

      setIsLoading(true);

      // Try static table first
      const staticCounty = getCountyFromZip(clean);

      const result = await lookup(clean);
      if (result) {
        const county = staticCounty || result.city;
        const loc = buildLocation(clean, result.city, result.stateCode, county);
        setLocationData(loc);

        // Persist to session for future visits
        updateFields({
          zipCode: clean,
          city: result.city,
          state: result.stateCode,
        });
      }

      setIsLoading(false);
    },
    [lookup, buildLocation, updateFields]
  );

  return {
    locationData,
    isLoading: isLoading || zipLoading,
    resolveZip,
  };
}
