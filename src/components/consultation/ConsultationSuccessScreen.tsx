import { useEffect, useRef } from 'react';
import { CheckCircle, MessageSquare, Shield, Sparkles, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { NextStepCard } from '@/components/seo/NextStepCard';
import { MethodologyBadge } from '@/components/authority/MethodologyBadge';
import { CallWindowManButton } from '@/components/consultation/CallWindowManButton';
import { trackEvent } from '@/lib/gtm';

interface ConsultationSuccessScreenProps {
  firstName?: string;
  onClose?: () => void;
}

export function ConsultationSuccessScreen({
  firstName,
  onClose,
}: ConsultationSuccessScreenProps) {
  const hasConfettiFired = useRef(false);

  useEffect(() => {
    trackEvent('confirmation_view', { source: 'consultation' });
  }, []);

  useEffect(() => {
    if (hasConfettiFired.current) return;
    hasConfettiFired.current = true;

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3993DD', '#F08C35', '#FFD700', '#60A5FA'],
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3993DD', '#FFD700'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#F08C35', '#FFD700'],
      });
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-y-auto py-6">
      <div className="relative max-w-md mx-auto px-6 text-center animate-fade-in max-h-[90vh] overflow-y-auto">

        {/* Hero Icon with glowing ring */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div
            className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"
            style={{ boxShadow: '0 0 40px hsl(209 68% 55% / 0.3), 0 0 80px hsl(209 68% 55% / 0.1)' }}
          />
          <div className="absolute inset-1 rounded-full border-2 border-primary/30" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 flex items-center justify-center backdrop-blur-sm">
            <Shield className="w-12 h-12 text-primary drop-shadow-[0_0_8px_hsl(209_68%_55%/0.5)]" />
            <CheckCircle className="w-6 h-6 text-secondary absolute bottom-2 right-2 drop-shadow-md" />
          </div>
        </div>

        {/* Gradient Headline */}
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary via-primary/70 to-foreground bg-clip-text text-transparent">
          Strategy Session Confirmed{firstName ? `, ${firstName}` : ''}!
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-muted-foreground mb-6">
          Your strategy session is being prepared.
        </p>

        {/* Glassy Status Card */}
        <div className="bg-primary/5 border border-primary/20 border-l-4 border-l-secondary backdrop-blur-md rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center gap-2 text-secondary mb-3">
            <MessageSquare className="w-5 h-5" />
            <span className="font-semibold">Expect a text in 5 minutes</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Our window expert is reviewing your details right now and will reach out shortly with insights on pricing, scope, and what to watch for.
          </p>
        </div>

        {/* Checklist Row */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium animate-in slide-in-from-bottom duration-300" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <Check className="w-3.5 h-3.5 text-success" />
            <span className="text-foreground">Request Received</span>
          </div>
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium animate-in slide-in-from-bottom duration-300" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <Check className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground">Expert Assigned</span>
          </div>
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium animate-in slide-in-from-bottom duration-300" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin" />
            <span className="text-foreground">Session Prep Starting</span>
          </div>
        </div>

        {/* Trust Indicators as pills */}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-8">
          <span className="flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1">
            <Shield className="w-3 h-3 text-primary" />
            Encrypted & Secure
          </span>
          <span className="flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3 text-secondary" />
            Expert-Led Session
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <CallWindowManButton source="consultation_success" />
          {onClose && (
            <Button variant="cta" onClick={onClose}>
              Continue Browsing
            </Button>
          )}
        </div>

        {/* Methodology Badge */}
        <div className="flex justify-center mt-4">
          <MethodologyBadge />
        </div>

        {/* Next Step Card */}
        <div className="mt-8 w-full max-w-md pb-6">
          <NextStepCard currentToolPath="/consultation" />
        </div>
      </div>
    </div>
  );
}
