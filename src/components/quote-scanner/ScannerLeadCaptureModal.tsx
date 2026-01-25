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

/**
 * State Machine for Scanner Modal
 * - contact: Step 1 - collecting name/email
 * - project: Step 2 - collecting phone/project details + file upload
 * - analyzing: Step 3 - theatrics running, waiting for both animation AND AI to complete
 * - complete: Ready to close (both theatrics done AND isAnalyzing false)
 * - error: Something went wrong
 */
type ModalStatus = 'contact' | 'project' | 'analyzing' | 'complete' | 'error';

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
 * 
 * Uses State Machine pattern - single `status` instead of multiple booleans
 * Modal only closes when BOTH theatrics complete AND isAnalyzing is false
 */
export function ScannerLeadCaptureModal({
  isOpen,
  onClose,
  onAnalysisComplete,
  onFileSelect,
  isAnalyzing,
  sessionData: initialSessionData,
}: ScannerLeadCaptureModalProps) {
  // State Machine: single source of truth for modal status
  const [status, setStatus] = useState<ModalStatus>('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanAttemptId, setScanAttemptId] = useState<string | null>(null);
  const [theatricsComplete, setTheatricsComplete] = useState(false);
  const [contactData, setContactData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  const { sessionData, updateField } = useSessionData();
  const { setLeadId } = useLeadIdentity();
  const { awardScore } = useScore();

  // Track modal opened and handle auto-skip logic
  useEffect(() => {
    if (!isOpen) return;

    const hasCompleteContact = 
      initialSessionData?.firstName?.trim() && 
      initialSessionData?.lastName?.trim() && 
      initialSessionData?.email?.trim();
    
    const startingStep = hasCompleteContact ? 'project' : 'contact';

    // Fire scanner_modal_opened event on every open
    const eventId = generateEventId();
    trackEvent('scanner_modal_opened', {
      source_tool: 'quote-scanner',
      event_id: eventId,
      step: startingStep,
      timestamp: new Date().toISOString(),
    });
    console.log('[ScannerModal] scanner_modal_opened fired, step:', startingStep);
    
    if (hasCompleteContact) {
      // Pre-fill contact data and skip to Step 2
      setContactData({
        firstName: initialSessionData.firstName!,
        lastName: initialSessionData.lastName!,
        email: initialSessionData.email!,
      });
      setStatus('project');
    } else {
      // Always start fresh at Step 1 if contact is incomplete
      setStatus('contact');
      setContactData(null);
    }
  }, [isOpen, initialSessionData]);

  // DUAL-CONDITION CLOSE: Only complete when BOTH theatrics done AND analysis finished
  useEffect(() => {
    if (status === 'analyzing' && theatricsComplete && !isAnalyzing) {
      console.log('[ScannerModal] Both conditions met - completing modal');
      setStatus('complete');
      onAnalysisComplete();
      onClose();
    }
  }, [status, theatricsComplete, isAnalyzing, onAnalysisComplete, onClose]);

  // Complete state reset when modal closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      // Immediate reset for clean state on next open
      setStatus('contact');
      setContactData(null);
      setIsSubmitting(false);
      setScanAttemptId(null);
      setTheatricsComplete(false);
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

        // Track lead capture - lead_submission_success ($100 value)
        await trackLeadSubmissionSuccess({
          leadId,
          email: data.email,
          firstName,
          lastName,
          sourceTool: 'quote-scanner',
          eventId: `lead_captured:${leadId}`,
          value: 100,
        });
        console.log('[ScannerModal] lead_submission_success fired, leadId:', leadId);

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
      setStatus('project');

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

        // Track project details with phone hash - scanner_project_details
        const phoneHash = phoneE164 ? await hashPhone(phoneE164) : undefined;
        trackEvent('scanner_project_details', {
          source_tool: 'quote-scanner',
          window_count: data.windowCount || undefined,
          quote_price: data.quotePrice || undefined,
          wants_beat_quote: data.wantsBeatQuote,
          phone_sha256: phoneHash,
        });
        console.log('[ScannerModal] scanner_project_details fired');
      }

      // Generate unique scanAttemptId for this upload
      const newScanAttemptId = crypto.randomUUID();
      setScanAttemptId(newScanAttemptId);

      // Move to analysis step - theatrics will run, then we wait for both conditions
      setStatus('analyzing');
      setTheatricsComplete(false);

      // Trigger actual file analysis
      await onFileSelect(data.file);

    } catch (error) {
      console.error('[ScannerModal] Project submit error:', error);
      toast.error('Upload failed. Please try again.');
      setStatus('error');
      // Allow retry by going back to project step
      setTimeout(() => setStatus('project'), 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Theatrics finished (called by presentation-only ScannerStep3Analysis)
  const handleTheatricsComplete = useCallback(() => {
    console.log('[ScannerModal] Theatrics animation complete');
    setTheatricsComplete(true);
    // The useEffect watching both conditions will handle the actual close
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <TrustModal className="sm:max-w-md">
        {status === 'contact' && (
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

        {status === 'project' && (
          <ScannerStep2Project
            onSubmit={handleProjectSubmit}
            isLoading={isSubmitting}
          />
        )}

        {status === 'analyzing' && (
          <ScannerStep3Analysis
            onComplete={handleTheatricsComplete}
          />
        )}
      </TrustModal>
    </Dialog>
  );
}
