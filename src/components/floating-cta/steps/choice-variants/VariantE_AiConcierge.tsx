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
 * Suggested question chips are county-aware.
 */
export function VariantE_AiConcierge({
  onCallClick,
  onStartForm,
  onStartAiQa,
  locationData,
}: ChoiceVariantProps) {
  const config = PANEL_VARIANT_CONFIG.E;
  const { total } = useTickerStats();

  const countyLabel = locationData?.county;

  // Suggested question chips (county-aware)
  const suggestedQuestions = [
    'How much do impact windows cost?',
    countyLabel
      ? `Do I need a permit in ${countyLabel}?`
      : 'Do I need a building permit?',
    'Is my quote fair?',
  ];

  const handleChipClick = (question: string) => {
    trackEvent('ai_qa_chip_clicked', {
      panel_variant: 'E',
      question,
    });
    onStartAiQa('concierge', question);
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
            onStartAiQa('concierge');
          }}
          variant="cta"
          size="lg"
          className="w-full"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {config.thirdCtaLabel}
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
          {config.estimateCtaLabel}
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
