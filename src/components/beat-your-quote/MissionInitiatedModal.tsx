import { useState, useEffect, useCallback } from 'react';
import { Loader2, Shield, Send, Sparkles } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { TrustModal } from '@/components/forms/TrustModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NameInputPair, normalizeNameFields } from '@/components/ui/NameInputPair';
import { useFormValidation, formatPhoneNumber, commonSchemas } from '@/hooks/useFormValidation';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useSessionData } from '@/hooks/useSessionData';
import { useFormAbandonment } from '@/hooks/useFormAbandonment';
import { useScore } from '@/contexts/ScoreContext';
import { getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { getAttributionData } from '@/lib/attribution';
import { trackFormSubmit, generateEventId } from '@/lib/gtm';
import { wmLead } from '@/lib/wmTracking';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getLeadAnchor } from '@/lib/leadAnchor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { emailInputProps, phoneInputProps } from '@/lib/formAccessibility';

interface MissionInitiatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The quote file ID to link to the captured lead */
  quoteFileId: string;
  /** Called when lead is successfully captured - receives leadId and name */
  onLeadCaptured?: (leadId: string, leadName?: string) => void;
}

export function MissionInitiatedModal({
  isOpen,
  onClose,
  quoteFileId,
  onLeadCaptured,
}: MissionInitiatedModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanning, setShowScanning] = useState(true);
  const [formStarted, setFormStarted] = useState(false);
  const { leadId: existingLeadId, setLeadId } = useLeadIdentity();
  const { sessionData } = useSessionData();
  const { awardScore } = useScore();

  // Form abandonment tracking (Phase 7)
  const { trackFieldEntry, resetTracking } = useFormAbandonment({
    formId: 'mission_initiated',
    sourceTool: 'beat-your-quote',
    isSubmitted: isSubmitting,
  });

  const {
    values,
    setValue,
    getFieldProps,
    validateAll,
    hasError,
    getError,
  } = useFormValidation({
    initialValues: { firstName: '', lastName: '', email: '', phone: '' },
    schemas: {
      firstName: commonSchemas.firstName,
      lastName: commonSchemas.lastName,
      email: commonSchemas.email,
      phone: commonSchemas.phone,
    },
    formatters: {
      phone: formatPhoneNumber,
    },
  });

  // Show scanning animation for 1.5s before revealing form
  useEffect(() => {
    if (isOpen) {
      setShowScanning(true);
      const timer = setTimeout(() => setShowScanning(false), 1500);
      
      // Enriched dataLayer push for funnel reconstruction
      const externalId = existingLeadId || getLeadAnchor() || null;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'mission_modal_opened',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: externalId,
        source_tool: 'beat-your-quote',
        source_system: 'web',
        modal_name: 'mission_initiated',
        quote_file_id: quoteFileId,
      });
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, existingLeadId, quoteFileId]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) return;
    
    setIsSubmitting(true);
    
    // Normalize name fields
    const { firstName, lastName } = normalizeNameFields(values.firstName, values.lastName);
    
    try {
      const sessionId = sessionData.claimVaultSessionId || crypto.randomUUID();
      
      const payload = {
        email: values.email.trim(),
        firstName,
        lastName: lastName || null,
        phone: values.phone.trim(),
        sourceTool: 'beat-your-quote' as const,
        attribution: getAttributionData(),
        sessionId,
        quoteFileId, // Link the uploaded file
        sessionData: {
          clientId: getOrCreateAnonId(),
        },
        aiContext: {
          source_form: 'beat-your-quote-upload',
        },
        ...(existingLeadId && { leadId: existingLeadId }),
      };

      const { data, error } = await supabase.functions.invoke('save-lead', {
        body: payload,
      });

      if (error) throw error;

      const newLeadId = data?.leadId;
      if (newLeadId) {
        setLeadId(newLeadId);
      }

      // Track analytics
      const effectiveLeadId = newLeadId || existingLeadId;
      
      // Enriched dataLayer push for mission form completion
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'mission_form_completed',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: effectiveLeadId || null,
        source_tool: 'beat-your-quote',
        source_system: 'web',
        form_name: 'mission_initiated',
        quote_file_id: quoteFileId,
        user_data: {
          first_name: firstName,
          last_name: lastName || undefined,
        },
      });
      
      trackFormSubmit({
        formName: 'beat-your-quote-upload',
        formId: 'mission_initiated_modal',
        sourceTool: 'beat-your-quote',
      });

      // 🔐 CANONICAL SCORING: Award points for lead capture
      // Wrapped in try/catch to silently handle 403 ownership errors
      if (effectiveLeadId) {
        try {
          await awardScore({
            eventType: 'LEAD_CAPTURED',
            sourceEntityType: 'lead',
            sourceEntityId: effectiveLeadId,
          });
        } catch (scoreError) {
          // Silently handle ownership validation failures (403)
          // This is expected for returning users with new sessions
          console.debug('[MissionInitiatedModal] Score award failed (non-blocking):', scoreError);
        }
      }

      // Push wmLead conversion event
      await wmLead(
        { leadId: effectiveLeadId || '', email: values.email, phone: values.phone || undefined, firstName, lastName: lastName || undefined },
        { source_tool: 'beat-your-quote' },
      );

      toast({
        title: 'Mission Received!',
        description: 'Our expert is reviewing your quote. Expect a text in 5 minutes.',
      });

      // Notify parent with leadId and name
      if (onLeadCaptured && effectiveLeadId) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        onLeadCaptured(effectiveLeadId, fullName);
      }

      onClose();
    } catch (err) {
      console.error('[MissionInitiatedModal] Submit error:', err);
      toast({
        title: 'Something went wrong',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll, sessionData, existingLeadId, setLeadId, quoteFileId, onLeadCaptured, onClose, awardScore]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <TrustModal 
        className="sm:max-w-md"
        modalTitle={showScanning ? undefined : "Analysis in Progress..."}
        modalDescription={showScanning ? undefined : "Where should we send the report?"}
      >
        {showScanning ? (
          // Scanning animation state - colors adjusted for white background
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '2s' }} />
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-primary/30 animate-ping" />
            </div>
            <p className="text-lg font-semibold text-slate-900 mb-2">Scanning Your Quote...</p>
            <p className="text-sm text-slate-500">AI analysis in progress</p>
          </div>
        ) : (
          // Form state - clean white card with high contrast
          <form onSubmit={handleSubmit} className="space-y-3 mt-4">
            {/* First/Last Name */}
            <NameInputPair
              firstName={values.firstName}
              lastName={values.lastName}
              onFirstNameChange={(value) => setValue('firstName', value)}
              onLastNameChange={(value) => setValue('lastName', value)}
              errors={{ firstName: getError('firstName'), lastName: getError('lastName') }}
              disabled={isSubmitting}
              size="compact"
            />

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="mission-email" className="font-semibold text-slate-900">Email</Label>
              <Input
                id="mission-email"
                name="email"
                placeholder="your@email.com"
                className={cn(
                  "h-9 bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 shadow-sm",
                  hasError('email') && "border-destructive"
                )}
                {...getFieldProps('email')}
                {...emailInputProps}
                disabled={isSubmitting}
              />
              {hasError('email') && (
                <p className="text-xs text-destructive">{getError('email')}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="mission-phone" className="font-semibold text-slate-900">Phone</Label>
              <Input
                id="mission-phone"
                name="phone"
                placeholder="(555) 123-4567"
                className={cn(
                  "h-9 bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 shadow-sm",
                  hasError('phone') && "border-destructive"
                )}
                {...getFieldProps('phone')}
                {...phoneInputProps}
                disabled={isSubmitting}
              />
              {hasError('phone') && (
                <p className="text-xs text-destructive">{getError('phone')}</p>
              )}
            </div>

            {/* Submit Button - CTA variant for maximum visibility */}
            <Button
              type="submit"
              variant="cta"
              className="w-full mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send My Report
                </>
              )}
            </Button>

            {/* Trust indicator - dark text for white background */}
            <p className="text-xs text-center text-slate-500 pt-2">
              <Shield className="inline w-3 h-3 mr-1" />
              Your info is encrypted and never shared with contractors.
            </p>
          </form>
        )}
      </TrustModal>
    </Dialog>
  );
}
