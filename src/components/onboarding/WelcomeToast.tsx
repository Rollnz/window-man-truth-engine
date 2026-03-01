import { useEffect, useRef, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useWelcomeToast } from "@/hooks/useWelcomeToast";
import { trackEngagement } from "@/services/analytics";
import { PreQuoteLeadModalV2 } from "@/components/LeadModalV2";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Welcome Toast - Glassmorphism onboarding prompt
 * Only appears on Homepage for first-time visitors with 0 engagement score
 */
export function WelcomeToast() {
  const { showToast, dismissToast } = useWelcomeToast();
  const hasTrackedImpression = useRef(false);
  const [haveQuoteOpen, setHaveQuoteOpen] = useState(false);
  const [wantQuoteOpen, setWantQuoteOpen] = useState(false);

  // Track impression when toast becomes visible
  useEffect(() => {
    if (showToast && !hasTrackedImpression.current) {
      hasTrackedImpression.current = true;
      trackEngagement("toast_impression", 0, "welcome");
    }
  }, [showToast]);

  const handleHaveQuote = () => {
    trackEngagement("toast_click_have_quote", 0, "welcome");
    dismissToast();
    setHaveQuoteOpen(true);
  };

  const handleWantQuote = () => {
    trackEngagement("toast_click_want_quote", 0, "welcome");
    dismissToast();
    setWantQuoteOpen(true);
  };

  const handleDismiss = () => {
    trackEngagement("toast_dismiss", 0, "welcome");
    dismissToast();
  };

  return (
    <>
      {showToast && (
        <div
          className={cn(
            "fixed z-50 max-w-sm w-[calc(100%-2rem)]",
            "bottom-4 left-1/2 -translate-x-1/2",
            "sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2",
            "animate-in slide-in-from-bottom-4 fade-in duration-500",
          )}
        >
          <div
            className={cn(
              "rounded-2xl p-[2px]",
              "bg-gradient-to-r from-[#fef8d5] via-[#094cee] to-[#fef8d5]",
              "bg-[length:200%_100%]",
              "animate-border-shimmer",
              "shadow-2xl shadow-primary/20",
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-background/90 backdrop-blur-xl",
                "px-5 py-4 sm:px-6 sm:py-5",
              )}
            >
              <button
                onClick={handleDismiss}
                className={cn(
                  "absolute top-3 right-4 p-1 rounded-full",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/50 transition-colors",
                )}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative space-y-3">
                <div className="flex items-center gap-2 pr-6">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-foreground">The WindowMan Truth Report</h3>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Audit your quote and save money.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1">
                  <Button onClick={handleHaveQuote} variant="cta" size="sm" className="w-full sm:w-auto">
                    I Have a Quote
                  </Button>
                  <Button onClick={handleWantQuote} variant="outline" size="sm" className="w-full sm:w-auto">
                    I Want a Quote
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PreQuoteLeadModalV2
        isOpen={haveQuoteOpen}
        onClose={() => setHaveQuoteOpen(false)}
        ctaSource="homepage_toast_have_quote"
        contextKey="Homepage"
      />
      <PreQuoteLeadModalV2
        isOpen={wantQuoteOpen}
        onClose={() => setWantQuoteOpen(false)}
        ctaSource="homepage_toast_want_quote"
        contextKey="Homepage"
      />
    </>
  );
}
