import { Phone, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';
import { ReviewedByBadge } from '@/components/authority/ReviewedByBadge';
import { MiniTrustBar } from './shared/MiniTrustBar';
import { PANEL_VARIANT_CONFIG } from '@/lib/panelVariants';
import { useTickerStats } from '@/hooks/useTickerStats';
import { trackEvent } from '@/lib/gtm';
import { cn } from '@/lib/utils';
import type { ChoiceVariantProps } from './types';

/**
 * Variant E: "Window Man Concierge" (AI Concierge)
 *
 * Conversation-first approach. AI Q&A is the primary CTA.
 * Suggested question chips are route-aware and county-aware.
 */
export function VariantE_AiConcierge({
  onCallClick,
  onStartForm,
  onStartAiQa,
  locationData,
  routeContext,
}: ChoiceVariantProps) {
  const config = PANEL_VARIANT_CONFIG.E;
  const { total } = useTickerStats();

  const countyLabel = locationData?.county;

  // Build chips: route-specific first, then geo chip if not duplicated, cap at 5
  const baseChips = [...routeContext.chips];
  if (countyLabel) {
    const geoChip = `Do I need a permit in ${countyLabel}?`;
    if (!baseChips.some((c) => c.toLowerCase().includes('permit'))) {
      baseChips.push(geoChip);
    }
  }
  const suggestedQuestions = baseChips.slice(0, 5);

  const handleChipClick = (question: string) => {
    trackEvent('ai_qa_chip_clicked', {
      panel_variant: 'E',
      question,
    });
    // Also fire new canonical chip event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'wm_panel_chip_clicked',
      route_context_key: routeContext.key,
      chip_text: question,
      resolved_mode: routeContext.defaultMode,
      panel_variant: 'E',
    });
    onStartAiQa(routeContext.defaultMode, question);
  };

  return (
    <div className="space-y-5">
      {/* Window Man avatar */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            'w-16 h-16 rounded-full bg-cover bg-center',
            'ring-2 ring-primary/30 animate-[pulse-glow_4s_ease-in-out_infinite]'
          )}
          style={{
            backgroundImage: "url('/images/windowman.webp')",
          }}
          role="img"
          aria-label="Window Man AI Concierge"
        />
        <ShimmerBadge text="AI Concierge" />
        {routeContext.modeBadgeLabel && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
            {routeContext.modeBadgeLabel}
          </span>
        )}
      </div>

      {/* Headline */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-foreground">
          {config.headline}
        </h3>
        <p className="text-sm text-muted-foreground">{config.subheadline}</p>
      </div>

      {/* Primary CTA: Ask Me Anything */}
      <div>
        <Button
          onClick={() => {
            trackEvent('choice_step_cta_clicked', {
              panel_variant: 'E',
              cta_type: 'ai_qa',
              third_cta_category: 'ai_concierge',
            });
            onStartAiQa(routeContext.defaultMode);
          }}
          variant="cta"
          size="lg"
          className="w-full"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {routeContext.ctaPrimaryLabel || config.thirdCtaLabel}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {config.thirdCtaSubtext}
        </p>
      </div>

      {/* Suggested question chips */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          Or try a quick question:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleChipClick(q)}
              className={cn(
                'px-3 py-2 rounded-full text-xs font-medium',
                'border border-border bg-muted/30',
                'text-muted-foreground hover:text-foreground',
                'hover:border-primary/50 hover:bg-primary/5',
                'transition-colors min-h-[44px]'
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary CTAs */}
      <div className="space-y-2 pt-2">
        <Button
          onClick={onCallClick}
          variant="outline"
          size="default"
          className="w-full"
        >
          <Phone className="h-4 w-4 mr-2" />
          {config.callCtaLabel}
        </Button>
        <Button
          onClick={onStartForm}
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
        >
          <FileText className="h-4 w-4 mr-2" />
          {routeContext.ctaSecondaryLabel || config.estimateCtaLabel}
        </Button>
      </div>

      {/* Trust bar */}
      <div className="space-y-2 pt-2">
        <ReviewedByBadge variant="inline" className="justify-center" />
        <MiniTrustBar stat={`${total.toLocaleString()}+ Quotes Analyzed`} />
      </div>
    </div>
  );
}
