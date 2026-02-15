import { useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useWelcomeToast } from '@/hooks/useWelcomeToast';
import { trackEngagement } from '@/services/analytics';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Welcome Toast - Glassmorphism onboarding prompt
 * Only appears on Homepage for first-time visitors with 0 engagement score
 */
export function WelcomeToast() {
  const { showToast, dismissToast } = useWelcomeToast();
  const hasTrackedImpression = useRef(false);

  // Track impression when toast becomes visible
  useEffect(() => {
    if (showToast && !hasTrackedImpression.current) {
      hasTrackedImpression.current = true;
      trackEngagement('toast_impression', 0, 'welcome');
    }
  }, [showToast]);

  const handleStartScoring = () => {
    trackEngagement('toast_click', 0, 'welcome');

    // Scroll to tool grid with fallback
    const toolGrid = document.getElementById('tool-grid');
    if (toolGrid) {
      toolGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add brief highlight effect
      toolGrid.classList.add('ring-2', 'ring-primary/50', 'ring-offset-2');
      setTimeout(() => {
        toolGrid.classList.remove('ring-2', 'ring-primary/50', 'ring-offset-2');
      }, 1500);
    } else {
      // Fallback: scroll to approximate fold
      window.scrollTo({ top: 600, behavior: 'smooth' });
    }

    dismissToast();
  };

  const handleDismiss = () => {
    trackEngagement('toast_dismiss', 0, 'welcome');
    dismissToast();
  };

  if (!showToast) return null;

  return (
    <div
      className={cn(
        // Base positioning
        "fixed z-50 max-w-sm w-[calc(100%-2rem)]",
        // Desktop: bottom-center
        "bottom-4 left-1/2 -translate-x-1/2",
        // Mobile: top-center with navbar clearance
        "sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2",
        // Animation
        "animate-in slide-in-from-bottom-4 fade-in duration-500"
      )}>

      {/* Gradient Border Wrapper - the "Journey" pill with shimmer */}
      <div
        className={cn(
          // Rectangular shape with gradient background (acts as border)
          "rounded-2xl p-[2px]",
          // Shimmer gradient: cream → blue → cream for animation sweep
          "bg-gradient-to-r from-[#fef8d5] via-[#094cee] to-[#fef8d5]",
          "bg-[length:200%_100%]",
          "animate-border-shimmer",
          "shadow-2xl shadow-primary/20"
        )}>

        {/* Inner Glass Container */}
        <div
          className={cn(
            // Glassmorphism effect inside the card
            "relative overflow-hidden rounded-2xl",
            "bg-background/90 backdrop-blur-xl",
            // Padding - more horizontal for pill shape
            "px-5 py-4 sm:px-6 sm:py-5"
          )}>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className={cn(
              "absolute top-3 right-4 p-1 rounded-full",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted/50 transition-colors"
            )}
            aria-label="Dismiss">

            <X className="h-4 w-4" />
          </button>
          
          {/* Content */}
          <div className="relative space-y-3">
            {/* Headline */}
            <div className="flex items-center pr-6">
              <h3 className="font-semibold text-foreground">
                Window Man The Truth Report🛡️
              </h3>
            </div>
            
            {/* Body */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              See your <span className="text-foreground font-medium">Readiness Score</span> in the header? 
              Use tools to earn points and unlock elite protection guides.
            </p>
            
            {/* CTA Button */}
            <Button
              onClick={handleStartScoring}
              variant="cta"
              size="sm"
              className="w-full sm:w-auto mt-1">

              Start Scoring Points
            </Button>
          </div>
        </div>
      </div>
    </div>);

}