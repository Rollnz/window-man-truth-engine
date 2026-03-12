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
  /** Called when analysis is complete with results ready */
  onAnalysisComplete: () => void;
  /** Called when file is selected, triggers actual analysis */
  onFileSelect: (file: File) => Promise<void>;
  /** Whether the AI analysis is in progress */
  isAnalyzing: boolean;
  /** Pre-fill from session data */
  sessionData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

/**
 * ScannerLeadCaptureModal - 3-step lead capture flow for Quote Scanner
 * 
 * Step 1: Contact (first name, last name, email)
 * Step 2: Project details (phone, window count, quote price, beat-my-quote checkbox) + upload trigger
 * Step 3: 5-second theatrical analysis loading
 */
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

  const { sessionData, updateField } = useSessionData();
  const { setLeadId } = useLeadIdentity();
  const { awardScore } = useScore();

  // Reset state when modal opens
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      onClose();
      // Reset after animation
      setTimeout(() => {
        setStep('contact');
        setContactData(null);
        setIsSubmitting(false);
        setOtpPhone('');
        setOtpError(null);
        setIsVerifying(false);
        setPendingProjectData(null);
      }, 300);
    }
  }, [onClose]);

  // Step 1: Contact submission
  const handleContactSubmit = async (data: { firstName: string; lastName: string; email: string }) => {
    setIsSubmitting(true);
    
    try {
      const clientId = getOrCreateClientId();
      const sessionId = getOrCreateSessionId();
      const attribution = getAttributionData();

      // Normalize names
      const { firstName, lastName } = normalizeNameFields(data.firstName, data.lastName);

      // Save lead via edge function
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

      const leadId = result?.leadId;
      if (leadId) {
        setLeadId(leadId);
        updateField('leadId', leadId);
        updateField('email', data.email);
        updateField('firstName', firstName);
        updateField('lastName', lastName);

        // Track lead capture via wmLead
        await wmLead(
          { leadId, email: data.email, firstName, lastName },
          { source_tool: 'quote-scanner' },
        );

        // Award Truth Engine points
        try {
          await awardScore({
            eventType: 'LEAD_CAPTURED',
            sourceEntityType: 'lead',
            sourceEntityId: leadId,
          });
        } catch (e) {
          console.error('[ScannerModal] Score award failed:', e);
        }
      }

      setContactData({ firstName, lastName, email: data.email });
      setStep('project');

      // Track modal progression
      trackEvent('scanner_step1_complete', {
        source_tool: 'quote-scanner',
      });

    } catch (error) {
      console.error('[ScannerModal] Contact submit error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Project details + file upload
  const handleProjectSubmit = async (data: {
    phone: string;
    windowCount: string;
    quotePrice: string;
    wantsBeatQuote: boolean;
    file: File;
  }) => {
    setIsSubmitting(true);

    try {
      // Update session with project details
      updateField('phone', data.phone);
      if (data.windowCount) {
        updateField('windowCount', parseInt(data.windowCount, 10));
      }

      // Update lead with phone if we have a leadId
      const leadId = sessionData.leadId;
      if (leadId && data.phone) {
        // Update lead via CRM function
        await invokeEdgeFunction('crm-leads', {
          body: {
            leadId,
            updates: {
              phone: data.phone,
            },
          },
        });

        // Track project details event
        trackEvent('scanner_project_details', {
          source_tool: 'quote-scanner',
          window_count: data.windowCount || undefined,
          quote_price: data.quotePrice || undefined,
          wants_beat_quote: data.wantsBeatQuote,
        });
      }

      // Store project data and initiate OTP verification
      setPendingProjectData(data);
      setOtpPhone(data.phone);

      // Send OTP via Twilio Verify
      const { data: otpResult, error: otpError } = await invokeEdgeFunction('initiate-lead-verification', {
        body: { phone: data.phone },
      });

      if (otpError || !otpResult?.success) {
        const errMsg = otpResult?.error || 'Failed to send verification code. Please try again.';
        toast.error(errMsg);
        setIsSubmitting(false);
        return;
      }

      // Move to OTP step
      setStep('otp');

      trackEvent('scanner_otp_sent', {
        source_tool: 'quote-scanner',
      });

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

      trackEvent('scanner_otp_verified', {
        source_tool: 'quote-scanner',
      });

      // Move to analysis step and trigger file analysis
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
      body: { phone: otpPhone },
    });
    if (error) {
      toast.error('Failed to resend code. Please try again.');
    }
  }, [otpPhone]);

  // Step 3: Analysis complete
  const handleAnalysisComplete = useCallback(() => {
    onAnalysisComplete();
    onClose();
  }, [onAnalysisComplete, onClose]);

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
            onSubmit={handleProjectSubmit}
            isLoading={isSubmitting}
          />
        )}

        {step === 'otp' && (
          <OtpGate
            phone={otpPhone}
            onVerify={handleOtpVerify}
            onResend={handleOtpResend}
            isVerifying={isVerifying}
            error={otpError}
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
