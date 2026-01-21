/**
 * Lead ID Resolution Utility
 * 
 * Centralizes the logic for resolving lead identifiers across the admin system.
 * The canonical admin identifier is wm_leads.id, but links may contain leads.id
 * (which is wm_leads.lead_id). This utility transparently handles both.
 * 
 * Usage:
 *   import { resolveWmLeadId } from '../_shared/leadId.ts';
 *   const resolution = await resolveWmLeadId(supabase, inputId);
 *   if (!resolution.found) return errorResponse(404, 'not_found', 'Lead not found');
 *   const lead = resolution.lead;
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface LeadResolution {
  found: boolean;
  /** The canonical wm_leads.id */
  wm_lead_id: string | null;
  /** The public leads.id (wm_leads.lead_id) */
  lead_id: string | null;
  /** How the ID was resolved: 'primary' (wm_leads.id), 'fallback' (wm_leads.lead_id), or null */
  resolved_via: 'primary' | 'fallback' | null;
  /** The full wm_leads row if found */
  lead: Record<string, unknown> | null;
  /** Canonical URL path for admin UI */
  canonical_path: string | null;
}

/**
 * Resolves an input ID to a wm_leads record.
 * 
 * Resolution order:
 * 1. Try wm_leads.id = inputId (primary)
 * 2. Try wm_leads.lead_id = inputId (fallback - input was a leads.id)
 * 
 * @param supabase - Supabase client (service role recommended)
 * @param inputId - The UUID to resolve (could be wm_leads.id or leads.id)
 * @returns LeadResolution with found status and normalized IDs
 */
export async function resolveWmLeadId(
  supabase: SupabaseClient,
  inputId: string
): Promise<LeadResolution> {
  const emptyResult: LeadResolution = {
    found: false,
    wm_lead_id: null,
    lead_id: null,
    resolved_via: null,
    lead: null,
    canonical_path: null,
  };

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(inputId)) {
    return emptyResult;
  }

  // === PRIMARY LOOKUP: wm_leads.id ===
  const { data: primaryLead, error: primaryError } = await supabase
    .from('wm_leads')
    .select('*')
    .eq('id', inputId)
    .maybeSingle();

  if (primaryError) {
    console.error('[resolveWmLeadId] Primary lookup failed:', primaryError.message);
    throw new Error(`Database query failed: ${primaryError.message}`);
  }

  if (primaryLead) {
    return {
      found: true,
      wm_lead_id: primaryLead.id,
      lead_id: primaryLead.lead_id,
      resolved_via: 'primary',
      lead: primaryLead,
      canonical_path: `/admin/leads/${primaryLead.id}`,
    };
  }

  // === FALLBACK LOOKUP: wm_leads.lead_id (input was leads.id) ===
  const { data: fallbackLead, error: fallbackError } = await supabase
    .from('wm_leads')
    .select('*')
    .eq('lead_id', inputId)
    .maybeSingle();

  if (fallbackError) {
    console.error('[resolveWmLeadId] Fallback lookup failed:', fallbackError.message);
    throw new Error(`Database query failed: ${fallbackError.message}`);
  }

  if (fallbackLead) {
    console.log(`[resolveWmLeadId] ID ${inputId} resolved via fallback (lead_id → wm_leads.id: ${fallbackLead.id})`);
    return {
      found: true,
      wm_lead_id: fallbackLead.id,
      lead_id: fallbackLead.lead_id,
      resolved_via: 'fallback',
      lead: fallbackLead,
      canonical_path: `/admin/leads/${fallbackLead.id}`,
    };
  }

  // Not found in either lookup
  return emptyResult;
}

/**
 * Validates that a string is a valid UUID format
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
