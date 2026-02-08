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
  tab: string;
  stamp: string;
  icon: string;
  iconBg: string;
  folderBorder: string;
}> = {
  blue: {
    tab: 'bg-sky-500',
    stamp: 'border-sky-500/50 text-sky-700 dark:border-sky-400/50 dark:text-sky-400',
    icon: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-100 dark:bg-sky-500/20',
    folderBorder: 'border-stone-200 dark:border-emerald-500/20',
  },
  amber: {
    tab: 'bg-amber-500',
    stamp: 'border-amber-500/50 text-amber-700 dark:border-amber-400/50 dark:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    folderBorder: 'border-stone-200 dark:border-emerald-500/20',
  },
  emerald: {
    tab: 'bg-emerald-500',
    stamp: 'border-emerald-500/50 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-400',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    folderBorder: 'border-stone-200 dark:border-emerald-500/20',
  },
};

/**
 * VaultAdvantageCard
 * "Tactical Dossier" folder-style card for the War Room section.
 * Light mode: Manila folder with paper shadow
 * Dark mode: Dark folder with green edge glow
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
    <div className={cn('relative group pt-3', className)}>
      {/* Folder Tab */}
      {stepNumber && (
        <div className={cn(
          'absolute -top-0 left-4 px-3 py-1 rounded-t-md text-xs font-bold text-white z-10',
          accent.tab
        )}>
          {stepNumber}
        </div>
      )}
      
      {/* Main Folder Body */}
      <div className={cn(
        'p-5 md:p-6 rounded-lg border-2 transition-all duration-300',
        'md:hover:rotate-1 md:hover:-translate-y-1',
        // Folder background
        'bg-white dark:bg-stone-900/80',
        accent.folderBorder,
        // Light mode: paper shadow
        'shadow-[4px_4px_0_rgba(0,0,0,0.08)]',
        // Dark mode: green edge glow
        'dark:shadow-[0_0_20px_rgba(34,197,94,0.15)]'
      )}>
        {/* Classified Stamp */}
        <div className={cn(
          'inline-block px-2 py-0.5 mb-3 border border-dashed rounded text-[10px] font-mono uppercase tracking-wider',
          accent.stamp
        )}>
          [{microLabel}]
        </div>
        
        {/* Icon */}
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-3', accent.iconBg)}>
          <Icon className={cn('w-6 h-6', accent.icon)} />
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">{title}</h3>
        
        {/* Subtitle */}
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}
