import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { SessionData, useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useFormAbandonment } from '@/hooks/useFormAbandonment';
import { useCanonicalScore, getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { Mail, Check, Loader2 } from 'lucide-react';
import { trackEvent, trackModalOpen, trackLeadSubmissionSuccess, trackFormStart, trackLeadCapture, generateEventId } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getLeadAnchor } from '@/lib/leadAnchor';
import { getAttributionData, buildAIContextFromSession } from '@/lib/attribution';
import { getLeadQuality } from '@/lib/leadQuality';
import { SourceTool } from '@/types/sourceTool';
import { TrustModal } from '@/components/forms/TrustModal';
import { NameInputPair, normalizeNameFields } from '@/components/ui/NameInputPair';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leadId: string) => void;
  sourceTool: SourceTool;
  sessionData: SessionData;
  chatHistory?: Message[];
  leadId?: string; // Existing lead ID for identity persistence (Golden Thread)
}

export function LeadCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  sourceTool,
  sessionData,
  chatHistory,
  leadId,
}: LeadCaptureModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalOpenTime, setModalOpenTime] = useState<number>(0);

  // Golden Thread: Use hook as fallback if leadId prop not provided
  const { leadId: hookLeadId, setLeadId } = useLeadIdentity();
  const { updateFields } = useSessionData();
  const { awardScore } = useCanonicalScore();
  const effectiveLeadId = leadId || hookLeadId;

  // Form abandonment tracking (Phase 7)
  const { trackFieldEntry, resetTracking } = useFormAbandonment({
    formId: 'lead_capture',
    sourceTool,
    isSubmitted: isSuccess,
  });

  const requiresFullContact = sourceTool === 'quote-scanner';

  // Unified form state - single source of truth for all fields
  const { values, hasError, getError, getFieldProps, validateAll, setValue } = useFormValidation({
    initialValues: { 
      email: sessionData.email || '',
      firstName: sessionData.firstName || '',
      lastName: sessionData.lastName || '',
      phone: sessionData.phone || '',
    },
    schemas: { 
      email: commonSchemas.email,
      firstName: requiresFullContact ? commonSchemas.firstName : commonSchemas.firstName.optional(),
      lastName: commonSchemas.lastName,
      phone: requiresFullContact ? commonSchemas.phone : commonSchemas.phone.optional(),
    },
  });

  // Strict validation for UX - button only enables when form will actually pass validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasValidEmail = values.email.trim() && emailRegex.test(values.email);
  const hasValidPhone = !requiresFullContact || (values.phone.replace(/\D/g, '').length === 10);
  const isFormValid = hasValidEmail && (!requiresFullContact || (values.firstName.trim() && hasValidPhone));

  // Track modal open - fires ONLY when modal opens, not on form changes
  useEffect(() => {
    if (isOpen) {
      const now = Date.now();
      setModalOpenTime(now);

      trackModalOpen({ modalName: 'lead_capture', sourceTool });
      
      // Enriched dataLayer push for funnel reconstruction
      const externalId = effectiveLeadId || getLeadAnchor() || null;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'lead_capture_modal_opened',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: externalId,
        source_tool: sourceTool,
        source_system: 'web',
        modal_name: 'lead_capture',
      });
    }
  }, [isOpen, sourceTool, effectiveLeadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast({
        title: 'Invalid Email',
        description: getError('email') || 'Please check your email',
        variant: 'destructive',
      });
      return;
    }

    // For quote-scanner, require name and phone (already checked via isFormValid)
    if (requiresFullContact && !isFormValid) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Normalize name fields - single source of truth from validation hook
    const normalizedNames = normalizeNameFields(values.firstName, values.lastName);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            email: values.email.trim(),
            firstName: normalizedNames.firstName || null,
            lastName: normalizedNames.lastName || null,
            phone: values.phone.trim() || sessionData.phone || null,
            sourceTool,
            sessionData: {
              ...(sessionData || {}),
              clientId: getOrCreateAnonId(),
            },
            chatHistory: chatHistory || [],
            attribution: getAttributionData(),
            aiContext: buildAIContextFromSession(sessionData, sourceTool),
            // Golden Thread: Pass existing leadId for identity persistence
            leadId: effectiveLeadId || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }

      const data = await response.json();

      if (data.success && data.leadId) {
        setIsSuccess(true);

        // Golden Thread: Persist leadId for future interactions
        setLeadId(data.leadId);
        updateFields({ leadId: data.leadId });
        
        // TRUTH ENGINE v2: Award canonical score for lead capture
        await awardScore({
          eventType: 'LEAD_CAPTURED',
          sourceEntityType: 'lead',
          sourceEntityId: data.leadId,
        });
        
        // Enriched dataLayer push for lead capture completion
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'lead_capture_form_completed',
          event_id: generateEventId(),
          client_id: getOrCreateClientId(),
          session_id: getOrCreateSessionId(),
          external_id: data.leadId,
          source_tool: sourceTool,
          source_system: 'web',
          form_name: 'lead_capture',
          user_data: {
            first_name: normalizedNames.firstName,
            last_name: normalizedNames.lastName || undefined,
          },
        });

        // Track successful lead capture with full metadata (Phase 4)
        await trackLeadCapture(
          {
            leadId: data.leadId,
            sourceTool: sourceTool.replace(/-/g, '_') as any,
            conversionAction: 'form_submit',
          },
          values.email.trim(),
          values.phone.trim() || undefined,
          {
            hasName: !!normalizedNames.firstName,
            hasPhone: !!values.phone.trim(),
            hasProjectDetails: !!sessionData.windowCount,
          }
        );

        // Push Enhanced Conversion event to dataLayer with SHA-256 PII hashing (value: 100 USD)
        await trackLeadSubmissionSuccess({
          leadId: data.leadId,
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          firstName: normalizedNames.firstName,
          lastName: normalizedNames.lastName || undefined,
          // Location data from sessionData if available
          city: sessionData.city || undefined,
          state: sessionData.state || undefined,
          zipCode: sessionData.zipCode || undefined,
          sourceTool,
          eventId: `lead_captured:${data.leadId}`,
          value: 100,
        });

        toast({
          title: 'Conversation Saved!',
          description: 'Check your inbox for a summary.',
        });

        setTimeout(() => {
          onSuccess(data.leadId);
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Lead capture error:', error);
      toast({
        title: 'Unable to save',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Track modal abandonment if not successful
      if (!isSuccess && modalOpenTime > 0) {
        const timeSpent = Math.round((Date.now() - modalOpenTime) / 1000); // seconds
        trackEvent('modal_abandon', {
          modal_type: 'lead_capture',
          source_tool: sourceTool,
          time_spent_seconds: timeSpent,
        });
      }

      setIsSuccess(false);
      resetTracking(); // Reset abandonment tracking
      onClose();
    }
  };

  // Track form start on first field focus
  const handleFirstFieldFocus = () => {
    trackFormStart({ formName: 'lead_capture', sourceTool });
  };

  // Dynamic content based on source tool
  const isComparisonTool = sourceTool === 'comparison-tool';
  const isRiskDiagnostic = sourceTool === 'risk-diagnostic';
  const isFastWin = sourceTool === 'fast-win';
  const isVulnerabilityTest = sourceTool === 'vulnerability-test';
  const isEvidenceLocker = sourceTool === 'evidence-locker';
  const isIntelLibrary = sourceTool === 'intel-library';
  const isClaimSurvivalKit = sourceTool === 'claim-survival-kit';
  const isQuoteScanner = sourceTool === 'quote-scanner';
  
  let modalTitle = 'Save Your Conversation';
  let modalDescription = 'Enter your email to save your conversation and get personalized recommendations.';
  let buttonText = 'Save My Conversation';
  let successTitle = 'Saved Successfully!';
  let successDescription = 'We\'ve saved your conversation and session data.';

  if (isQuoteScanner) {
    modalTitle = 'Unlock Your Quote Analysis';
    modalDescription = 'Get your complete 5-point breakdown plus AI-generated negotiation scripts to save thousands.';
    buttonText = 'Unlock My Report';
    successTitle = 'Report Unlocked!';
    successDescription = 'Your full analysis is now available.';
  } else if (isComparisonTool) {
    modalTitle = 'Email Me This Comparison';
    modalDescription = 'Enter your email to receive a personalized comparison report with your 10-year cost analysis.';
    buttonText = 'Send My Report';
    successTitle = 'Report Sent!';
    successDescription = 'Check your inbox for your personalized comparison report.';
  } else if (isRiskDiagnostic) {
    modalTitle = 'Email My Protection Plan';
    modalDescription = 'Get your complete protection gap analysis with personalized recommendations and insurance savings.';
    buttonText = 'Send My Plan';
    successTitle = 'Plan Sent!';
    successDescription = 'Check your inbox for your protection gap analysis.';
  } else if (isFastWin) {
    modalTitle = 'Save Your Fast Win';
    modalDescription = 'Get your #1 upgrade recommendation emailed to you for future reference.';
    buttonText = 'Email My Fast Win';
    successTitle = 'Fast Win Saved!';
    successDescription = 'Check your inbox for your personalized upgrade recommendation.';
  } else if (isEvidenceLocker) {
    modalTitle = 'Download Case Study';
    modalDescription = 'Enter your email to receive this case study as a PDF.';
    buttonText = 'Send Case Study';
    successTitle = 'Case Study Sent!';
    successDescription = 'Check your inbox for your PDF.';
  } else if (isVulnerabilityTest) {
    modalTitle = 'Get the Full Answer Key';
    modalDescription = 'Unlock detailed explanations for all 5 questions plus bonus protection strategies.';
    buttonText = 'Send Answer Key';
    successTitle = 'Answer Key Sent!';
    successDescription = 'Check your inbox for your complete Window IQ breakdown.';
  } else if (isIntelLibrary) {
    modalTitle = 'Declassify This Document';
    modalDescription = 'Enter your email to unlock this file and save it to your vault.';
    buttonText = 'Unlock & Download';
    successTitle = 'Document Declassified!';
    successDescription = 'Your download is ready. A backup copy has been sent to your email.';
  } else if (isClaimSurvivalKit) {
    modalTitle = "Don't Lose Your Progress";
    modalDescription = "You've already started documenting. Enter your email to secure your vault and continue from any device.";
    buttonText = 'Create My Vault';
    successTitle = 'Vault Created!';
    successDescription = 'Your progress is now saved. Uploading your document...';
  }

  const emailProps = getFieldProps('email');
  const emailHasError = hasError('email');
  const emailError = getError('email');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <TrustModal 
        className="sm:max-w-md"
        modalTitle={isSuccess ? undefined : modalTitle}
        modalDescription={isSuccess ? undefined : modalDescription}
        headerAlign="center"
      >
        {/* Mail icon above title */}
        {!isSuccess && (
          <div className="flex justify-center mb-2 -mt-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
          </div>
        )}
        
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-900">{successTitle}</h2>
            <p className="text-slate-600">{successDescription}</p>
          </div>
        ) : (
          <>
            {/* TrustModal auto-wraps children with FormSurfaceProvider surface="trust" */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {requiresFullContact && (
                <NameInputPair
                  firstName={values.firstName}
                  lastName={values.lastName}
                  onFirstNameChange={(v) => setValue('firstName', v)}
                  onLastNameChange={(v) => setValue('lastName', v)}
                  errors={{ firstName: hasError('firstName') ? getError('firstName') : undefined }}
                  disabled={isLoading}
                  autoFocus
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className={`font-semibold text-slate-900 ${emailHasError ? 'text-destructive' : ''}`}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...emailProps}
                  disabled={isLoading}
                  autoFocus={!requiresFullContact}
                  onFocus={handleFirstFieldFocus}
                  onBlur={() => {
                    if (values.email) trackFieldEntry('email');
                  }}
                  className={emailHasError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={emailHasError}
                  aria-describedby={emailHasError ? 'email-error' : undefined}
                />
                {emailHasError && (
                  <p id="email-error" className="text-sm text-destructive">{emailError}</p>
                )}
              </div>

              {requiresFullContact && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold text-slate-900">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(555) 123-4567"
                    value={values.phone}
                    onBlur={() => values.phone && trackFieldEntry('phone')}
                    onChange={(e) => setValue('phone', formatPhoneNumber(e.target.value))}
                    disabled={isLoading}
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="cta"
                className="w-full"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {buttonText}
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </TrustModal>
    </Dialog>
  );
}
