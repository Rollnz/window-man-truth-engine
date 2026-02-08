import { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectedQuotes } from '@/hooks/useProjectedQuotes';
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
    container: 'bg-card border-border divide-border',
    icon: 'text-primary',
    count: 'text-foreground',
    label: 'text-muted-foreground',
    todayBg: 'bg-primary/5',
    todayDot: 'bg-primary',
    todayText: 'text-primary',
  },
  homepage: {
    container: 'bg-primary/5 border-primary/20 divide-primary/20',
    icon: 'text-primary',
    count: 'text-foreground',
    label: 'text-muted-foreground',
    todayBg: 'bg-primary/10',
    todayDot: 'bg-primary',
    todayText: 'text-primary',
  },
};

const sizeStyles = {
  sm: { padding: 'px-3 py-1.5', iconSize: 'w-3 h-3', text: 'text-xs', label: 'text-[10px]' },
  md: { padding: 'px-4 py-2.5', iconSize: 'w-4 h-4', text: 'text-sm', label: 'text-xs' },
  lg: { padding: 'px-5 py-3', iconSize: 'w-5 h-5', text: 'text-base', label: 'text-sm' },
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
  const { total, today } = useProjectedQuotes();

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
        'inline-flex items-center divide-x rounded-lg border overflow-hidden',
        styles.container
      )}>
        {/* Left: Total Count */}
        <div className={cn('flex items-center gap-2', sizes.padding)}>
          <Shield className={cn(sizes.iconSize, styles.icon)} />
          <span className={cn('font-bold tabular-nums', sizes.text, styles.count)}>
            {totalCount.toLocaleString()}
          </span>
          <span className={cn(sizes.label, styles.label)}>quotes scanned</span>
        </div>

        {/* Right: Today Count (optional) */}
        {showToday && (
          <div className={cn('flex items-center gap-2 h-full', sizes.padding, styles.todayBg)}>
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
