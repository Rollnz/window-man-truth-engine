import { useState, useEffect } from 'react';
import { Phone, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useSessionData } from '@/hooks/useSessionData';
import { useEngagementScore } from '@/hooks/useEngagementScore';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent, trackLeadCapture } from '@/lib/gtm';
import type { SourceTool } from '@/types/sourceTool';

// phonecall.bot number
const PHONECALL_BOT_NUMBER = '+15614685571';

export interface EstimateFormData {
  // Step 1: Project Details
  windowCount: number | null;
  projectType: string;
  timeline: string;
  // Step 2: Contact Details
  name: string;
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
  name: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: 'FL', // Default to Florida
  zip: '',
};

type Step = 'choice' | 'project' | 'contact' | 'address' | 'success';

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
 */
export function EstimateSlidePanel({ onClose }: EstimateSlidePanelProps) {
  const [step, setStep] = useState<Step>('choice');
  const [formData, setFormData] = useState<EstimateFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { leadId, setLeadId } = useLeadIdentity();
  const { sessionData, sessionId, updateFields } = useSessionData();
  const { score: engagementScore } = useEngagementScore();

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

  // Track panel open
  useEffect(() => {
    trackEvent('floating_cta_opened', {
      engagement_score: engagementScore,
      lead_id: leadId,
    });
  }, []);

  const handleCallClick = () => {
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
        name: formData.name.trim(),
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

      // Track the successful submission
      trackLeadCapture({
        sourceTool: 'floating-estimate-form' as SourceTool,
        email: formData.email,
        leadScore: engagementScore,
        hasPhone: !!formData.phone,
        leadId: data?.leadId,
      });

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
    if (step === 'choice' || step === 'success') return null;
    
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
          {step === 'project' && 'Project Details'}
          {step === 'contact' && 'Contact Information'}
          {step === 'address' && 'Property Address'}
          {step === 'success' && 'Request Submitted!'}
        </SheetTitle>
        
        <SheetDescription className="text-muted-foreground">
          {step === 'choice' && 'Choose how you\'d like to connect with us.'}
          {step === 'project' && 'Tell us about your window project.'}
          {step === 'contact' && 'How can we reach you?'}
          {step === 'address' && 'Where is the property located?'}
          {step === 'success' && 'We\'ll be in touch shortly.'}
        </SheetDescription>
      </SheetHeader>

      {renderStepIndicator()}

      {/* Choice Screen */}
      {step === 'choice' && (
        <div className="space-y-6">
          {/* Call Option - Prominent */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  Call for Instant Estimate
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Speak with our AI assistant now. Get answers in minutes, not days.
                </p>
                <Button 
                  onClick={handleCallClick}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          {/* Form Option */}
          <div className="bg-secondary/30 border border-border rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-secondary">
                <FileText className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  Request an Estimate
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Fill out a quick form and we'll get back to you within 24 hours.
                </p>
                <Button 
                  onClick={() => setStep('project')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Start Request
                </Button>
              </div>
            </div>
          </div>

          {/* Trust indicator */}
          <p className="text-center text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 inline mr-1" />
            No spam. No pressure. Your data stays private.
          </p>
        </div>
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
}
