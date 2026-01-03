import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Mail, Check, Loader2, Calendar, Shield, ArrowRight } from 'lucide-react';
import { logEvent } from '@/lib/windowTruthClient';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leadId: string) => void;
  sourceTool: string;
  sessionData: SessionData;
  chatHistory?: Message[];
}

export function LeadCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  sourceTool,
  sessionData,
  chatHistory,
}: LeadCaptureModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNextStep, setShowNextStep] = useState(false); // NEW: booking→vault choice
  const [capturedLeadId, setCapturedLeadId] = useState<string>('');
  const [capturedEmail, setCapturedEmail] = useState<string>('');
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

      logEvent({
        event_name: 'modal_open',
        tool_name: sourceTool,
        params: {
          modal_type: 'lead_capture',
          source_tool: sourceTool,
        },
      });
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }

      const data = await response.json();

      if (data.success && data.leadId) {
        setCapturedLeadId(data.leadId);
        setCapturedEmail(values.email.trim());

        // Track successful lead capture
        logEvent({
          event_name: 'lead_captured',
          tool_name: sourceTool,
          params: {
            modal_type: 'lead_capture',
            lead_id: data.leadId,
          },
        });

        // Instead of closing, show next step (booking→vault choice)
        setIsSuccess(true);

        setTimeout(() => {
          setShowNextStep(true);
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
        logEvent({
          event_name: 'modal_abandon',
          tool_name: sourceTool,
          params: {
            modal_type: 'lead_capture',
            time_spent_seconds: timeSpent,
          },
        });
      }

      setIsSuccess(false);
      setShowNextStep(false);
      onClose();
    }
  };

  const handleBooking = () => {
    // Track booking click
    logEvent({
      event_name: 'booking_cta_clicked',
      tool_name: sourceTool,
      params: {
        lead_id: capturedLeadId,
        source: 'lead_capture_modal',
      },
    });

    // Close modal and redirect to expert/booking page
    onClose();
    navigate('/expert');
  };

  const handleVault = async () => {
    setIsLoading(true);

    try {
      // Create vault account seamlessly (they already gave email)
      // Generate a temporary password or use magic link
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: capturedEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: name || null,
            phone: phone || null,
            source_tool: sourceTool,
            lead_id: capturedLeadId,
            created_from_modal: true,
          },
        },
      });

      if (authError) throw authError;

      // Track vault creation
      logEvent({
        event_name: 'vault_created',
        tool_name: sourceTool,
        params: {
          lead_id: capturedLeadId,
          source: 'lead_capture_modal',
        },
      });

      toast({
        title: 'Vault Created!',
        description: 'Redirecting to your secure vault...',
      });

      // Redirect to vault welcome page
      setTimeout(() => {
        onClose();
        navigate(`/vault/welcome?source=${sourceTool}&leadId=${capturedLeadId}`);
      }, 1000);
    } catch (error) {
      console.error('Vault creation error:', error);
      toast({
        title: 'Unable to Create Vault',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
        {showNextStep ? (
          // NEW: Booking → Vault choice screen
          <div className="py-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-center text-2xl">
                What Would You Like to Do Next?
              </DialogTitle>
              <DialogDescription className="text-center">
                Choose the option that works best for you
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Primary CTA: Book Measurement */}
              <button
                onClick={handleBooking}
                className="w-full p-6 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                      Book Free Measurement
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Get a professional on-site assessment and accurate quote for your home
                    </p>
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                      <span>Schedule Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Secondary CTA: Save to Vault */}
              <button
                onClick={handleVault}
                disabled={isLoading}
                className="w-full p-6 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-colors text-left group disabled:opacity-50"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      Save to Vault Instead
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Not ready to book? Save your results and access them anytime in your secure vault
                    </p>
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating vault...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <span>Create Free Vault</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              You can always access both options later from your vault
            </p>
          </div>
        ) : isSuccess ? (
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
