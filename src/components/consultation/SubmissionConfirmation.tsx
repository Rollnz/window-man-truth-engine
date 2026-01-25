import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Shield, 
  FileCheck,
  MessageSquare,
  ArrowRight,
  Clock
} from 'lucide-react';
import { SubmissionSource } from '@/types/consultation';
import { cn } from '@/lib/utils';
import { CallWindowManButton } from './CallWindowManButton';

interface SubmissionConfirmationProps {
  firstName: string;
  source: SubmissionSource;
  nextStep?: 'text' | 'email' | 'call';
  expectedTime?: string;
  onContinueBrowsing?: () => void;
  onUploadAnother?: () => void;
  onChatWithAI?: () => void;
  className?: string;
}

/**
 * Reusable Post-Submission Confirmation Component
 * 
 * This component handles four psychological jobs:
 * 1. Certainty – "My action worked."
 * 2. Trust – "A real expert is involved."
 * 3. Time anchoring – "I know what happens next and when."
 * 4. Containment – "I don't need to do anything else right now."
 */
export function SubmissionConfirmation({
  firstName,
  source,
  nextStep = 'text',
  expectedTime = '5 minutes',
  onContinueBrowsing,
  onUploadAnother,
  onChatWithAI,
  className,
}: SubmissionConfirmationProps) {
  // Track confirmation view
  useEffect(() => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'confirmation_view',
        source,
        timestamp: new Date().toISOString(),
      });
    }
  }, [source]);

  const nextStepText = {
    text: 'text message',
    email: 'email',
    call: 'phone call',
  }[nextStep];

  return (
    <div className={cn('w-full max-w-2xl mx-auto px-4 py-12', className)}>
      <Card className="border-border bg-card shadow-xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-10 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Mission Accomplished, {firstName}.
          </h1>
          
          <p className="text-emerald-50 text-lg">
            Your project is with our expert.
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Time Expectation Block - The Trust Anchor */}
          <div className="bg-muted rounded-xl p-5 border border-border">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">
                  Expect a {nextStepText} in {expectedTime}
                </p>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  Our window expert is reviewing your information right now and will 
                  reach out shortly with insights on pricing, scope, or red flags.
                </p>
              </div>
            </div>
          </div>

          {/* Call Window Man Button - Primary CTA */}
          <div className="flex justify-center">
            <CallWindowManButton 
              source="consultation-confirmation"
              variant="default"
              size="lg"
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            />
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-3 py-4">
            <Badge 
              variant="outline" 
              className="px-3 py-1.5 text-sm border-border bg-card text-muted-foreground flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Encrypted & Secure
            </Badge>
            
            <Badge 
              variant="outline" 
              className="px-3 py-1.5 text-sm border-border bg-card text-muted-foreground flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Methodology Verified
            </Badge>
          </div>

          {/* AI Analysis Badge - Secondary */}
          <div className="text-center">
            <Badge 
              variant="secondary" 
              className="px-4 py-1.5 text-sm"
            >
              AI-Powered Analysis
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {/* Secondary CTA - Continue Browsing */}
            <Button
              onClick={onContinueBrowsing}
              variant="outline"
              className="w-full py-6 text-base font-medium transition-all"
            >
              Continue Browsing
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            {/* Tertiary CTA - Upload Another (only for beat-your-quote) */}
            {source === 'beat-your-quote' && onUploadAnother && (
              <Button
                variant="ghost"
                onClick={onUploadAnother}
                className="w-full py-5 text-base transition-all"
              >
                Upload Another Quote
              </Button>
            )}

            {/* Optional Tertiary - AI Chat */}
            {onChatWithAI && (
              <Button
                variant="ghost"
                onClick={onChatWithAI}
                className="w-full py-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="mr-2 w-4 h-4" />
                Chat with our AI window expert
              </Button>
            )}
          </div>

          {/* Closing Reassurance */}
          <p className="text-center text-sm text-muted-foreground pt-2">
            Questions? Reply to the {nextStepText} when it arrives.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
