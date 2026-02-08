import React from 'react';
import { Compass, TrendingUp, ShieldCheck } from 'lucide-react';
import { VaultAdvantageCard } from './VaultAdvantageCard';
import { cn } from '@/lib/utils';

const advantages = [
  {
    microLabel: 'Control',
    title: 'Project Blueprint',
    subtitle: 'Build your scope once — so every quote you get is comparable and fair.',
    icon: Compass,
    accentColor: 'blue' as const,
  },
  {
    microLabel: 'Advantage',
    title: 'Insider Leverage',
    subtitle: "See the pricing ranges and margin traps contractors don't usually share.",
    icon: TrendingUp,
    accentColor: 'amber' as const,
  },
  {
    microLabel: 'Safety',
    title: 'Regret Shield',
    subtitle: 'Lock in your project now — so nothing feels rushed, forgotten, or "different later."',
    icon: ShieldCheck,
    accentColor: 'emerald' as const,
  },
];

/**
 * VaultAdvantageGrid
 * 3-pillar glassmorphism card grid with mobile connectors.
 */
export function VaultAdvantageGrid() {
  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        {advantages.map((advantage, index) => (
          <React.Fragment key={advantage.title}>
            <VaultAdvantageCard
              microLabel={advantage.microLabel}
              title={advantage.title}
              subtitle={advantage.subtitle}
              icon={advantage.icon}
              accentColor={advantage.accentColor}
              stepNumber={index + 1}
            />
            {/* Mobile connector (not after last card) */}
            {index < advantages.length - 1 && (
              <div className="flex md:hidden justify-center py-1">
                <div className={cn(
                  'w-px h-4',
                  index === 0 
                    ? 'bg-gradient-to-b from-sky-500/50 to-amber-500/50' 
                    : 'bg-gradient-to-b from-amber-500/50 to-emerald-500/50'
                )} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
