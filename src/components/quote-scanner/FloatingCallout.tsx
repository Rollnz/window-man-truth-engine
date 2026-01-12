import { cn } from '@/lib/utils';
import { DollarSign, AlertTriangle, XCircle, FileWarning } from 'lucide-react';

export type CalloutType = 'price' | 'warning' | 'missing' | 'legal';

interface FloatingCalloutProps {
  type: CalloutType;
  label: string;
  className?: string;
  /** Hide on mobile screens */
  hideMobile?: boolean;
}

const calloutConfig: Record<CalloutType, { 
  icon: typeof DollarSign; 
  borderColor: string; 
  iconColor: string;
  bgColor: string;
}> = {
  price: {
    icon: DollarSign,
    borderColor: 'border-l-emerald-500',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  missing: {
    icon: XCircle,
    borderColor: 'border-l-rose-500',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  legal: {
    icon: FileWarning,
    borderColor: 'border-l-primary',
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
  },
};

export function FloatingCallout({ 
  type, 
  label, 
  className,
  hideMobile = false 
}: FloatingCalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "absolute z-10 px-3 py-2 rounded-r-md border-l-2",
        "bg-background/90 backdrop-blur-sm shadow-lg",
        "flex items-center gap-2 text-xs font-medium",
        "animate-in fade-in slide-in-from-left-2 duration-500",
        config.borderColor,
        hideMobile && "hidden md:flex",
        className
      )}
    >
      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", config.bgColor)}>
        <Icon className={cn("w-3 h-3", config.iconColor)} />
      </div>
      <span className="text-foreground/90">{label}</span>
    </div>
  );
}
