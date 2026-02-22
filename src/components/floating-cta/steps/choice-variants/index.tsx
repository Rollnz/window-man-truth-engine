import type { PanelVariant } from '@/hooks/usePanelVariant';
import type { AiQaMode } from '@/lib/panelVariants';
import type { LocationPersonalization } from '@/hooks/useLocationPersonalization';
import type { RouteContext } from '@/lib/routeContext';
import { VariantA_ProofTransparency } from './VariantA_ProofTransparency';
import { VariantB_DiagnosticQuiz } from './VariantB_DiagnosticQuiz';
import { VariantC_IncentiveOffer } from './VariantC_IncentiveOffer';
import { VariantD_UrgencyEvent } from './VariantD_UrgencyEvent';
import { VariantE_AiConcierge } from './VariantE_AiConcierge';
import { trackEvent } from '@/lib/gtm';
import { useEffect } from 'react';

interface ChoiceStepDispatcherProps {
  variant: PanelVariant;
  onCallClick: () => void;
  onStartForm: () => void;
  onStartAiQa: (mode: AiQaMode, initialMessage?: string) => void;
  locationData: LocationPersonalization | null;
  locationLoading: boolean;
  onResolveZip: (zip: string) => Promise<void>;
  engagementScore: number;
  routeContext: RouteContext;
}

const VARIANT_COMPONENTS = {
  A: VariantA_ProofTransparency,
  B: VariantB_DiagnosticQuiz,
  C: VariantC_IncentiveOffer,
  D: VariantD_UrgencyEvent,
  E: VariantE_AiConcierge,
} as const;

/**
 * ChoiceStepDispatcher - Renders the correct choice-step variant based on A/B assignment.
 */
export function ChoiceStepDispatcher({
  variant,
  onCallClick,
  onStartForm,
  onStartAiQa,
  locationData,
  locationLoading,
  onResolveZip,
  engagementScore,
  routeContext,
}: ChoiceStepDispatcherProps) {
  // Track which variant is viewed
  useEffect(() => {
    trackEvent('choice_step_viewed', {
      panel_variant: variant,
      has_location_data: !!locationData,
      engagement_score: engagementScore,
      route_context_key: routeContext.key,
    });
  }, [variant, locationData, engagementScore, routeContext.key]);

  const VariantComponent = VARIANT_COMPONENTS[variant];

  return (
    <VariantComponent
      variant={variant}
      onCallClick={() => {
        trackEvent('choice_step_cta_clicked', {
          panel_variant: variant,
          cta_type: 'call',
        });
        onCallClick();
      }}
      onStartForm={() => {
        trackEvent('choice_step_cta_clicked', {
          panel_variant: variant,
          cta_type: 'form',
        });
        onStartForm();
      }}
      onStartAiQa={onStartAiQa}
      locationData={locationData}
      locationLoading={locationLoading}
      onResolveZip={onResolveZip}
      engagementScore={engagementScore}
      routeContext={routeContext}
    />
  );
}
