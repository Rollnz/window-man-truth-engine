import { useEffect, useRef } from 'react';
import { CheckCircle, MessageSquare, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { NextStepCard } from '@/components/seo/NextStepCard';
import { MethodologyBadge } from '@/components/authority/MethodologyBadge';

interface AnalysisSuccessScreenProps {
  leadName?: string;
  onClose?: () => void;
  onUploadAnother?: () => void;
}

export function AnalysisSuccessScreen({
  leadName,
  onClose,
  onUploadAnother,
}: AnalysisSuccessScreenProps) {
  const hasConfettiFired = useRef(false);

  // Fire confetti on mount
  useEffect(() => {
    if (hasConfettiFired.current) return;
    hasConfettiFired.current = true;

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00D4FF', '#FFD700', '#00FF88', '#FF6B6B'],
    });

    // Secondary burst after short delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00D4FF', '#FFD700'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00D4FF', '#FFD700'],
      });
    }, 250);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-y-auto py-6">
      <div className="relative max-w-md mx-auto px-6 text-center animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Success Icon */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold mb-3">
          Mission Accomplished{leadName ? `, ${leadName.split(' ')[0]}` : ''}!
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-muted-foreground mb-6">
          Your quote is with our expert.
        </p>

        {/* Status Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-2 text-primary mb-3">
            <MessageSquare className="w-5 h-5" />
            <span className="font-semibold">Expect a text in 5 minutes</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Our window expert is reviewing your quote right now and will reach out shortly with insights on hidden fees and savings opportunities.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-8">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-primary" />
            Encrypted & Secure
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            AI-Powered Analysis
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onUploadAnother && (
            <Button variant="outline" onClick={onUploadAnother}>
              Upload Another Quote
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose}>
              Continue Browsing
            </Button>
          )}
        </div>

        {/* Methodology Badge */}
        <div className="flex justify-center mt-4">
          <MethodologyBadge />
        </div>

        {/* Next Step Card - Prevents traffic leaks */}
        <div className="mt-8 w-full max-w-md pb-6">
          <NextStepCard currentToolPath="/beat-your-quote" />
        </div>
      </div>
    </div>
  );
}
