import { useState } from 'react';
import { z } from 'zod';
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
import { SessionData } from '@/hooks/useSessionData';
import { Mail, Check, Loader2 } from 'lucide-react';

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

const emailSchema = z.string().email('Please enter a valid email address');

export function LeadCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  sourceTool,
  sessionData,
  chatHistory,
}: LeadCaptureModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(sessionData.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email with zod
    const validation = emailSchema.safeParse(email.trim());
    if (!validation.success) {
      toast({
        title: 'Invalid Email',
        description: validation.error.errors[0].message,
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
            email: email.trim(),
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
        setIsSuccess(true);
        toast({
          title: 'Conversation Saved!',
          description: 'Check your inbox for a summary.',
        });
        
        // Wait a moment to show success state, then call onSuccess
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
  
  let modalTitle = 'Save Your Conversation';
  let modalDescription = 'Enter your email to save your conversation and get personalized recommendations.';
  let buttonText = 'Save My Conversation';
  let successTitle = 'Saved Successfully!';
  let successDescription = 'We\'ve saved your conversation and session data.';

  if (isComparisonTool) {
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
  }

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
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email.trim()}
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
