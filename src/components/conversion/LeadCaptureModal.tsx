import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { SessionData } from '@/hooks/useSessionData';
import { Mail, Check, Loader2 } from 'lucide-react';
import { trackEvent, trackModalOpen } from '@/lib/gtm';
import { getAttributionData, buildAIContextFromSession } from '@/lib/attribution';
import { SourceTool } from '@/types/sourceTool';

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
  const [name, setName] = useState(sessionData.name || '');
  const [phone, setPhone] = useState(sessionData.phone || '');
  const [modalOpenTime, setModalOpenTime] = useState<number>(0);

  const requiresFullContact = sourceTool === 'quote-scanner';

  const { values, hasError, getError, getFieldProps, validateAll } = useFormValidation({
    initialValues: { email: sessionData.email || '' },
    schemas: { email: commonSchemas.email },
  });

  // Track modal open - fires ONLY when modal opens, not on form changes
  useEffect(() => {
    if (isOpen) {
      const now = Date.now();
      setModalOpenTime(now);

      trackModalOpen('lead_capture', { source_tool: sourceTool });
    }
  }, [isOpen, sourceTool]); // ONLY these dependencies - NO form values!

  // Update email when sessionData changes
  useEffect(() => {
    if (sessionData.email) {
      // Re-initialize with new sessionData
    }
  }, [sessionData.email]);

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

    // For quote-scanner, require name and phone
    if (requiresFullContact && (!name.trim() || !phone.trim())) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name and phone number.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

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
            name: name.trim() || sessionData.name || null,
            phone: phone.trim() || sessionData.phone || null,
            sourceTool,
            sessionData,
            chatHistory: chatHistory || [],
            attribution: getAttributionData(),
            aiContext: buildAIContextFromSession(sessionData, sourceTool),
            leadId: leadId || undefined, // Pass existing leadId for updates
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

        // Track successful lead capture
        trackEvent('lead_captured', {
          modal_type: 'lead_capture',
          source_tool: sourceTool,
          lead_id: data.leadId,
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
      onClose();
    }
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
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl mb-2">{successTitle}</DialogTitle>
            <DialogDescription>
              {successDescription}
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
              </div>
              <DialogTitle className="text-center">{modalTitle}</DialogTitle>
              <DialogDescription className="text-center">
                {modalDescription}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {requiresFullContact && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className={emailHasError ? 'text-destructive' : ''}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...emailProps}
                  disabled={isLoading}
                  autoFocus={!requiresFullContact}
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !values.email.trim() || (requiresFullContact && (!name.trim() || !phone.trim()))}
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
      </DialogContent>
    </Dialog>
  );
}
