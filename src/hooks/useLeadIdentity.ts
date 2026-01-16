// ============================================
// useLeadIdentity Hook
// ============================================
// Centralized "Golden Thread" identity management.
// This is a thin wrapper around useSessionData that provides
// dedicated access to the leadId for attribution tracking.

import { useCallback, useMemo } from 'react';
import { useSessionData } from './useSessionData';

export interface LeadIdentity {
  /** The current lead ID (if captured) */
  leadId: string | undefined;
  /** Whether a lead identity exists */
  hasIdentity: boolean;
  /** Update the lead ID (triggers React state update across app) */
  setLeadId: (id: string) => void;
  /** Clear the lead identity */
  clearIdentity: () => void;
}

/**
 * Provides centralized access to the Golden Thread lead identity.
 * 
 * Usage:
 * ```tsx
 * const { leadId, hasIdentity, setLeadId } = useLeadIdentity();
 * 
 * // After a successful lead capture:
 * setLeadId(response.leadId);
 * 
 * // Check if user has been identified:
 * if (hasIdentity) {
 *   // Include leadId in subsequent API calls
 * }
 * ```
 */
export function useLeadIdentity(): LeadIdentity {
  const { sessionData, updateField } = useSessionData();

  // Memoize the lead ID extraction
  const leadId = useMemo(() => sessionData.leadId, [sessionData.leadId]);

  // Check if we have an identity
  const hasIdentity = useMemo(() => !!leadId, [leadId]);

  // Set the lead ID - this triggers a React state update via useSessionData
  const setLeadId = useCallback((id: string) => {
    if (id && typeof id === 'string') {
      updateField('leadId', id);
    }
  }, [updateField]);

  // Clear the identity (useful for logout/reset scenarios)
  const clearIdentity = useCallback(() => {
    updateField('leadId', undefined);
  }, [updateField]);

  return {
    leadId,
    hasIdentity,
    setLeadId,
    clearIdentity,
  };
}
