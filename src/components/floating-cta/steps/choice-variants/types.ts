import type { PanelVariant } from '@/hooks/usePanelVariant';
import type { AiQaMode } from '@/lib/panelVariants';
import type { LocationPersonalization } from '@/hooks/useLocationPersonalization';
import type { RouteContext } from '@/lib/routeContext';

/**
 * Shared props contract for all choice-step variant components.
 */
export interface ChoiceVariantProps {
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
