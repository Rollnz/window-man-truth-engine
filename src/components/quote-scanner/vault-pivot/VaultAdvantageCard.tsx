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
  shadow: string;
  topBar: string;
  icon: string;
  iconBg: string;
  stepBadge: string;
}> = {
  blue: {
    border: 'border-slate-200 dark:border-sky-500/30 hover:border-sky-300 dark:hover:border-sky-500/50',
    shadow: 'shadow-md hover:shadow-lg dark:shadow-[0_0_25px_rgba(14,165,233,0.15)] dark:hover:shadow-[0_0_35px_rgba(14,165,233,0.25)]',
    topBar: 'before:bg-sky-500',
    icon: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-100 dark:bg-sky-500/10',
    stepBadge: 'bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  },
  amber: {
    border: 'border-slate-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50',
    shadow: 'shadow-md hover:shadow-lg dark:shadow-[0_0_25px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_0_35px_rgba(245,158,11,0.25)]',
    topBar: 'before:bg-amber-500',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-500/10',
    stepBadge: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  },
  emerald: {
    border: 'border-slate-200 dark:border-emerald-500/30 hover:border-emerald-300 dark:hover:border-emerald-500/50',
    shadow: 'shadow-md hover:shadow-lg dark:shadow-[0_0_25px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_0_35px_rgba(16,185,129,0.25)]',
    topBar: 'before:bg-emerald-500',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
    stepBadge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
};

/**
 * VaultAdvantageCard
 * Theme-aware card for the Blueprint Breakout section.
 * Light mode: Clean "Technical Schematic" with accent top-bar
 * Dark mode: "Cyberpunk Blueprint" with glowing borders
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
        // Glassmorphism base - theme-aware
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md',
        // Border - clean in light, glowing in dark
        'border dark:border-2 transition-all duration-300 hover:-translate-y-1',
        accent.border,
        accent.shadow,
        // Light mode: accent top-bar
        'before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl dark:before:hidden',
        accent.topBar,
        className
      )}
    >
      {/* Step number badge (visible on mobile) */}
      {stepNumber && (
        <div className={cn(
          'absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center',
          'text-sm font-bold md:hidden',
          accent.stepBadge
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
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      
      {/* Subtitle */}
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{subtitle}</p>
    </div>
  );
}
