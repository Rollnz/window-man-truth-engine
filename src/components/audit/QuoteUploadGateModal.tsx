// ═══════════════════════════════════════════════════════════════════════════
// QuoteUploadGateModal - Lead capture gate triggered IMMEDIATELY after upload
// Core CRO: Gate results BEFORE analysis to maximize commitment-consistency
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail, Phone, User, FileCheck } from 'lucide-react';
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
}: QuoteUploadGateModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const openTimeRef = useRef<number | null>(null);

  // Form validation with ALL fields required
  const { values, errors, setValue, handleBlur, validateAll, setValues, clearErrors } = useFormValidation({
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

  // Track modal open + focus first input
  useEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
      trackModalOpen({ modalName: 'quote_upload_gate' });
      trackEvent('quote_upload_gate_open', {
        source: 'file_upload',
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
    if (!open) {
      const timeOpenMs = openTimeRef.current 
        ? Date.now() - openTimeRef.current 
        : 0;
      trackEvent('quote_upload_gate_close', {
        time_open_ms: timeOpenMs,
        submitted: false,
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
    });

    await onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
    });
  }, [values, validateAll, onSubmit]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-slate-900 border-slate-700/50 text-white p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()} // Prevent accidental close
      >
        {/* Visual Header */}
        <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 px-6 pt-6 pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-500/30 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-7 h-7 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Your Quote is Ready to Scan
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Enter your details to unlock your AI analysis
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* First Name / Last Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gate-firstName" className="text-white font-medium text-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
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
                  "h-10 bg-white text-slate-900 border-slate-300",
                  errors.firstName && "border-destructive focus-visible:ring-destructive"
                )}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && (
                <p id="firstName-error" className="text-destructive text-xs" role="alert">
                  {errors.firstName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gate-lastName" className="text-white font-medium text-sm">
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
                  "h-10 bg-white text-slate-900 border-slate-300",
                  errors.lastName && "border-destructive focus-visible:ring-destructive"
                )}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && (
                <p id="lastName-error" className="text-destructive text-xs" role="alert">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="gate-email" className="text-white font-medium text-sm flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address *
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
                "h-10 bg-white text-slate-900 border-slate-300",
                errors.email && "border-destructive focus-visible:ring-destructive"
              )}
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
            <Label htmlFor="gate-phone" className="text-white font-medium text-sm flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Phone Number *
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
                "h-10 bg-white text-slate-900 border-slate-300",
                errors.phone && "border-destructive focus-visible:ring-destructive"
              )}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="text-destructive text-xs" role="alert">
                {errors.phone}
              </p>
            )}
          </div>

          {/* Trust copy */}
          <p className="text-xs text-slate-500 leading-relaxed">
            We'll analyze your quote and send results to your email. 
            Your info is never shared or sold.
          </p>

          {/* CTA Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Unlock My AI Report
              </>
            )}
          </Button>

          {/* Micro-trust line */}
          <p className="text-center text-xs text-slate-600">
            No spam. No pressure. Just your honest analysis.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default QuoteUploadGateModal;
