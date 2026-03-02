// ============================================
// Quote Builder - Lead Capture Modal
// With Phone Verification (Twilio Lookup + OTP)
// ============================================

import { useEffect, useState, useCallback } from "react";
import { X, Check, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { NameInputPair, normalizeNameFields } from "@/components/ui/NameInputPair";
import { useFormValidation, commonSchemas, formatPhoneNumber } from "@/hooks/useFormValidation";
import { generateEventId } from "@/lib/gtm";
import { wmLead } from "@/lib/wmTracking";
import { getOrCreateClientId, getOrCreateSessionId } from "@/lib/tracking";
import { getLeadAnchor } from "@/lib/leadAnchor";
import { invokeEdgeFunction } from "@/lib/edgeFunction";
import { getAttributionData } from "@/lib/attribution";
import type { LeadModalProps, LeadFormData } from "@/types/quote-builder";

type Phase = "form" | "otp" | "success";

export const LeadModal = ({ isOpen, onClose, onSubmit, isSubmitting }: LeadModalProps) => {
  const [phase, setPhase] = useState<Phase>("form");
  const [otpCode, setOtpCode] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const { values, setValue, getFieldProps, hasError, getError, validateAll } = useFormValidation({
    initialValues: { firstName: '', lastName: '', email: '', phone: '' },
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPhase("form");
      setOtpCode("");
      setNormalizedPhone("");
    }
  }, [isOpen]);

  // Enriched dataLayer push on modal open
  useEffect(() => {
    if (isOpen) {
      const externalId = getLeadAnchor() || null;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'quote_builder_modal_opened',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: externalId,
        source_tool: 'quote-builder',
        source_system: 'web',
        modal_name: 'quote_builder_lead',
      });
    }
  }, [isOpen]);

  // Phase 1: Validate phone via Lookup + send OTP
  const handleInitialSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSendingOtp(true);
    try {
      const { data, error } = await invokeEdgeFunction('initiate-lead-verification', {
        body: { phone: values.phone },
      });

      if (error) {
        const msg = typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : "Please enter a valid mobile number to receive your quote.";
        toast.error(msg);
        return;
      }

      setNormalizedPhone(data?.phone || values.phone);
      setPhase("otp");
      toast.success("Verification code sent to your phone!");
    } catch {
      toast.error("Unable to send verification code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  }, [values, validateAll]);

  // Phase 3: Verify OTP code, save lead on approval
  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const { firstName, lastName } = normalizeNameFields(values.firstName, values.lastName);
      const attribution = getAttributionData();

      const { data, error } = await invokeEdgeFunction('verify-lead-otp', {
        body: {
          phone: normalizedPhone,
          code: otpCode,
          leadData: {
            email: values.email,
            name: [firstName, lastName].filter(Boolean).join(' '),
            firstName,
            lastName,
            sourceTool: 'quote-builder',
            attribution,
            clientId: getOrCreateClientId(),
          },
        },
      });

      if (error) {
        toast.error("Incorrect code, please try again.");
        setOtpCode("");
        return;
      }

      const leadId = data?.leadId;

      // Fire dataLayer event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'quote_builder_form_completed',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: leadId,
        source_tool: 'quote-builder',
        source_system: 'web',
        form_name: 'quote_builder_lead',
      });

      // Fire wmLead tracking
      if (leadId) {
        await wmLead(
          { leadId, email: values.email, phone: normalizedPhone, firstName, lastName: lastName || undefined },
          { source_tool: 'quote-builder' },
        );
      }

      // Call original onSubmit for parent state updates
      const formData: LeadFormData = {
        name: [firstName, lastName].filter(Boolean).join(' '),
        email: values.email,
        phone: normalizedPhone,
      };
      await onSubmit(formData);

      setPhase("success");

    } catch {
      toast.error("Verification failed. Please try again.");
      setOtpCode("");
    } finally {
      setIsVerifying(false);
    }
  }, [otpCode, normalizedPhone, values, onSubmit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm">
      <div className="bg-card shadow-xl rounded-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 border border-border transition-colors">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X size={24} />
        </button>

        {/* ── Phase: Form ─────────────────────────────────────── */}
        {phase === "form" && (
          <>
            <div className="text-center mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Your Estimate is Ready!</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                We've generated your project estimate. Where should we send the detailed PDF report?
              </p>
            </div>

            <form onSubmit={handleInitialSubmit} className="space-y-4">
              <NameInputPair
                firstName={values.firstName}
                lastName={values.lastName}
                onFirstNameChange={(value) => setValue('firstName', value)}
                onLastNameChange={(value) => setValue('lastName', value)}
                errors={{ firstName: getError('firstName'), lastName: getError('lastName') }}
                size="compact"
              />

              <div className="space-y-2">
                <Label htmlFor="lead-email" className="text-foreground font-semibold">Email Address</Label>
                <Input
                  id="lead-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="john@example.com"
                  className={hasError('email') ? 'border-destructive focus-visible:ring-destructive' : ''}
                  {...getFieldProps('email')}
                />
                {hasError('email') && (
                  <p className="text-sm text-destructive font-medium">{getError('email')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-phone" className="text-foreground font-semibold">Phone Number</Label>
                <Input
                  id="lead-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  className={hasError('phone') ? 'border-destructive focus-visible:ring-destructive' : ''}
                  {...getFieldProps('phone')}
                />
                {hasError('phone') && (
                  <p className="text-sm text-destructive font-medium">{getError('phone')}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating Phone...
                  </>
                ) : (
                  "Send My Quote & Report"
                )}
              </button>
            </form>
          </>
        )}

        {/* ── Phase: OTP Verification ─────────────────────────── */}
        {phase === "otp" && (
          <>
            <button
              onClick={() => { setPhase("form"); setOtpCode(""); }}
              className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Verify Your Phone</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Enter the 6-digit verification code sent to your phone.
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpCode.length !== 6}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Get Quote"
                )}
              </button>
            </div>
          </>
        )}

        {/* ── Phase: Success ──────────────────────────────────── */}
        {phase === "success" && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Phone Verified!</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Your quote is being prepared and will be sent to your email shortly.
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-4">
          Window Man respects your privacy. No spam, ever.
        </p>
      </div>
    </div>
  );
};
