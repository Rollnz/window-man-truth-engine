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
  /** Animation delay in milliseconds */
  animationDelay?: number;
  /** Whether callout is visible (for staggered reveals) */
  isVisible?: boolean;
}

const calloutConfig: Record<EnhancedCalloutType, { 
  icon: typeof DollarSign; 
  borderColor: string;
  borderColorRight: string;
  iconColor: string;
  bgColor: string;
  headingColor: string;
}> = {
  price: {
    icon: DollarSign,
    borderColor: 'border-l-emerald-500',
    borderColorRight: 'border-r-emerald-500',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    headingColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-l-amber-500',
    borderColorRight: 'border-r-amber-500',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    headingColor: 'text-amber-600 dark:text-amber-400',
  },
  missing: {
    icon: XCircle,
    borderColor: 'border-l-rose-500',
    borderColorRight: 'border-r-rose-500',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    headingColor: 'text-rose-600 dark:text-rose-400',
  },
  legal: {
    icon: FileWarning,
    borderColor: 'border-l-primary',
    borderColorRight: 'border-r-primary',
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
    headingColor: 'text-primary',
  },
};

export function EnhancedFloatingCallout({ 
  type, 
  heading,
  description,
  className,
  fromRight = false,
  hideMobile = false,
  animationDelay = 0,
  isVisible = true,
}: EnhancedFloatingCalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute z-10 px-3 py-2 border-2",
        "bg-background/95 backdrop-blur-sm shadow-lg",
        "flex items-start gap-2",
        // Animation
        fromRight ? "callout-reveal-right" : "callout-reveal",
        // Border and rounding based on side
        fromRight 
          ? cn("rounded-l-md border-r-0", config.borderColorRight, "border-l-0 border-t border-b")
          : cn("rounded-r-md border-l-2 border-r-0 border-t-0 border-b-0", config.borderColor),
        // Visibility on mobile
        hideMobile && "hidden md:flex",
        className
      )}
      style={{ 
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {/* Icon container */}
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
        config.bgColor
      )}>
        <Icon className={cn("w-3.5 h-3.5", config.iconColor)} />
      </div>
      
      {/* Text content */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={cn("text-xs font-semibold leading-tight", config.headingColor)}>
          {heading}
        </span>
        {description && (
          <span className="text-[10px] md:text-xs text-muted-foreground leading-snug hidden md:block">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
