import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { TrustModal } from '@/components/forms/TrustModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2 } from 'lucide-react';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { useSessionData } from '@/hooks/useSessionData';
import { trackEvent, trackModalOpen } from '@/lib/gtm';
import { AUDIT_CONFIG } from '@/config/auditConfig';

interface SampleReportGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

type FormStep = 'form' | 'success';

export function SampleReportGateModal({ 
  isOpen, 
  onClose, 
  returnFocusRef 
}: SampleReportGateModalProps) {
  const [step, setStep] = useState<FormStep>('form');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const openTimeRef = useRef<number | null>(null);
  const { sessionData } = useSessionData();

  // Form validation
  const {
    values,
    errors,
    setValue,
    validateAll,
    handleBlur,
    setValues,
    clearErrors,
  } = useFormValidation({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
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

  // Lead submission
  const { submit, isSubmitting } = useLeadFormSubmit({
    sourceTool: 'audit-sample-report',
    formLocation: 'audit_sample_gate',
    redirectTo: AUDIT_CONFIG.sampleGate.redirectTo,
    redirectDelay: AUDIT_CONFIG.sampleGate.redirectDelayMs,
    successTitle: 'Report Unlocked!',
    successDescription: 'Redirecting to your sample report...',
  });

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
      trackModalOpen({ modalName: 'audit_sample_gate' });
      trackEvent('audit_sample_gate_open', {
        trigger_element: returnFocusRef?.current?.tagName || 'unknown',
      });
    }
  }, [isOpen, returnFocusRef]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after close animation
      const timer = setTimeout(() => {
        setStep('form');
        setSubmitError(null);
        setValues({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        });
        clearErrors();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, setValues, clearErrors]);

  // Focus management - restore focus on close
  useEffect(() => {
    if (!isOpen && returnFocusRef?.current) {
      returnFocusRef.current.focus();
    }
  }, [isOpen, returnFocusRef]);

  // Handle close with tracking
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && step === 'form') {
      // Track close without submit
      const timeOpenMs = openTimeRef.current 
        ? Date.now() - openTimeRef.current 
        : 0;
      trackEvent('audit_sample_gate_close', {
        time_open_ms: timeOpenMs,
        submitted: false,
      });
    }
    if (!open) {
      onClose();
    }
  }, [onClose, step]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) {
      return;
    }

    // Track submit attempt
    trackEvent('audit_sample_gate_submit', {
      has_phone: !!values.phone,
      has_last_name: !!values.lastName,
    });

    try {
      const success = await submit({
        email: values.email,
        firstName: values.firstName,
        phone: values.phone,
      });

      if (success) {
        setStep('success');
        trackEvent('audit_sample_gate_success', {
          source_tool: 'audit-sample-report',
        });
        // Note: redirect happens automatically via useLeadFormSubmit
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setSubmitError(errorMessage);
      trackEvent('audit_sample_gate_error', {
        error_message: errorMessage,
      });
    }
  };

  const config = AUDIT_CONFIG.sampleGate;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <TrustModal 
        className="sm:max-w-md"
        headerAlign="center"
      >
        {step === 'form' ? (
          <>
            {/* Header with Lock Icon */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Lock className="w-7 h-7 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {config.headline}
              </h2>
              <p className="text-slate-600 text-sm mt-2">
                {config.subheadline}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name / Last Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={config.firstFocusId} className="text-slate-700 font-medium text-sm">
                    First Name
                  </Label>
                  <Input
                    id={config.firstFocusId}
                    type="text"
                    autoComplete="given-name"
                    autoFocus
                    value={values.firstName}
                    onChange={(e) => setValue('firstName', e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    className={errors.firstName ? 'border-destructive' : ''}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="text-destructive text-xs" role="alert">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sample-gate-lastName" className="text-slate-700 font-medium text-sm">
                    Last Name
                  </Label>
                  <Input
                    id="sample-gate-lastName"
                    type="text"
                    autoComplete="family-name"
                    value={values.lastName}
                    onChange={(e) => setValue('lastName', e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="sample-gate-email" className="text-slate-700 font-medium text-sm">
                  Email
                </Label>
                <Input
                  id="sample-gate-email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => setValue('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={errors.email ? 'border-destructive' : ''}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-destructive text-xs" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="sample-gate-phone" className="text-slate-700 font-medium text-sm">
                  Phone
                </Label>
                <Input
                  id="sample-gate-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  value={values.phone}
                  onChange={(e) => setValue('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-destructive text-xs" role="alert">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Inline error display */}
              {submitError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-destructive text-sm" role="alert">
                    {submitError}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {config.loadingText}
                  </>
                ) : (
                  config.cta
                )}
              </Button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold text-lg">
              {config.successText}
            </p>
          </div>
        )}
      </TrustModal>
    </Dialog>
  );
}
