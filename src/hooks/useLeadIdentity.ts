// ============================================
// useLeadIdentity Hook
// ============================================
// Centralized "Golden Thread" identity management.
// This is a thin wrapper around useSessionData that provides
// dedicated access to the leadId for attribution tracking,
// plus the isVerifiedLead check for identity-aware gating.

import { useCallback, useMemo } from 'react';
import { useSessionData } from './useSessionData';
import { getLeadAnchor } from '@/lib/leadAnchor';

export interface LeadIdentity {
  /** The current lead ID (if captured) */
  leadId: string | undefined;
  /** Whether a lead identity exists */
  hasIdentity: boolean;
  /** Whether the lead is fully verified (anchor + PII completeness) */
  isVerifiedLead: boolean;
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
 * const { leadId, hasIdentity, isVerifiedLead, setLeadId } = useLeadIdentity();
 * 
 * // After a successful lead capture:
 * setLeadId(response.leadId);
 * 
 * // Check if user is a verified lead (gate bypass):
 * if (isVerifiedLead) {
 *   // Skip lead capture modal, go straight to analysis
 * }
 * ```
 */
export function useLeadIdentity(): LeadIdentity {
  const { sessionData, updateField } = useSessionData();

  // Memoize the lead ID extraction
  const leadId = useMemo(() => sessionData.leadId, [sessionData.leadId]);

  // Check if we have an identity
  const hasIdentity = useMemo(() => !!leadId, [leadId]);

  // Identity-aware gating: true when leadAnchor exists AND core PII is complete
  // lastName is intentionally optional — many forms only require first name
  const isVerifiedLead = useMemo(() => {
    const hasAnchor = !!getLeadAnchor();
    const hasContact = !!(
      sessionData.firstName &&
      sessionData.email &&
      sessionData.phone
    );
    return hasAnchor && hasContact;
  }, [sessionData.firstName, sessionData.email, sessionData.phone]);

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
    isVerifiedLead,
    setLeadId,
    clearIdentity,
  };
}
