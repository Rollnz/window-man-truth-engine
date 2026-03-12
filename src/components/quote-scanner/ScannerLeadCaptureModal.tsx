import { useState, useCallback } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { TrustModal } from '@/components/forms/TrustModal';
import { ScannerStep1Contact } from './steps/ScannerStep1Contact';
import { ScannerStep2Project } from './steps/ScannerStep2Project';
import { ScannerStep3Analysis } from './steps/ScannerStep3Analysis';
import { OtpGate } from '@/components/signup2/OtpGate';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useScore } from '@/contexts/ScoreContext';
import { trackEvent } from '@/lib/gtm';
import { wmLead } from '@/lib/wmTracking';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getAttributionData } from '@/lib/attribution';
import { normalizeNameFields } from '@/components/ui/NameInputPair';
import { toast } from 'sonner';
import type { SourceTool } from '@/types/sourceTool';

type ModalStep = 'contact' | 'project' | 'otp' | 'analysis';

interface ScannerLeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: () => void;
  onFileSelect: (file: File) => Promise<void>;
  isAnalyzing: boolean;
  sessionData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

export function ScannerLeadCaptureModal({
  isOpen,
  onClose,
  onAnalysisComplete,
  onFileSelect,
  isAnalyzing,
  sessionData: initialSessionData,
}: ScannerLeadCaptureModalProps) {
  const [step, setStep] = useState<ModalStep>('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactData, setContactData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingProjectData, setPendingProjectData] = useState<{
    phone: string;
    windowCount: string;
    quotePrice: string;
    wantsBeatQuote: boolean;
    file: File;
  } | null>(null);

  // ── Change-number state ──────────────────────────────────
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [previousPhone, setPreviousPhone] = useState<string | null>(null);

  const { sessionData, updateField } = useSessionData();
  const { leadId, setLeadId } = useLeadIdentity();
  const { awardScore } = useScore();

  // Reset state when modal closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(() => {
        setStep('contact');
        setContactData(null);
        setIsSubmitting(false);
        setOtpPhone('');
        setOtpError(null);
        setIsVerifying(false);
        setPendingProjectData(null);
        setAttemptsUsed(0);
        setPreviousPhone(null);
      }, 300);
    }
  }, [onClose]);

  // Step 1: Contact submission
  const handleContactSubmit = async (data: { firstName: string; lastName: string; email: string }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const clientId = getOrCreateClientId();
      const sessionId = getOrCreateSessionId();
      const attribution = getAttributionData();
      const { firstName, lastName } = normalizeNameFields(data.firstName, data.lastName);

      const { data: result, error } = await invokeEdgeFunction('save-lead', {
        body: {
          email: data.email,
          firstName,
          lastName,
          sourceTool: 'quote-scanner' satisfies SourceTool,
          sessionData: {
            clientId,
            sessionId,
            ...attribution,
          },
        },
      });

      if (error) throw error;

      const newLeadId = result?.leadId;
      if (newLeadId) {
        setLeadId(newLeadId);
        updateField('leadId', newLeadId);
        updateField('email', data.email);
        updateField('firstName', firstName);
        updateField('lastName', lastName);

        await wmLead(
          { leadId: newLeadId, email: data.email, firstName, lastName },
          { source_tool: 'quote-scanner' },
        );

        try {
          await awardScore({
            eventType: 'LEAD_CAPTURED',
            sourceEntityType: 'lead',
            sourceEntityId: newLeadId,
          });
        } catch (e) {
          console.error('[ScannerModal] Score award failed:', e);
        }
      }

      setContactData({ firstName, lastName, email: data.email });
      setStep('project');

      trackEvent('scanner_step1_complete', { source_tool: 'quote-scanner' });
    } catch (error) {
      console.error('[ScannerModal] Contact submit error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Project details + file upload → initiate OTP
  const handleProjectSubmit = async (data: {
    phone: string;
    windowCount: string;
    quotePrice: string;
    wantsBeatQuote: boolean;
    file: File;
  }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      updateField('phone', data.phone);
      if (data.windowCount) {
        updateField('windowCount', parseInt(data.windowCount, 10));
      }

      const currentLeadId = leadId || sessionData.leadId;
      if (currentLeadId && data.phone) {
        await invokeEdgeFunction('crm-leads', {
          body: {
            leadId: currentLeadId,
            updates: { phone: data.phone },
          },
        });

        trackEvent('scanner_project_details', {
          source_tool: 'quote-scanner',
          window_count: data.windowCount || undefined,
          quote_price: data.quotePrice || undefined,
          wants_beat_quote: data.wantsBeatQuote,
        });
      }

      setPendingProjectData(data);
      setOtpPhone(data.phone);

      // Send OTP
      const { data: otpResult, error: otpError } = await invokeEdgeFunction('initiate-lead-verification', {
        body: { phone: data.phone },
      });

      if (otpError || !otpResult?.success) {
        const errMsg = otpResult?.error || 'Failed to send verification code. Please try again.';
        toast.error(errMsg);
        setIsSubmitting(false);
        return;
      }

      // Track attempts from backend response
      if (typeof otpResult?.attemptsUsed === 'number') {
        setAttemptsUsed(otpResult.attemptsUsed);
      }

      setStep('otp');
      trackEvent('scanner_otp_sent', { source_tool: 'quote-scanner' });
    } catch (error) {
      console.error('[ScannerModal] Project submit error:', error);
      toast.error('Upload failed. Please try again.');
      setStep('project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP verification handler
  const handleOtpVerify = useCallback(async (code: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setOtpError(null);

    try {
      const { data: result, error } = await invokeEdgeFunction('verify-lead-otp', {
        body: {
          phone: otpPhone,
          code,
          leadData: {
            email: contactData?.email,
            firstName: contactData?.firstName,
            lastName: contactData?.lastName,
            sourceTool: 'quote-scanner' satisfies SourceTool,
          },
        },
      });

      if (error || !result?.success) {
        setOtpError(result?.error || 'Incorrect code, please try again.');
        setIsVerifying(false);
        return;
      }

      trackEvent('scanner_otp_verified', { source_tool: 'quote-scanner' });

      setStep('analysis');

      if (pendingProjectData) {
        await onFileSelect(pendingProjectData.file);
      }
    } catch (err) {
      console.error('[ScannerModal] OTP verify error:', err);
      setOtpError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [otpPhone, contactData, pendingProjectData, onFileSelect]);

  // OTP resend handler
  const handleOtpResend = useCallback(async () => {
    const { error } = await invokeEdgeFunction('initiate-lead-verification', {
      body: { phone: otpPhone, leadId: leadId || sessionData.leadId, previousPhone: otpPhone },
    });
    if (error) {
      toast.error('Failed to resend code. Please try again.');
    }
  }, [otpPhone, leadId, sessionData.leadId]);

  // ── Change Number handler ────────────────────────────────
  const handleChangeNumber = useCallback(() => {
    // Store the current (wrong) phone as previousPhone
    setPreviousPhone(otpPhone);
    // Clear OTP error
    setOtpError(null);
    // Go back to project step so they can fix the number
    setStep('project');

    trackEvent('scanner_change_number_clicked', {
      source_tool: 'quote-scanner',
      attempts_used: attemptsUsed,
    });
  }, [otpPhone, attemptsUsed]);

  // Corrected number submission (re-entry from project step after change)
  const handleCorrectedProjectSubmit = async (data: {
    phone: string;
    windowCount: string;
    quotePrice: string;
    wantsBeatQuote: boolean;
    file: File;
  }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const currentLeadId = leadId || sessionData.leadId;

    try {
      setPendingProjectData(data);

      // Call initiate-lead-verification with leadId + previousPhone for server-side tracking
      const { data: otpResult, error: otpErr } = await invokeEdgeFunction('initiate-lead-verification', {
        body: {
          phone: data.phone,
          leadId: currentLeadId,
          previousPhone: previousPhone || otpPhone,
        },
      });

      // Always sync attemptsUsed from backend response
      if (typeof otpResult?.attemptsUsed === 'number') {
        setAttemptsUsed(otpResult.attemptsUsed);
      }

      if (otpErr) {
        toast.error('Failed to send verification code. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Handle specific error codes
      if (otpResult?.error === 'max_attempts_reached') {
        setAttemptsUsed(otpResult.attemptsUsed ?? 2);
        // Go to OTP screen to show the "Call us" fallback
        setOtpPhone(data.phone);
        setStep('otp');
        setIsSubmitting(false);
        return;
      }

      if (otpResult?.error) {
        // VOIP rejection or other error — stay on project step
        toast.error(otpResult.error);
        setIsSubmitting(false);
        return;
      }

      // Success — update phone and go to OTP
      setOtpPhone(data.phone);
      setStep('otp');

      trackEvent('scanner_otp_resent_new_number', {
        source_tool: 'quote-scanner',
        attempts_used: otpResult?.attemptsUsed ?? attemptsUsed,
      });
    } catch (error) {
      console.error('[ScannerModal] Corrected number submit error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Analysis complete
  const handleAnalysisComplete = useCallback(() => {
    onAnalysisComplete();
    onClose();
  }, [onAnalysisComplete, onClose]);

  // Determine which project submit handler to use
  const projectSubmitHandler = previousPhone ? handleCorrectedProjectSubmit : handleProjectSubmit;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <TrustModal className="sm:max-w-md">
        {step === 'contact' && (
          <ScannerStep1Contact
            initialValues={{
              firstName: initialSessionData?.firstName || sessionData.firstName,
              lastName: initialSessionData?.lastName || sessionData.lastName,
              email: initialSessionData?.email || sessionData.email,
            }}
            onSubmit={handleContactSubmit}
            isLoading={isSubmitting}
          />
        )}

        {step === 'project' && (
          <ScannerStep2Project
            onSubmit={projectSubmitHandler}
            isLoading={isSubmitting}
            initialPhone={previousPhone || undefined}
          />
        )}

        {step === 'otp' && (
          <OtpGate
            phone={otpPhone}
            onVerify={handleOtpVerify}
            onResend={handleOtpResend}
            onChangeNumber={handleChangeNumber}
            isVerifying={isVerifying}
            error={otpError}
            attemptsUsed={attemptsUsed}
            maxAttempts={2}
          />
        )}

        {step === 'analysis' && (
          <ScannerStep3Analysis
            onComplete={handleAnalysisComplete}
            isAnalyzing={isAnalyzing}
          />
        )}
      </TrustModal>
    </Dialog>
  );
}
