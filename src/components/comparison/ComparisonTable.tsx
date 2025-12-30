import { Check, X, Award } from 'lucide-react';
import { WindowTier, windowTiers, comparisonFeatures } from '@/data/windowData';
import { TrueCostBreakdown } from '@/lib/comparisonCalculations';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { ViewMode } from './ViewModeToggle';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  viewMode: ViewMode;
  windowCount: number;
  trueCosts: Record<string, TrueCostBreakdown>;
}

function getSecurityBadge(rating: string) {
  const colors: Record<string, string> = {
    'Basic': 'bg-destructive/20 text-destructive',
    'Moderate': 'bg-warning/20 text-warning',
    'Hurricane-Rated': 'bg-success/20 text-success',
  };
  return colors[rating] || 'bg-muted text-muted-foreground';
}

function TierHeader({ tier }: { tier: WindowTier }) {
  return (
    <th 
      className={cn(
        "p-4 text-left border-b border-border",
        tier.isRecommended && "bg-primary/10 border-primary/30"
      )}
    >
      <div className="flex flex-col gap-1">
        {tier.isRecommended && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-1">
            <Award className="w-3 h-3" />
            RECOMMENDED
          </span>
        )}
        <span className="font-bold text-lg">{tier.name}</span>
        <span className="text-sm text-muted-foreground">{tier.subtitle}</span>
      </div>
    </th>
  );
}

function PriceRow({ 
  viewMode, 
  tiers, 
  windowCount, 
  trueCosts 
}: { 
  viewMode: ViewMode; 
  tiers: WindowTier[]; 
  windowCount: number;
  trueCosts: Record<string, TrueCostBreakdown>;
}) {
  return (
    <tr className="border-b border-border bg-muted/30">
      <td className="p-4 font-semibold">
        {viewMode === 'upfront' ? 'Upfront Price' : '10-Year True Cost'}
      </td>
      {tiers.map((tier) => {
        const cost = viewMode === 'upfront' 
          ? tier.upfrontCostPerWindow * windowCount
          : trueCosts[tier.id]?.trueCost10Year || 0;
        
        return (
          <td 
            key={tier.id}
            className={cn(
              "p-4 font-bold text-2xl",
              tier.isRecommended && "bg-primary/10 text-primary"
            )}
          >
            <AnimatedNumber value={cost} prefix="$" duration={800} />
          </td>
        );
      })}
    </tr>
  );
}

function FeatureRow({ 
  feature, 
  tiers 
}: { 
  feature: typeof comparisonFeatures[0]; 
  tiers: WindowTier[];
}) {
  const getValueDisplay = (tier: WindowTier) => {
    switch (feature.id) {
      case 'uFactor':
        return tier.uFactor;
      case 'shgc':
        return tier.shgc;
      case 'estimatedLifespan':
        return `${tier.estimatedLifespan}+ years`;
      case 'warrantyParts':
        return tier.warrantyParts;
      case 'warrantyLabor':
        return tier.warrantyLabor;
      case 'securityRating':
        return (
          <span className={cn("px-2 py-1 rounded text-xs font-medium", getSecurityBadge(tier.securityRating))}>
            {tier.securityRating}
          </span>
        );
      case 'replacementNeeded':
        return tier.replacementNeededInYear ? (
          <span className="flex items-center gap-1 text-destructive">
            <X className="w-4 h-4" />
            Year {tier.replacementNeededInYear}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-success">
            <Check className="w-4 h-4" />
            Never
          </span>
        );
      default:
        return '-';
    }
  };

  // Determine which tier has the best value for this feature
  const getBestTierId = () => {
    if (feature.id === 'uFactor' || feature.id === 'shgc') {
      // Lower is better
      return tiers.reduce((best, tier) => 
        parseFloat(tier[feature.id as keyof WindowTier] as string) < 
        parseFloat(best[feature.id as keyof WindowTier] as string) ? tier : best
      ).id;
    }
    if (feature.id === 'estimatedLifespan') {
      return tiers.reduce((best, tier) => 
        tier.estimatedLifespan > best.estimatedLifespan ? tier : best
      ).id;
    }
    if (feature.id === 'replacementNeeded') {
      return tiers.find(t => !t.replacementNeededInYear)?.id || 'tier3';
    }
    // Default to tier3 for warranty/security
    return 'tier3';
  };

  const bestTierId = getBestTierId();

  return (
    <tr className="border-b border-border">
      <td className="p-4">
        <div>
          <span className="font-medium">{feature.label}</span>
          {feature.description && (
            <span className="block text-xs text-muted-foreground">{feature.description}</span>
          )}
        </div>
      </td>
      {tiers.map((tier) => (
        <td 
          key={tier.id}
          className={cn(
            "p-4",
            tier.isRecommended && "bg-primary/10",
            tier.id === bestTierId && "font-semibold"
          )}
        >
          <div className="flex items-center gap-2">
            {getValueDisplay(tier)}
            {tier.id === bestTierId && (
              <Check className="w-4 h-4 text-success" />
            )}
          </div>
        </td>
      ))}
    </tr>
  );
}

export function ComparisonTable({ viewMode, windowCount, trueCosts }: ComparisonTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="p-4 text-left border-b border-border w-1/4">
              <span className="font-semibold">Feature</span>
            </th>
            {windowTiers.map((tier) => (
              <TierHeader key={tier.id} tier={tier} />
            ))}
          </tr>
        </thead>
        <tbody>
          <PriceRow 
            viewMode={viewMode} 
            tiers={windowTiers} 
            windowCount={windowCount}
            trueCosts={trueCosts}
          />
          {comparisonFeatures.map((feature) => (
            <FeatureRow key={feature.id} feature={feature} tiers={windowTiers} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
