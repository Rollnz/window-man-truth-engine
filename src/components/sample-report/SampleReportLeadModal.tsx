// ============================================
// Sample Report Lead Modal - 2-Step Flow
// ============================================
// Step 1: Lead capture (First Name, Last Name, Email, Phone)
// Step 2: Call conversion opportunity before continuing to scanner

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog } from '@/components/ui/dialog';
import { TrustModal } from '@/components/forms/TrustModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NameInputPair, normalizeNameFields } from '@/components/ui/NameInputPair';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { emailInputProps, phoneInputProps } from '@/lib/formAccessibility';
import { trackEvent, trackLeadSubmissionSuccess } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getAttributionData } from '@/lib/attribution';
import { setLeadAnchor, getLeadAnchor } from '@/lib/leadAnchor';
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/config/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type ModalStep = 'form' | 'call-offer';

interface SampleReportLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leadId: string) => void;
  ctaSource: string;
  preCheckPartnerConsent?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function SampleReportLeadModal({
  isOpen,
  onClose,
  onSuccess,
  ctaSource,
  preCheckPartnerConsent = false,
}: SampleReportLeadModalProps) {
  const navigate = useNavigate();
  
  // Step state
  const [step, setStep] = useState<ModalStep>('form');
  const [capturedLeadId, setCapturedLeadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerConsent, setPartnerConsent] = useState(preCheckPartnerConsent);

  // Form validation
  const { values, setValue, getFieldProps, hasError, getError, validateAll } = useFormValidation({
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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setCapturedLeadId(null);
      setPartnerConsent(preCheckPartnerConsent);
      
      // Track modal open
      trackEvent('sample_report_lead_modal_open', {
        cta_source: ctaSource,
        has_existing_lead: !!getLeadAnchor(),
      });
    }
  }, [isOpen, ctaSource, preCheckPartnerConsent]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 1: Form Submission
  // ═══════════════════════════════════════════════════════════════════════════

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalize names
      const { firstName, lastName } = normalizeNameFields(values.firstName, values.lastName);

      // Build payload
      const attribution = getAttributionData();
      const payload = {
        email: values.email.trim(),
        firstName,
        lastName: lastName || undefined,
        phone: values.phone.trim(),
        sourceTool: 'sample-report',
        sessionId: getOrCreateSessionId(),
        sessionData: {
          clientId: getOrCreateClientId(),
          partnerConsent,
          ctaSource,
        },
        attribution,
      };

      // Call save-lead edge function
      const { data, error } = await supabase.functions.invoke('save-lead', {
        body: payload,
      });

      if (error) {
        console.error('[SampleReportLeadModal] save-lead error:', error);
        toast.error('Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (!data?.success || !data?.leadId) {
        console.error('[SampleReportLeadModal] Invalid response:', data);
        toast.error('Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const newLeadId = data.leadId;

      // Set lead anchor for future visits
      setLeadAnchor(newLeadId);
      setCapturedLeadId(newLeadId);

      // Track lead capture
      trackEvent('sample_report_lead_captured', {
        lead_id: newLeadId,
        cta_source: ctaSource,
        partner_consent: partnerConsent,
      });

      // Fire lead submission success for conversion tracking
      await trackLeadSubmissionSuccess({
        leadId: newLeadId,
        email: values.email.trim(),
        phone: values.phone.trim(),
        firstName,
        lastName: lastName || undefined,
        sourceTool: 'sample-report',
        eventId: `sample_report_lead:${newLeadId}`,
        value: 100, // $100 value for lead captured
      });

      // Transition to Step 2 (call offer)
      setStep('call-offer');
    } catch (err) {
      console.error('[SampleReportLeadModal] Unexpected error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 2: Call Offer Actions
  // ═══════════════════════════════════════════════════════════════════════════

  const handleCallClick = () => {
    trackEvent('sample_report_modal_step2_call', {
      lead_id: capturedLeadId,
      cta_source: ctaSource,
      phone_number: '+15614685571',
    });
    // Don't close modal - tel: link will handle the call
  };

  const handleContinueClick = () => {
    trackEvent('sample_report_modal_step2_continue', {
      lead_id: capturedLeadId,
      cta_source: ctaSource,
    });
    onClose();
    navigate(`${ROUTES.QUOTE_SCANNER}?lead=${capturedLeadId}#upload`);
  };

  const handleModalClose = () => {
    if (step === 'call-offer' && capturedLeadId) {
      // If closed during Step 2, navigate to scanner
      onClose();
      navigate(`${ROUTES.QUOTE_SCANNER}?lead=${capturedLeadId}#upload`);
    } else {
      // Track close without submit
      trackEvent('sample_report_lead_modal_close', {
        cta_source: ctaSource,
        step,
      });
      onClose();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <TrustModal
        modalTitle={step === 'form' ? "Almost There — Let's Personalize Your Audit" : undefined}
        modalDescription={step === 'form' ? "Enter your details to get your free AI-powered quote analysis" : undefined}
        headerAlign="center"
        className="sm:max-w-md"
      >
        {step === 'form' ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Name Fields */}
            <NameInputPair
              firstName={values.firstName}
              lastName={values.lastName}
              onFirstNameChange={(value) => setValue('firstName', value)}
              onLastNameChange={(value) => setValue('lastName', value)}
              errors={{
                firstName: getError('firstName'),
                lastName: getError('lastName'),
              }}
              size="compact"
            />

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="sr-email" className="text-slate-900 dark:text-slate-900 font-semibold">
                Email Address
              </Label>
              <Input
                id="sr-email"
                name="email"
                placeholder="you@example.com"
                {...getFieldProps('email')}
                {...emailInputProps}
                className={hasError('email') ? 'border-destructive focus-visible:ring-destructive' : ''}
                aria-invalid={hasError('email')}
                aria-describedby={hasError('email') ? 'sr-email-error' : undefined}
              />
              {hasError('email') && (
                <p id="sr-email-error" className="text-sm text-destructive font-medium">{getError('email')}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="sr-phone" className="text-slate-900 dark:text-slate-900 font-semibold">
                Phone Number
              </Label>
              <Input
                id="sr-phone"
                name="phone"
                placeholder="(555) 123-4567"
                {...getFieldProps('phone')}
                {...phoneInputProps}
                className={hasError('phone') ? 'border-destructive focus-visible:ring-destructive' : ''}
                aria-invalid={hasError('phone')}
                aria-describedby={hasError('phone') ? 'sr-phone-error' : 'sr-phone-hint'}
              />
              <p id="sr-phone-hint" className="text-xs text-slate-500 dark:text-slate-500">
                We'll text your report link and only call if you request it
              </p>
              {hasError('phone') && (
                <p id="sr-phone-error" className="text-sm text-destructive font-medium">{getError('phone')}</p>
              )}
            </div>

            {/* Partner Consent - Fixed accessibility with id/htmlFor */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-50 border border-slate-200 dark:border-slate-200">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="sr-partner-consent"
                  checked={partnerConsent}
                  onCheckedChange={(checked) => setPartnerConsent(checked === true)}
                  className="mt-1"
                  aria-describedby="sr-partner-consent-desc"
                />
                <label htmlFor="sr-partner-consent" className="cursor-pointer">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-900">
                    Yes — share my project specs with vetted partners to get competing estimates
                  </span>
                  <p id="sr-partner-consent-desc" className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Window Man may connect you with pre-screened contractors who can offer better pricing. Your contact info is never sold.
                  </p>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="cta"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Get My Free Audit'
              )}
            </Button>

            {/* Trust Footer */}
            <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
              🔒 No spam. No obligation. Your info stays private.
            </p>
          </form>
        ) : (
          /* Step 2: Call Offer */
          <div className="space-y-6 py-4">
            {/* Success indicator */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-900">
                Great! We've received your info.
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-600 mt-1">
                Want answers now? Call WindowMan directly for free.
              </p>
            </div>

            {/* Primary: Call CTA */}
            <a
              href="tel:+15614685571"
              onClick={handleCallClick}
              className="block"
            >
              <Button
                variant="cta"
                size="lg"
                className="w-full h-auto py-4 flex flex-col items-center gap-1 shadow-lg shadow-primary/20"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  <span className="font-bold">Call WindowMan Now</span>
                </div>
                <span className="text-lg font-semibold">(561) 468-5571</span>
                <span className="text-sm opacity-90">Get Answers or a Better Estimate</span>
              </Button>
            </a>

            {/* Secondary: Continue to Audit - Fixed touch target */}
            <button
              type="button"
              onClick={handleContinueClick}
              className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-900 transition-colors py-3 min-h-[44px]"
            >
              <span>Continue to My Free Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </TrustModal>
    </Dialog>
  );
}
