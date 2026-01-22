import { useState, useEffect, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSessionData } from '@/hooks/useSessionData';
import { trackEvent } from '@/lib/gtm';
import { PriceAnalysis } from '@/lib/fairPriceCalculations';
import { Vault, X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface DownsellStickyFooterProps {
  phoneCTARef: RefObject<HTMLDivElement>;
  userEmail: string;
  userName: string;
  analysis: PriceAnalysis;
  phoneSubmitted: boolean;
}

export function DownsellStickyFooter({
  phoneCTARef,
  userEmail,
  userName,
  analysis,
  phoneSubmitted,
}: DownsellStickyFooterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { signInWithMagicLink } = useAuth();
  const { updateFields, sessionData } = useSessionData();

  // Check if already synced
  const alreadySynced = sessionData.vaultSyncPending === true;

  useEffect(() => {
    if (!phoneCTARef?.current || isDismissed || alreadySynced) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show when phone CTA is NOT visible
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(phoneCTARef.current);
    return () => observer.disconnect();
  }, [phoneCTARef, isDismissed, alreadySynced]);

  const handleSync = async () => {
    setIsLoading(true);

    try {
      // Persist quiz results to session
      updateFields({
        fairPriceQuizResults: {
          ...analysis,
          analyzedAt: new Date().toISOString(),
        },
        vaultSyncPending: true,
        vaultSyncEmail: userEmail,
        vaultSyncSource: 'fair-price-quiz',
        email: userEmail,
        name: userName,
      });

      // Track the click
      trackEvent('vault_sync_clicked', { 
        source_tool: 'fair-price-quiz',
        analysis_grade: analysis.grade,
      });

      // Send magic link
      const { error } = await signInWithMagicLink(userEmail);

      if (!error) {
        trackEvent('vault_activation', {
          source_tool: 'fair-price-quiz',
          method: 'magic_link',
        });
        setShowSuccess(true);
        // Auto-dismiss after showing success
        setTimeout(() => setIsDismissed(true), 3000);
      }
    } catch (err) {
      console.error('Downsell sync error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if dismissed, already synced, or phone already submitted (they'll see the inline Vault CTA)
  if (isDismissed || alreadySynced || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-full duration-300">
      <div className="bg-card border-t border-border shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {showSuccess ? (
            <div className="flex items-center justify-center gap-3 text-primary">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Check your email to access your Vault!</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <h4 className="font-bold text-foreground">
                    Wait! Don't lose your progress.
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  This analysis will expire when you close this tab. Save a permanent copy to your Free Vault.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSync}
                  disabled={isLoading}
                  variant="default"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Vault className="w-4 h-4 mr-2" />
                      Save My Data
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDismissed(true)}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
