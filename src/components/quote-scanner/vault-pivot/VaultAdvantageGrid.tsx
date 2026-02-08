import React from 'react';
import { Compass, TrendingUp, ShieldCheck } from 'lucide-react';
import { VaultAdvantageCard } from './VaultAdvantageCard';

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
 * Tactical Dossiers grid with folder-style cards.
 */
export function VaultAdvantageGrid() {
  return (
    <div className="mt-10">
      {/* Section Header */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-px w-12 bg-stone-300 dark:bg-stone-700" />
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500">
          Tactical Dossiers
        </span>
        <div className="h-px w-12 bg-stone-300 dark:bg-stone-700" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
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
            {/* Mobile tactical connector (not after last card) */}
            {index < advantages.length - 1 && (
              <div className="flex md:hidden justify-center py-2">
                <div className="w-px h-6 border-l-2 border-dashed border-stone-300 dark:border-emerald-500/30" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
