// ═══════════════════════════════════════════════════════════════════════════
// QuoteUploadGateModal - Lead capture gate triggered IMMEDIATELY after upload
// Core CRO: Gate results BEFORE analysis to maximize commitment-consistency
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Lock, Mail, Phone, User, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { trackEvent, trackModalOpen } from '@/lib/gtm';
import type { ExplainScoreFormData } from '@/types/audit';

interface QuoteUploadGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExplainScoreFormData) => Promise<void>;
  isLoading?: boolean;
  /** Ref to element that triggered the modal for focus restoration */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /** Scan attempt ID for deterministic micro-tease rotation */
  scanAttemptId?: string;
}

/**
 * QuoteUploadGateModal
 * 
 * Lead capture modal that fires IMMEDIATELY after file upload.
 * User is invested (uploaded their doc) → high conversion probability.
 * 
 * Required fields: First Name, Last Name, Email, Phone
 */
export function QuoteUploadGateModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  returnFocusRef,
  scanAttemptId
}: QuoteUploadGateModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const openTimeRef = useRef<number | null>(null);
  const [smsConsent, setSmsConsent] = useState(false);

  // Form validation with ALL fields required
  const { values, errors, setValue, handleBlur, validateAll, setValues, clearErrors } = useFormValidation({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    schemas: {
      firstName: commonSchemas.firstName,
      lastName: commonSchemas.lastName,
      email: commonSchemas.email,
      phone: commonSchemas.phone
    },
    formatters: {
      phone: formatPhoneNumber
    }
  });

  // Track modal open + focus first input
  useEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
      trackModalOpen({ modalName: 'quote_upload_gate' });
      trackEvent('quote_upload_gate_open', {
        source: 'file_upload'
      });

      // Auto-focus first input after animation
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setValues({
          firstName: '',
          lastName: '',
          email: '',
          phone: ''
        });
        clearErrors();
        setSmsConsent(false);
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
    if (!open) {
      const timeOpenMs = openTimeRef.current ?
      Date.now() - openTimeRef.current :
      0;
      trackEvent('quote_upload_gate_close', {
        time_open_ms: timeOpenMs,
        submitted: false
      });
      onClose();
    }
  }, [onClose]);

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateAll();
    if (!isValid) return;

    trackEvent('quote_upload_gate_submit', {
      has_all_fields: true,
      sms_consent: smsConsent
    });

    await onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone
    });
  }, [values, validateAll, onSubmit, smsConsent]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-[#e5e5e5] border-slate-200 text-slate-900 p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}>

        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-900">
              Your Quote Is Ready to Audit
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your quote is uploaded and ready. Enter your details to start the audit and unlock your full breakdown, warnings, and recommendations.
          </p>
        </div>

        {/* Micro-tease pill */}
        <div className="mx-6 mb-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              {(() => {
                const variants = [
                  'Pre-check: review areas may exist in scope / fine print.',
                  'Pre-check: potential omissions detected in scope wording.',
                  'Pre-check: contract clarity signals flagged for review.',
                ];
                if (!scanAttemptId) return variants[0];
                let hash = 0;
                for (let i = 0; i < scanAttemptId.length; i++) {
                  hash = ((hash << 5) - hash + scanAttemptId.charCodeAt(i)) | 0;
                }
                return variants[Math.abs(hash) % variants.length];
              })()}
            </p>
          </div>
        </div>

        {/* Trust Banner */}
        <div className="mx-6 mb-2">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-50 border border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              <span className="font-bold">Your data is secure.</span> Your report will be saved in your Vault.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* First Name / Last Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gate-firstName" className="text-slate-800 font-medium text-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                First Name *
              </Label>
              <Input
                ref={firstInputRef}
                id="gate-firstName"
                type="text"
                autoComplete="given-name"
                value={values.firstName}
                onChange={(e) => setValue('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                disabled={isLoading}
                className={cn(
                  "h-10 bg-white text-slate-900 border-slate-500",
                  errors.firstName && "border-destructive focus-visible:ring-destructive"
                )}
                aria-required="true"
                aria-describedby={errors.firstName ? 'firstName-error' : undefined} />

              {errors.firstName &&
              <p id="firstName-error" className="text-destructive text-xs" role="alert">
                  {errors.firstName}
                </p>
              }
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gate-lastName" className="text-slate-800 font-medium text-sm">
                Last Name *
              </Label>
              <Input
                id="gate-lastName"
                type="text"
                autoComplete="family-name"
                value={values.lastName}
                onChange={(e) => setValue('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                disabled={isLoading}
                className={cn(
                  "h-10 bg-white text-slate-900 border-slate-500",
                  errors.lastName && "border-destructive focus-visible:ring-destructive"
                )}
                aria-required="true"
                aria-describedby={errors.lastName ? 'lastName-error' : undefined} />

              {errors.lastName &&
              <p id="lastName-error" className="text-destructive text-xs" role="alert">
                  {errors.lastName}
                </p>
              }
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="gate-email" className="text-slate-800 font-medium text-sm flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Email *
            </Label>
            <Input
              id="gate-email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              disabled={isLoading}
              className={cn(
                "h-10 bg-white text-slate-900 border-slate-500",
                errors.email && "border-destructive focus-visible:ring-destructive"
              )}
              aria-required="true"
              aria-describedby={errors.email ? 'email-error' : undefined} />

            {errors.email &&
            <p id="email-error" className="text-destructive text-xs" role="alert">
                {errors.email}
              </p>
            }
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="gate-phone" className="text-slate-800 font-medium text-sm flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              Phone *
            </Label>
            <Input
              id="gate-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 123-4567"
              value={values.phone}
              onChange={(e) => setValue('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              disabled={isLoading}
              className={cn(
                "h-10 bg-white text-slate-900 border-slate-500",
                errors.phone && "border-destructive focus-visible:ring-destructive"
              )}
              aria-required="true"
              aria-describedby={errors.phone ? 'phone-error' : undefined} />

            {errors.phone &&
            <p id="phone-error" className="text-destructive text-xs" role="alert">
                {errors.phone}
              </p>
            }
          </div>

          {/* SMS Consent Checkbox */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="sms-consent"
              checked={smsConsent}
              onCheckedChange={(checked) => setSmsConsent(checked === true)}
              className="mt-0.5" />

            <label htmlFor="sms-consent" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
              I agree to receive SMS updates about my quote analysis. Message &amp; data rates may apply. Reply STOP to unsubscribe.
            </label>
          </div>

          {/* CTA Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base">

            {isLoading ?
            <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Analysis...
              </> :

            <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start My Analysis
              </>
            }
          </Button>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500">
            By submitting, you agree to our Terms of Service and Privacy Policy. 
          </p>
        </form>
      </DialogContent>
    </Dialog>);

}

export default QuoteUploadGateModal;