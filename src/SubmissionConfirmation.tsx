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
 * Render a personalized post-submission confirmation card.
 *
 * The component displays a success header, an expected next-step/time message,
 * trust signals, optional action buttons, and a closing reassurance line.
 * On mount or when `source` changes it pushes a `confirmation_view` event to
 * `window.dataLayer` when available.
 *
 * @param firstName - Recipient's first name used in the greeting
 * @param source - Submission origin used for analytics and conditional UI (e.g., 'beat-your-quote')
 * @param nextStep - How the user will be contacted; one of `'text' | 'email' | 'call'` (default: `'text'`)
 * @param expectedTime - Human-readable time expectation shown to the user (default: `'5 minutes'`)
 * @param onContinueBrowsing - Callback invoked when the primary "Continue Browsing" action is clicked
 * @param onUploadAnother - Optional callback shown as "Upload Another Quote" when `source` is `'beat-your-quote'`
 * @param onChatWithAI - Optional callback shown as "Chat with our AI window expert" when provided
 * @param className - Optional container className for layout/custom styling
 * @returns The confirmation UI as a React element
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
      <Card className="border-slate-200 bg-white shadow-xl overflow-hidden">
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
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-lg">
                  Expect a {nextStepText} in {expectedTime}
                </p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Our window expert is reviewing your information right now and will 
                  reach out shortly with insights on pricing, scope, or red flags.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-3 py-4">
            <Badge 
              variant="outline" 
              className="px-3 py-1.5 text-sm border-slate-200 bg-white text-slate-600 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              Encrypted & Secure
            </Badge>
            
            <Badge 
              variant="outline" 
              className="px-3 py-1.5 text-sm border-slate-200 bg-white text-slate-600 flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-slate-500" />
              Methodology Verified
            </Badge>
          </div>

          {/* AI Analysis Badge - Secondary */}
          <div className="text-center">
            <Badge 
              variant="secondary" 
              className="px-4 py-1.5 text-sm bg-slate-100 text-slate-700"
            >
              AI-Powered Analysis
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {/* Primary CTA - Continue Browsing */}
            <Button
              onClick={onContinueBrowsing}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 text-base font-medium transition-all"
            >
              Continue Browsing
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            {/* Secondary CTA - Upload Another (only for beat-your-quote) */}
            {source === 'beat-your-quote' && onUploadAnother && (
              <Button
                variant="outline"
                onClick={onUploadAnother}
                className="w-full py-5 text-base border-slate-200 hover:bg-slate-50 transition-all"
              >
                Upload Another Quote
              </Button>
            )}

            {/* Optional Tertiary - AI Chat */}
            {onChatWithAI && (
              <Button
                variant="ghost"
                onClick={onChatWithAI}
                className="w-full py-4 text-slate-600 hover:text-slate-900 hover:bg-transparent transition-colors"
              >
                <MessageSquare className="mr-2 w-4 h-4" />
                Chat with our AI window expert
              </Button>
            )}
          </div>

          {/* Closing Reassurance */}
          <p className="text-center text-sm text-slate-500 pt-2">
            Questions? Reply to the {nextStepText} when it arrives.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}