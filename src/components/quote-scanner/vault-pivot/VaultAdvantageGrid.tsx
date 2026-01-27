import { FileText, Eye, Shield } from 'lucide-react';
import { VaultAdvantageCard } from './VaultAdvantageCard';

const advantages = [
  {
    microLabel: 'Control',
    title: 'Project Blueprint',
    subtitle: 'Build your scope once — so every quote you get is comparable and fair.',
    icon: FileText,
  },
  {
    microLabel: 'Advantage',
    title: 'Insider Leverage',
    subtitle: "See the pricing ranges and margin traps contractors don't usually share.",
    icon: Eye,
  },
  {
    microLabel: 'Safety',
    title: 'Regret Shield',
    subtitle: 'Lock in your project now — so nothing feels rushed, forgotten, or "different later."',
    icon: Shield,
  },
];

/**
 * VaultAdvantageGrid
 * 3-card "Achilles Heel" stack.
 * Vertical on mobile, horizontal on desktop.
 */
export function VaultAdvantageGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      {advantages.map((advantage) => (
        <VaultAdvantageCard
          key={advantage.title}
          microLabel={advantage.microLabel}
          title={advantage.title}
          subtitle={advantage.subtitle}
          icon={advantage.icon}
        />
      ))}
    </div>
  );
}
