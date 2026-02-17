import { Phone, FileText, ShieldAlert } from 'lucide-react';
import { StampBadge } from '@/components/beat-your-quote/StampBadge';
import { UrgencyTicker } from '@/components/social-proof/UrgencyTicker';
import { PANEL_VARIANT_CONFIG } from '@/lib/panelVariants';
import { CtaCard } from './shared/CtaCard';
import { MiniTrustBar } from './shared/MiniTrustBar';
import { trackEvent } from '@/lib/gtm';
import { cn } from '@/lib/utils';
import type { ChoiceVariantProps } from './types';

/**
 * Returns seasonal urgency framing based on current month.
 * Jun-Nov = hurricane season active, Dec-May = prep window.
 */
function getSeasonalContext(): { label: string; isActive: boolean } {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 5 && month <= 10) {
    return { label: 'Hurricane season is active', isActive: true };
  }
  return { label: 'Storm prep window is open', isActive: false };
}

/**
 * Variant D: "Storm Shield" (Urgency/Event)
 *
 * Calendar-aware urgency framing with county-specific storm data.
 * 3rd CTA: "Check Your Storm Readiness" → AI Q&A in storm mode.
 */
export function VariantD_UrgencyEvent({
  onCallClick,
  onStartForm,
  onStartAiQa,
  locationData,
}: ChoiceVariantProps) {
  const config = PANEL_VARIANT_CONFIG.D;
  const seasonal = getSeasonalContext();

  const countyData = locationData?.countyData;
  const countyLabel = locationData?.county;

  const subheadline = countyLabel && countyData
    ? `${countyLabel} County: $${Math.round(countyData.avgStormClaims * 18).toLocaleString()} average storm damage with outdated windows`
    : config.subheadline;

  const isHighRisk = countyData && countyData.avgStormClaims > 600;

  return (
    <div className="space-y-4 wm-reveal">
      {/* Alert header */}
      <div
        className={cn(
          'rounded-lg border-2 p-3 text-center',
          isHighRisk
            ? 'border-destructive/40 bg-destructive/5'
            : 'border-secondary/40 bg-secondary/5'
        )}
      >
        <StampBadge variant="red">
          {seasonal.isActive ? 'STORM SEASON ALERT' : 'STORM PREP WINDOW'}
        </StampBadge>
        <p className="mt-2 text-xs text-muted-foreground">{seasonal.label}</p>
      </div>

      {/* Urgency ticker */}
      <UrgencyTicker variant="cyberpunk" size="sm" showToday={false} />

      {/* Headline + subhead */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-foreground">
          {config.headline}
        </h3>
        <p className="text-sm text-muted-foreground">{subheadline}</p>
      </div>

      {/* CTA 3: Storm Readiness Check */}
      <div className="wm-reveal wm-stagger-1">
        <CtaCard
          icon={<ShieldAlert className="h-5 w-5 text-destructive" />}
          label={config.thirdCtaLabel}
          subtext={config.thirdCtaSubtext}
          onClick={() => {
            trackEvent('choice_step_cta_clicked', {
              panel_variant: 'D',
              cta_type: 'third_cta',
              third_cta_category: 'urgency',
              county: countyLabel,
            });
            onStartAiQa('storm');
          }}
          variant="destructive"
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
      <MiniTrustBar
        stat={
          countyLabel && countyData
            ? `${countyLabel}: ${countyData.avgStormClaims} claims filed annually`
            : '3,400+ Quotes Analyzed'
        }
        riskReversal="Licensed. Insured. FL Building Code Certified."
      />
    </div>
  );
}
