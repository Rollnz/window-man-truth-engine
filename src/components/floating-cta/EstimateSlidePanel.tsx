import * as React from 'react';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ProjectDetailsStep } from './steps/ProjectDetailsStep';
import { ContactDetailsStep } from './steps/ContactDetailsStep';
import { AddressDetailsStep } from './steps/AddressDetailsStep';
import { SuccessStep } from './steps/SuccessStep';
import { AiQaStep } from './steps/AiQaStep';
import { ChoiceStepDispatcher } from './steps/choice-variants';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useSessionData } from '@/hooks/useSessionData';
import { useEngagementScore } from '@/hooks/useEngagementScore';
import { usePanelVariant } from '@/hooks/usePanelVariant';
import { useLocationPersonalization } from '@/hooks/useLocationPersonalization';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent, trackLeadCapture, generateEventId } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getLeadAnchor } from '@/lib/leadAnchor';
import type { AiQaMode } from '@/lib/panelVariants';
import type { SourceTool } from '@/types/sourceTool';

// phonecall.bot number
const PHONECALL_BOT_NUMBER = '+15614685571';

export interface EstimateFormData {
  // Step 1: Project Details
  windowCount: number | null;
  projectType: string;
  timeline: string;
  // Step 2: Contact Details (firstName/lastName for Meta EMQ)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Step 3: Address Details
  street: string;
  city: string;
  state: string;
  zip: string;
}

const initialFormData: EstimateFormData = {
  windowCount: null,
  projectType: '',
  timeline: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: 'FL', // Default to Florida
  zip: '',
};

type Step = 'choice' | 'ai-qa' | 'project' | 'contact' | 'address' | 'success';

interface EstimateSlidePanelProps {
  onClose: () => void;
}

/**
 * EstimateSlidePanel
 * 
 * The main slide-in panel that contains:
 * 1. Initial choice screen (Call Now vs. Request Estimate)
 * 2. 3-step wizard form (Project -> Contact -> Address)
 * 3. Success confirmation
 * 
 * Integrates with the Golden Thread (useLeadIdentity) for lead tracking.
 * 
 * NOTE: Wrapped with forwardRef to satisfy Radix Dialog's ref requirements.
 */
export const EstimateSlidePanel = React.forwardRef<HTMLDivElement, EstimateSlidePanelProps>(
  function EstimateSlidePanel({ onClose }, ref) {
  const [step, setStep] = useState<Step>('choice');
  const [formData, setFormData] = useState<EstimateFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiQaMode, setAiQaMode] = useState<AiQaMode>('concierge');
  const [aiQaInitialMessage, setAiQaInitialMessage] = useState<string | undefined>();

  const { leadId, setLeadId } = useLeadIdentity();
  const { sessionData, sessionId, updateFields } = useSessionData();
  const { score: engagementScore } = useEngagementScore();
  const { variant: panelVariant } = usePanelVariant();
  const { locationData, isLoading: locationLoading, resolveZip } = useLocationPersonalization();

  // Persist step in sessionStorage so user doesn't lose progress
  useEffect(() => {
    const savedStep = sessionStorage.getItem('estimate_panel_step');
    const savedData = sessionStorage.getItem('estimate_panel_data');
    
    if (savedStep && savedStep !== 'success') {
      setStep(savedStep as Step);
    }
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save progress to sessionStorage
  useEffect(() => {
    if (step !== 'choice') {
      sessionStorage.setItem('estimate_panel_step', step);
      sessionStorage.setItem('estimate_panel_data', JSON.stringify(formData));
    }
  }, [step, formData]);

  // Clear session storage on success
  useEffect(() => {
    if (step === 'success') {
      sessionStorage.removeItem('estimate_panel_step');
      sessionStorage.removeItem('estimate_panel_data');
    }
  }, [step]);

  // Track slide-over OPEN (navigation event, NOT lead intent)
  useEffect(() => {
    trackEvent('floating_cta_opened', {
      engagement_score: engagementScore,
      lead_id: leadId,
    });
    
    // Resolve external_id: hook leadId > lead anchor > null
    const externalId = leadId || getLeadAnchor() || null;
    
    // Structured GTM dataLayer event for SLIDE-OVER open (decoupled from form intent)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'slide_over_opened',
      event_id: generateEventId(),
      client_id: getOrCreateClientId(),
      session_id: getOrCreateSessionId(),
      external_id: externalId,
      source_tool: 'floating_slide_over',
      source_system: 'web',
      trigger_source: 'floating_cta',
      panel_variant: panelVariant,
    });
  }, []);

  // Helper to fire lead_form_opened ONLY on explicit form/call intent
  const fireLeadFormOpened = (intentType: 'form_start' | 'call_intent') => {
    const externalId = leadId || getLeadAnchor() || null;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'lead_form_opened',
      event_id: generateEventId(),
      client_id: getOrCreateClientId(),
      session_id: getOrCreateSessionId(),
      external_id: externalId,
      source_tool: 'floating_slide_over',
      source_system: 'web',
      form_name: 'floating_slide_over',
      trigger_source: intentType,
    });
  };

  const handleCallClick = () => {
    // Fire lead_form_opened on call intent (high-value action)
    fireLeadFormOpened('call_intent');
    
    // Track the call initiation event
    trackEvent('call_initiated', {
      source: 'floating_estimate_panel',
      engagement_score: engagementScore,
      lead_id: leadId,
    });

    // Initiate the phone call
    window.location.href = `tel:${PHONECALL_BOT_NUMBER}`;
  };

  const updateFormData = (updates: Partial<EstimateFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Build the payload for save-lead
      const payload = {
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        leadId: leadId || undefined,
        sessionId: sessionId,
        sourceTool: 'floating-estimate-form' as SourceTool,
        sessionData: {
          ...sessionData,
          projectDetails: {
            windowCount: formData.windowCount,
            projectType: formData.projectType,
            timeline: formData.timeline,
          },
          addressDetails: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
          engagementScore,
        },
        aiContext: {
          source_form: 'floating-estimate-panel',
          window_count: formData.windowCount,
          urgency_level: formData.timeline === 'asap' ? 'high' : 
                         formData.timeline === '1-3-months' ? 'medium' : 'low',
        },
      };

      // Call the save-lead edge function
      const { data, error: saveError } = await supabase.functions.invoke('save-lead', {
        body: payload,
      });

      if (saveError) {
        throw new Error(saveError.message || 'Failed to save lead');
      }

      // Update the Golden Thread with the returned leadId
      if (data?.leadId) {
        setLeadId(data.leadId);
        updateFields({ leadId: data.leadId });
      }

      // Track the successful submission with full metadata (Phase 4)
      await trackLeadCapture(
        {
          leadId: data?.leadId,
          sourceTool: 'floating_cta',
          conversionAction: 'form_submit',
        },
        formData.email,
        formData.phone || undefined,
        {
          hasName: !!formData.firstName,
          hasAddress: !!(formData.street && formData.city && formData.zip),
          hasProjectDetails: !!(formData.windowCount && formData.projectType),
        }
      );

      trackEvent('estimate_form_submitted', {
        source: 'floating_estimate_panel',
        engagement_score: engagementScore,
        lead_id: data?.leadId,
        window_count: formData.windowCount,
        project_type: formData.projectType,
        timeline: formData.timeline,
        has_address: !!(formData.street && formData.city && formData.zip),
      });

      // Move to success step
      setStep('success');
    } catch (err) {
      console.error('Failed to submit estimate form:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    switch (step) {
      case 'ai-qa':
        setStep('choice');
        break;
      case 'project':
        setStep('choice');
        break;
      case 'contact':
        setStep('project');
        break;
      case 'address':
        setStep('contact');
        break;
      default:
        break;
    }
  };

  const renderStepIndicator = () => {
    if (step === 'choice' || step === 'ai-qa' || step === 'success') return null;
    
    const steps = ['project', 'contact', 'address'];
    const currentIndex = steps.indexOf(step);
    
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              i <= currentIndex 
                ? 'w-8 bg-primary' 
                : 'w-2 bg-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <SheetContent 
      side="right" 
      className="w-full sm:max-w-md border-l-2 border-primary/20 bg-background overflow-y-auto pb-8"
    >
      <SheetHeader className="mb-6">
        {step !== 'choice' && step !== 'success' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="absolute left-4 top-4 p-2 h-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}

        <SheetTitle className="text-2xl font-bold text-foreground">
          {step === 'choice' && 'Get Your Free Estimate'}
          {step === 'ai-qa' && 'Ask Window Man'}
          {step === 'project' && 'Project Details'}
          {step === 'contact' && 'Contact Information'}
          {step === 'address' && 'Property Address'}
          {step === 'success' && 'Request Submitted!'}
        </SheetTitle>

        <SheetDescription className="text-muted-foreground">
          {step === 'choice' && 'Choose how you\'d like to connect with us.'}
          {step === 'ai-qa' && 'Get instant answers about impact windows.'}
          {step === 'project' && 'Tell us about your window project.'}
          {step === 'contact' && 'How can we reach you?'}
          {step === 'address' && 'Where is the property located?'}
          {step === 'success' && 'We\'ll be in touch shortly.'}
        </SheetDescription>
      </SheetHeader>

      {renderStepIndicator()}

      {/* Choice Screen — A/B variant dispatcher */}
      {step === 'choice' && (
        <ChoiceStepDispatcher
          variant={panelVariant}
          onCallClick={handleCallClick}
          onStartForm={() => {
            fireLeadFormOpened('form_start');
            setStep('project');
          }}
          onStartAiQa={(mode: AiQaMode, initialMsg?: string) => {
            setAiQaMode(mode);
            setAiQaInitialMessage(initialMsg);
            setStep('ai-qa');
          }}
          locationData={locationData}
          locationLoading={locationLoading}
          onResolveZip={resolveZip}
          engagementScore={engagementScore}
        />
      )}

      {/* AI Q&A Mini-Flow */}
      {step === 'ai-qa' && (
        <AiQaStep
          mode={aiQaMode}
          initialMessage={aiQaInitialMessage}
          locationData={locationData}
          sessionData={sessionData}
          formData={formData}
          updateFormData={updateFormData}
          onRouteToForm={() => {
            fireLeadFormOpened('form_start');
            setStep('project');
          }}
          onRouteToCall={handleCallClick}
          panelVariant={panelVariant}
        />
      )}

      {/* Step 1: Project Details */}
      {step === 'project' && (
        <ProjectDetailsStep
          formData={formData}
          updateFormData={updateFormData}
          onNext={() => setStep('contact')}
        />
      )}

      {/* Step 2: Contact Details */}
      {step === 'contact' && (
        <ContactDetailsStep
          formData={formData}
          updateFormData={updateFormData}
          onNext={() => setStep('address')}
        />
      )}

      {/* Step 3: Address Details */}
      {step === 'address' && (
        <AddressDetailsStep
          formData={formData}
          updateFormData={updateFormData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}

      {/* Success */}
      {step === 'success' && (
        <SuccessStep 
          formData={formData} 
          onClose={onClose}
          onCallNow={handleCallClick}
        />
      )}
    </SheetContent>
  );
});

EstimateSlidePanel.displayName = 'EstimateSlidePanel';
