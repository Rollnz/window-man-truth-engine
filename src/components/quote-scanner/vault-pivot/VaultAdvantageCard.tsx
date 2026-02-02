import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface VaultAdvantageCardProps {
  microLabel: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  className?: string;
}

/**
 * VaultAdvantageCard
 * Single advantage card for the "Achilles Heel" stack.
 * Soft border, subtle elevation on hover, muted line icons only.
 */
export function VaultAdvantageCard({ 
  microLabel, 
  title, 
  subtitle, 
  icon: Icon,
  className 
}: VaultAdvantageCardProps) {
  return (
    <div 
      className={cn(
        'group p-6 rounded-xl border border-border/40 bg-card/50',
        'transition-all duration-300 ease-out',
        'hover:border-border/60 hover:bg-card hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      {/* Micro-label */}
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mb-3 block">
        {microLabel}
      </span>
      
      {/* Icon + Title row */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="text-lg font-semibold text-foreground leading-tight">
          {title}
        </h3>
      </div>
      
      {/* Subtitle */}
      <p className="text-sm text-muted-foreground leading-relaxed pl-11">
        {subtitle}
      </p>
    </div>
  );
}
