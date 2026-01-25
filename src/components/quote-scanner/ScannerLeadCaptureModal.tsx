import { useState, useCallback, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { TrustModal } from '@/components/forms/TrustModal';
import { ScannerStep1Contact } from './steps/ScannerStep1Contact';
import { ScannerStep2Project } from './steps/ScannerStep2Project';
import { ScannerStep3Analysis } from './steps/ScannerStep3Analysis';
import { supabase } from '@/integrations/supabase/client';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useScore } from '@/contexts/ScoreContext';
import { trackLeadSubmissionSuccess, trackEvent, generateEventId, hashPhone } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getAttributionData } from '@/lib/attribution';
import { normalizeToE164 } from '@/lib/phoneFormat';
import { normalizeNameFields } from '@/components/ui/NameInputPair';
import { toast } from 'sonner';
import type { SourceTool } from '@/types/sourceTool';

type ModalStep = 'contact' | 'project' | 'analysis';

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

  const { sessionData, updateField } = useSessionData();
  const { setLeadId } = useLeadIdentity();
  const { awardScore } = useScore();

  // Auto-skip to Step 2 ONLY if ALL contact fields are present
  useEffect(() => {
    if (!isOpen) return;
    
    const hasCompleteContact = 
      initialSessionData?.firstName?.trim() && 
      initialSessionData?.lastName?.trim() && 
      initialSessionData?.email?.trim();
    
    if (hasCompleteContact) {
      // Pre-fill contact data and skip to Step 2
      setContactData({
        firstName: initialSessionData.firstName!,
        lastName: initialSessionData.lastName!,
        email: initialSessionData.email!,
      });
      setStep('project');
    } else {
      // Always start fresh at Step 1 if contact is incomplete
      setStep('contact');
      setContactData(null);
    }
  }, [isOpen, initialSessionData]);

  // Complete state reset when modal closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      // Immediate reset for clean state on next open
      setStep('contact');
      setContactData(null);
      setIsSubmitting(false);
      onClose();
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

      // Generate deterministic event ID
      const eventId = generateEventId();

      // Save lead via edge function
      const { data: result, error } = await supabase.functions.invoke('save-lead', {
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

        // Track lead capture
        trackLeadSubmissionSuccess({
          leadId,
          email: data.email,
          firstName,
          lastName,
          sourceTool: 'quote-scanner',
          eventId: `lead_captured:${leadId}`,
          value: 100,
        });

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
        event_id: eventId,
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

      // Update lead with phone via save-lead (not crm-leads)
      // This ensures we hit the correct leads table primary key
      const leadId = sessionData.leadId;
      if (contactData && data.phone) {
        const phoneE164 = normalizeToE164(data.phone);
        const clientId = getOrCreateClientId();
        const sessionId = getOrCreateSessionId();
        
        // Use save-lead to update phone - it handles the Golden Thread correctly
        await supabase.functions.invoke('save-lead', {
          body: {
            email: contactData.email,
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            phone: data.phone,
            sourceTool: 'quote-scanner' satisfies SourceTool,
            leadId, // Pass existing leadId for update
            sessionData: {
              clientId,
              sessionId,
              windowCount: data.windowCount ? parseInt(data.windowCount, 10) : undefined,
            },
          },
        });

        // Track project details with phone hash
        const phoneHash = phoneE164 ? await hashPhone(phoneE164) : undefined;
        trackEvent('scanner_project_details', {
          source_tool: 'quote-scanner',
          window_count: data.windowCount || undefined,
          quote_price: data.quotePrice || undefined,
          wants_beat_quote: data.wantsBeatQuote,
          phone_sha256: phoneHash,
        });
      }

      // Move to analysis step
      setStep('analysis');

      // Trigger actual file analysis
      await onFileSelect(data.file);

    } catch (error) {
      console.error('[ScannerModal] Project submit error:', error);
      toast.error('Upload failed. Please try again.');
      setStep('project');
    } finally {
      setIsSubmitting(false);
    }
  };

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
