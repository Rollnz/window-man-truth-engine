import { Phone, FileText, BarChart3 } from 'lucide-react';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';
import { PANEL_VARIANT_CONFIG } from '@/lib/panelVariants';
import { CtaCard } from './shared/CtaCard';
import { LocationBadge } from './shared/LocationBadge';
import { MiniTrustBar } from './shared/MiniTrustBar';
import { trackEvent } from '@/lib/gtm';
import type { ChoiceVariantProps } from './types';

/**
 * Variant A: "The Evidence Vault" (Proof/Transparency)
 *
 * Leads with social proof and verified results.
 * 3rd CTA: "See Real Results" → AI Q&A in proof mode.
 */
export function VariantA_ProofTransparency({
  onCallClick,
  onStartForm,
  onStartAiQa,
  locationData,
  locationLoading,
  onResolveZip,
}: ChoiceVariantProps) {
  const config = PANEL_VARIANT_CONFIG.A;

  const countyLabel = locationData
    ? `See What We Found for ${locationData.county} Homeowners`
    : config.thirdCtaLabel;

  return (
    <div className="space-y-4">
      {/* Header badge */}
      <div className="flex justify-center">
        <ShimmerBadge text="AI-Powered Truth Engine" />
      </div>

      {/* Headline + subhead */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-foreground">
          {config.headline}
        </h3>
        <p className="text-sm text-muted-foreground">
          {locationData
            ? `${locationData.county} County homeowners save an average of $11,500 with our analysis`
            : config.subheadline}
        </p>
      </div>

      {/* CTA 1: Call */}
      <CtaCard
        icon={<Phone className="h-5 w-5 text-primary" />}
        label={config.callCtaLabel}
        subtext={config.callCtaSubtext}
        onClick={onCallClick}
        variant="primary"
      />

      {/* CTA 3: See Real Results (Proof) */}
      <CtaCard
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        label={countyLabel}
        subtext={config.thirdCtaSubtext}
        onClick={() => {
          trackEvent('choice_step_cta_clicked', {
            panel_variant: 'A',
            cta_type: 'third_cta',
            third_cta_category: 'proof',
          });
          onStartAiQa('proof');
        }}
        variant="secondary"
      >
        <div className="mt-2 flex justify-center">
          <LocationBadge
            locationData={locationData}
            isLoading={locationLoading}
            onResolveZip={onResolveZip}
          />
        </div>
      </CtaCard>

      {/* CTA 2: Request Estimate */}
      <CtaCard
        icon={<FileText className="h-5 w-5 text-muted-foreground" />}
        label={config.estimateCtaLabel}
        subtext={config.estimateCtaSubtext}
        onClick={onStartForm}
        variant="outline"
      />

      {/* Trust bar */}
      <MiniTrustBar />
    </div>
  );
}
