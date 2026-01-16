// ============================================
// useLeadFormSubmit Hook
// ============================================
// Shared lead submission logic for Golden Thread integration.
// Handles validation, API calls, identity sync, and tracking.

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLeadIdentity } from './useLeadIdentity';
import { getAttributionData } from '@/lib/attribution';
import { trackLeadCapture, trackFormSubmit, trackEvent } from '@/lib/gtm';
import type { SourceTool } from '@/types/sourceTool';

export interface LeadFormData {
  email: string;
  name?: string;
  firstName?: string; // Will be normalized to `name`
  phone?: string;
  consent?: boolean;
}

export interface LeadFormSubmitOptions {
  /** The source tool identifier for attribution */
  sourceTool: SourceTool;
  /** Form location for analytics (e.g., 'main_cta', 'exit_intent') */
  formLocation?: string;
  /** Lead score for analytics (default: 50) */
  leadScore?: number;
  /** Callback after successful submission - receives the leadId */
  onSuccess?: (leadId: string) => void;
  /** URL to redirect to after success (with delay) */
  redirectTo?: string;
  /** Delay before redirect in ms (default: 1500) */
  redirectDelay?: number;
  /** Additional AI context to include */
  aiContext?: Record<string, unknown>;
  /** Success toast message */
  successTitle?: string;
  successDescription?: string;
}

export interface LeadFormSubmitResult {
  /** Submit function - pass form data */
  submit: (data: LeadFormData) => Promise<boolean>;
  /** Whether submission is in progress */
  isSubmitting: boolean;
  /** Error message if submission failed */
  error: string | null;
  /** Clear the error state */
  clearError: () => void;
}

/**
 * Shared hook for lead form submissions with Golden Thread integration.
 * 
 * Features:
 * - Automatic leadId fallback from useLeadIdentity
 * - Field normalization (firstName → name)
 * - GTM tracking with lead_id
 * - Flexible validation (email-only or full forms)
 * - Optional consent handling
 * - Configurable success actions (callback, redirect, toast)
 * 
 * Usage:
 * ```tsx
 * const { submit, isSubmitting, error } = useLeadFormSubmit({
 *   sourceTool: 'sales-tactics-guide',
 *   onSuccess: (leadId) => console.log('Captured:', leadId),
 *   redirectTo: '/comparison',
 * });
 * 
 * const handleSubmit = (e: React.FormEvent) => {
 *   e.preventDefault();
 *   submit({ email: values.email, name: values.name });
 * };
 * ```
 */
export function useLeadFormSubmit(options: LeadFormSubmitOptions): LeadFormSubmitResult {
  const {
    sourceTool,
    formLocation,
    leadScore = 50,
    onSuccess,
    redirectTo,
    redirectDelay = 1500,
    aiContext = {},
    successTitle = 'Success!',
    successDescription = 'Check your inbox for your download.',
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { leadId: existingLeadId, setLeadId } = useLeadIdentity();

  const clearError = useCallback(() => setError(null), []);

  const submit = useCallback(async (data: LeadFormData): Promise<boolean> => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required field
      if (!data.email || !data.email.trim()) {
        throw new Error('Email is required');
      }

      // Normalize field names (firstName → name)
      const normalizedName = data.name || data.firstName || undefined;

      // Build payload
      const payload: Record<string, unknown> = {
        email: data.email.trim(),
        sourceTool,
        attribution: getAttributionData(),
        aiContext: {
          source_form: formLocation ? `${sourceTool}-${formLocation}` : sourceTool,
          ...aiContext,
        },
      };

      // Add optional fields
      if (normalizedName) {
        payload.name = normalizedName.trim();
      }
      if (data.phone) {
        payload.phone = data.phone.trim();
      }
      if (existingLeadId) {
        payload.leadId = existingLeadId;
      }
      if (data.consent !== undefined) {
        payload.consent = data.consent;
      }

      // Submit to API
      const { data: responseData, error: apiError } = await supabase.functions.invoke('save-lead', {
        body: payload,
      });

      if (apiError) throw apiError;

      // Extract leadId from response
      const newLeadId = responseData?.leadId;
      if (newLeadId) {
        setLeadId(newLeadId);
      }

      // Track analytics with lead_id
      const effectiveLeadId = newLeadId || existingLeadId;

      trackFormSubmit(formLocation || sourceTool, {
        form_location: formLocation,
        lead_id: effectiveLeadId,
      });

      trackLeadCapture({
        sourceTool,
        email: data.email,
        leadScore,
        hasPhone: !!data.phone,
        leadId: effectiveLeadId,
      });

      trackEvent('generate_lead', {
        lead_source: sourceTool,
        form_location: formLocation,
        value: leadScore,
        lead_id: effectiveLeadId,
      });

      // Show success toast
      toast({
        title: successTitle,
        description: successDescription,
      });

      // Trigger callback
      if (onSuccess && effectiveLeadId) {
        onSuccess(effectiveLeadId);
      }

      // Handle redirect
      if (redirectTo) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, redirectDelay);
      }

      return true;
    } catch (err) {
      console.error('[useLeadFormSubmit] Submission error:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
      
      toast({
        title: 'Something went wrong',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });

      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    sourceTool,
    formLocation,
    leadScore,
    onSuccess,
    redirectTo,
    redirectDelay,
    aiContext,
    successTitle,
    successDescription,
    existingLeadId,
    setLeadId,
  ]);

  return {
    submit,
    isSubmitting,
    error,
    clearError,
  };
}
