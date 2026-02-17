import { Phone, FileText, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { PANEL_VARIANT_CONFIG } from '@/lib/panelVariants';
import { ReviewedByBadge } from '@/components/authority/ReviewedByBadge';
import { CtaCard } from './shared/CtaCard';
import { MiniTrustBar } from './shared/MiniTrustBar';
import { trackEvent } from '@/lib/gtm';
import { cn } from '@/lib/utils';
import type { ChoiceVariantProps } from './types';

/**
 * Variant C: "The Insider Report" (Incentive/Offer)
 *
 * Value-first approach with a gated savings report.
 * 3rd CTA: "Unlock Your Savings Report" → AI Q&A in savings mode.
 */
export function VariantC_IncentiveOffer({
  onCallClick,
  onStartForm,
  onStartAiQa,
  locationData,
  engagementScore,
}: ChoiceVariantProps) {
  const config = PANEL_VARIANT_CONFIG.C;
  const [isHovered, setIsHovered] = useState(false);

  const cityLabel = locationData?.city || 'Florida';
  const subheadline = `See how much ${cityLabel} homeowners are overpaying`;

  // Engagement-aware banner
  const bannerText =
    engagementScore > 50
      ? 'Based on your research, you qualify for priority scheduling'
      : 'This Week: Free Window Assessment ($299 Value)';

  return (
    <div className="space-y-4 wm-reveal">
      {/* Promotional banner */}
      <div
        className={cn(
          'rounded-lg border px-4 py-2.5 text-center',
          'bg-secondary/5 border-secondary/20',
          'text-xs font-semibold text-secondary'
        )}
      >
        {bannerText}
      </div>

      {/* Headline + subhead */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-foreground">
          {config.headline}
        </h3>
        <p className="text-sm text-muted-foreground">{subheadline}</p>
      </div>

      {/* CTA 3: Unlock Savings Report (primary position) */}
      <div
        className="wm-reveal wm-stagger-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CtaCard
          icon={
            isHovered ? (
              <Unlock className="h-5 w-5 text-primary-foreground" />
            ) : (
              <Lock className="h-5 w-5 text-primary" />
            )
          }
          label={config.thirdCtaLabel}
          subtext={config.thirdCtaSubtext}
          onClick={() => {
            trackEvent('choice_step_cta_clicked', {
              panel_variant: 'C',
              cta_type: 'third_cta',
              third_cta_category: 'incentive',
            });
            onStartAiQa('savings');
          }}
          variant="cta"
          className="animate-[cta-breathe_4s_ease-in-out_infinite]"
        />
      </div>

      {/* CTA 1: Call */}
      <div className="wm-reveal wm-stagger-2">
        <CtaCard
          icon={<Phone className="h-5 w-5 text-primary" />}
          label={config.callCtaLabel}
          subtext={config.callCtaSubtext}
          onClick={onCallClick}
          variant="primary"
        />
      </div>

      {/* CTA 2: Estimate */}
      <div className="wm-reveal wm-stagger-3">
        <CtaCard
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          label={config.estimateCtaLabel}
          subtext={config.estimateCtaSubtext}
          onClick={onStartForm}
          variant="outline"
        />
      </div>

      {/* Trust bar */}
      <ReviewedByBadge variant="inline" className="justify-center" />
      <MiniTrustBar
        riskReversal="No obligation. Cancel anytime. Your data stays private."
      />
    </div>
  );
}
