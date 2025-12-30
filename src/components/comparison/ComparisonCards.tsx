import { useState } from 'react';
import { Check, X, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { WindowTier, windowTiers, comparisonFeatures } from '@/data/windowData';
import { TrueCostBreakdown } from '@/lib/comparisonCalculations';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { ViewMode } from './ViewModeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComparisonCardsProps {
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

function TierCard({ 
  tier, 
  viewMode, 
  windowCount, 
  trueCost 
}: { 
  tier: WindowTier; 
  viewMode: ViewMode; 
  windowCount: number;
  trueCost: TrueCostBreakdown;
}) {
  const price = viewMode === 'upfront' 
    ? tier.upfrontCostPerWindow * windowCount
    : trueCost.trueCost10Year;

  const getValueDisplay = (featureId: string) => {
    switch (featureId) {
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

  return (
    <div 
      className={cn(
        "rounded-xl border p-6 transition-all",
        tier.isRecommended 
          ? "bg-primary/10 border-primary glow-sm" 
          : "bg-card border-border"
      )}
    >
      {/* Header */}
      <div className="text-center mb-6">
        {tier.isRecommended && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-2">
            <Award className="w-3 h-3" />
            RECOMMENDED
          </span>
        )}
        <h3 className="text-xl font-bold">{tier.name}</h3>
        <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-6 pb-6 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase mb-1">
          {viewMode === 'upfront' ? 'Upfront Price' : '10-Year True Cost'}
        </p>
        <p className={cn(
          "text-3xl font-bold",
          tier.isRecommended && "text-primary text-glow"
        )}>
          <AnimatedNumber value={price} prefix="$" duration={800} />
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4">
        {comparisonFeatures.map((feature) => (
          <div key={feature.id} className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{feature.label}</span>
            <span className="text-sm font-medium">{getValueDisplay(feature.id)}</span>
          </div>
        ))}
      </div>

      {/* Pros/Cons */}
      <div className="mt-6 pt-6 border-t border-border space-y-3">
        {tier.features.slice(0, 3).map((feature, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </div>
        ))}
        {tier.cons.slice(0, 2).map((con, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{con}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonCards({ viewMode, windowCount, trueCosts }: ComparisonCardsProps) {
  const [activeIndex, setActiveIndex] = useState(2); // Start on Tier 3 (recommended)

  const goToPrev = () => setActiveIndex((prev) => Math.max(0, prev - 1));
  const goToNext = () => setActiveIndex((prev) => Math.min(windowTiers.length - 1, prev + 1));

  const activeTier = windowTiers[activeIndex];

  return (
    <div className="md:hidden">
      {/* Tab navigation */}
      <div className="flex gap-2 mb-6">
        {windowTiers.map((tier, index) => (
          <button
            key={tier.id}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors",
              index === activeIndex
                ? tier.isRecommended
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {tier.id === 'tier1' ? 'Tier 1' : tier.id === 'tier2' ? 'Tier 2' : 'Tier 3'}
          </button>
        ))}
      </div>

      {/* Active card */}
      <TierCard
        tier={activeTier}
        viewMode={viewMode}
        windowCount={windowCount}
        trueCost={trueCosts[activeTier.id]}
      />

      {/* Swipe controls */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrev}
          disabled={activeIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {activeIndex + 1} of {windowTiers.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          disabled={activeIndex === windowTiers.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
