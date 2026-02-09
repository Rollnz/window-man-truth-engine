import { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTickerStats } from '@/hooks/useTickerStats';
import { useCountUp } from './useCountUp';

type TickerVariant = 'cyberpunk' | 'minimal' | 'homepage';
type TickerSize = 'sm' | 'md' | 'lg';

interface UrgencyTickerProps {
  /** Visual style preset */
  variant?: TickerVariant;
  /** Show/hide the "+X today" section */
  showToday?: boolean;
  /** Enable/disable count-up animation */
  animated?: boolean;
  /** Size preset */
  size?: TickerSize;
  /** Additional classes */
  className?: string;
}

const variantStyles = {
  cyberpunk: {
    container: 'bg-zinc-900/70 border-zinc-700/40 divide-zinc-700/50 backdrop-blur-sm ring-1 ring-white/5 shadow-xl',
    icon: 'text-emerald-400',
    count: 'text-zinc-100',
    label: 'text-zinc-400',
    todayBg: 'bg-amber-500/10',
    todayDot: 'bg-amber-400',
    todayText: 'text-amber-300',
  },
  minimal: {
    container: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 divide-slate-200 dark:divide-slate-700',
    icon: 'text-primary',
    count: 'text-slate-900 dark:text-slate-100',
    label: 'text-slate-600 dark:text-slate-400',
    todayBg: 'bg-sky-100 dark:bg-sky-900/50',
    todayDot: 'bg-primary',
    todayText: 'text-sky-600 dark:text-sky-400',
  },
  homepage: {
    container: 'bg-sky-50 dark:bg-slate-800/90 border-sky-200 dark:border-slate-700 divide-sky-200 dark:divide-slate-700 shadow-sm',
    icon: 'text-sky-500 dark:text-sky-400',
    count: 'text-slate-900 dark:text-slate-100',
    label: 'text-slate-600 dark:text-slate-400',
    todayBg: 'bg-sky-100 dark:bg-sky-900/40',
    todayDot: 'bg-sky-500',
    todayText: 'text-sky-600 dark:text-sky-400',
  },
};

const sizeStyles = {
  sm: { padding: 'px-2 py-1 sm:px-3 sm:py-1.5', iconSize: 'w-3 h-3', text: 'text-[10px] sm:text-xs', label: 'text-[9px] sm:text-[10px]' },
  md: { padding: 'px-2.5 py-1.5 sm:px-4 sm:py-2.5', iconSize: 'w-3.5 h-3.5 sm:w-4 sm:h-4', text: 'text-xs sm:text-sm', label: 'text-[10px] sm:text-xs' },
  lg: { padding: 'px-3 py-2 sm:px-5 sm:py-3', iconSize: 'w-4 h-4 sm:w-5 sm:h-5', text: 'text-sm sm:text-base', label: 'text-xs sm:text-sm' },
};

export function UrgencyTicker({
  variant = 'cyberpunk',
  showToday = true,
  animated = true,
  size = 'md',
  className,
}: UrgencyTickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!animated);
  const { total, today } = useTickerStats();

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  // IntersectionObserver for animation trigger
  useEffect(() => {
    if (!animated) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animated]);

  const totalCount = useCountUp(isVisible ? total : 0, 2500);
  const todayCount = useCountUp(isVisible && showToday ? today : 0, 2500);

  return (
    <div ref={ref} className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'inline-flex items-center divide-x rounded-lg border overflow-hidden whitespace-nowrap',
        styles.container
      )}>
        {/* Left: Total Count */}
        <div className={cn('flex items-center gap-1.5 sm:gap-2 flex-shrink-0', sizes.padding)}>
          <Shield className={cn(sizes.iconSize, styles.icon)} />
          <span className={cn('font-bold tabular-nums', sizes.text, styles.count)}>
            {totalCount.toLocaleString()}
          </span>
          <span className={cn(sizes.label, styles.label)}>quotes scanned</span>
        </div>

        {/* Right: Today Count (optional) */}
        {showToday && (
          <div className={cn('flex items-center gap-1.5 sm:gap-2 h-full flex-shrink-0', sizes.padding, styles.todayBg)}>
            <div className="relative flex h-2 w-2">
              <span className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                styles.todayDot
              )} />
              <span className={cn('relative inline-flex rounded-full h-2 w-2', styles.todayDot)} />
            </div>
            <span className={cn('font-semibold tabular-nums', sizes.text, styles.todayText)}>
              +{todayCount} today
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
