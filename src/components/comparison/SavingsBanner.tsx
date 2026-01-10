import { TrendingDown } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { TrueCostBreakdown } from '@/lib/comparisonCalculations';

interface SavingsBannerProps {
  tier1Cost: TrueCostBreakdown;
  tier3Cost: TrueCostBreakdown;
}

export function SavingsBanner({ tier1Cost, tier3Cost }: SavingsBannerProps) {
  const savings = tier1Cost.trueCost10Year - tier3Cost.trueCost10Year;

  if (savings <= 0) return null;

  return (
    <div className="my-8 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">The "Cheap" Windows Cost More</h3>
            <p className="text-sm text-muted-foreground">
              Tier 1's "cheapest bid" actually costs you{' '}
              <span 
                className="text-emerald-500 font-bold"
                style={{ textShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }}
              >
                <AnimatedNumber value={savings} prefix="$" />
              </span>
              {' '}more over 10 years than our high-performance option.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
