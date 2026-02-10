import { cn } from '@/lib/utils';
import { DollarSign, AlertTriangle, XCircle, FileWarning } from 'lucide-react';

export type EnhancedCalloutType = 'price' | 'warning' | 'missing' | 'legal';

interface EnhancedFloatingCalloutProps {
  type: EnhancedCalloutType;
  /** Bold heading text */
  heading: string;
  /** Descriptive text (hidden on mobile) */
  description?: string;
  className?: string;
  /** Position from right side instead of left */
  fromRight?: boolean;
  /** Hide entire callout on mobile */
  hideMobile?: boolean;
  /** Staggered animation delay */
  animationDelay?: string;
}

const calloutConfig: Record<EnhancedCalloutType, { 
  icon: typeof DollarSign; 
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  headingColor: string;
  textColor: string;
}> = {
  price: {
    icon: DollarSign,
    bgColor: 'bg-rose-500 dark:bg-rose-600',
    iconBgColor: 'bg-white/20',
    iconColor: 'text-white',
    headingColor: 'text-white',
    textColor: 'text-white/80',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-400 dark:bg-amber-500',
    iconBgColor: 'bg-amber-900/20',
    iconColor: 'text-amber-900 dark:text-black',
    headingColor: 'text-amber-900 dark:text-black',
    textColor: 'text-amber-900/70 dark:text-black/70',
  },
  missing: {
    icon: XCircle,
    bgColor: 'bg-rose-600 dark:bg-rose-500',
    iconBgColor: 'bg-white/20',
    iconColor: 'text-white',
    headingColor: 'text-white',
    textColor: 'text-white/80',
  },
  legal: {
    icon: FileWarning,
    bgColor: 'bg-rose-500 dark:bg-rose-500',
    iconBgColor: 'bg-white/20',
    iconColor: 'text-white',
    headingColor: 'text-white',
    textColor: 'text-white/80',
  },
};

export function EnhancedFloatingCallout({ 
  type, 
  heading,
  description,
  className,
  fromRight = false,
  hideMobile = false,
  animationDelay,
}: EnhancedFloatingCalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "absolute px-3 py-2 shadow-lg",
        "flex items-start gap-2 max-w-[220px] md:max-w-[260px]",
        "animate-in fade-in duration-500 fill-mode-forwards",
        animationDelay ? "opacity-0" : "",
        config.bgColor,
        fromRight 
          ? "rounded-l-lg slide-in-from-right-2" 
          : "rounded-r-lg slide-in-from-left-2",
        hideMobile && "hidden md:flex",
        className
      )}
      style={animationDelay ? { animationDelay, animationFillMode: 'forwards' } : undefined}
    >
      {/* Icon container */}
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
        config.iconBgColor
      )}>
        <Icon className={cn("w-3.5 h-3.5", config.iconColor)} />
      </div>
      
      {/* Text content */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={cn("text-[11px] md:text-xs font-bold leading-tight", config.headingColor)}>
          {heading}
        </span>
        {description && (
          <span className={cn("text-[9px] md:text-[10px] leading-snug hidden md:block", config.textColor)}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
