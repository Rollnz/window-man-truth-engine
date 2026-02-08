import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type AccentColor = 'blue' | 'amber' | 'emerald';

interface VaultAdvantageCardProps {
  microLabel: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accentColor: AccentColor;
  stepNumber?: number;
  className?: string;
}

const accentMap: Record<AccentColor, {
  border: string;
  glow: string;
  icon: string;
  iconBg: string;
}> = {
  blue: {
    border: 'border-sky-500/30 hover:border-sky-500/50',
    glow: 'shadow-[0_0_25px_rgba(14,165,233,0.15)] hover:shadow-[0_0_35px_rgba(14,165,233,0.25)]',
    icon: 'text-sky-400',
    iconBg: 'bg-sky-500/10',
  },
  amber: {
    border: 'border-amber-500/30 hover:border-amber-500/50',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.15)] hover:shadow-[0_0_35px_rgba(245,158,11,0.25)]',
    icon: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
  emerald: {
    border: 'border-emerald-500/30 hover:border-emerald-500/50',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)]',
    icon: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
  },
};

/**
 * VaultAdvantageCard
 * Glassmorphism card for the Blueprint Breakout section.
 * Features accent-colored borders, glow effects, and mobile step numbers.
 */
export function VaultAdvantageCard({ 
  microLabel, 
  title, 
  subtitle, 
  icon: Icon,
  accentColor,
  stepNumber,
  className 
}: VaultAdvantageCardProps) {
  const accent = accentMap[accentColor];

  return (
    <div 
      className={cn(
        'group relative p-5 md:p-8 rounded-2xl overflow-hidden',
        // Glassmorphism base
        'bg-slate-900/80 backdrop-blur-sm',
        // Border and glow
        'border-2 transition-all duration-300 hover:-translate-y-1',
        accent.border,
        accent.glow,
        className
      )}
    >
      {/* Step number badge (visible on mobile) */}
      {stepNumber && (
        <div className={cn(
          'absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center',
          'text-sm font-bold md:hidden',
          accent.iconBg, accent.icon
        )}>
          {stepNumber}
        </div>
      )}
      
      {/* Large icon */}
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', accent.iconBg)}>
        <Icon className={cn('w-7 h-7', accent.icon)} />
      </div>
      
      {/* Micro-label */}
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
        {microLabel}
      </span>
      
      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      
      {/* Subtitle */}
      <p className="text-sm text-slate-400 leading-relaxed">{subtitle}</p>
    </div>
  );
}
