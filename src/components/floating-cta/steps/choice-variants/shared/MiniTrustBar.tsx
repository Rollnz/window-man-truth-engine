import { CheckCircle2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniTrustBarProps {
  /** Stat text, e.g. "3,400+ Quotes Analyzed" */
  stat?: string;
  /** Risk reversal copy */
  riskReversal?: string;
  className?: string;
}

/**
 * MiniTrustBar - Compact trust row for the slide-over panel footer.
 * Shows a stat badge and risk-reversal microcopy.
 */
export function MiniTrustBar({
  stat = '3,400+ Quotes Analyzed',
  riskReversal = 'No spam. No pressure. 100% free.',
  className,
}: MiniTrustBarProps) {
  return (
    <div className={cn('space-y-2 pt-4', className)}>
      {stat && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-3 h-3 text-primary" />
          <span>{stat}</span>
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 inline mr-1" />
        {riskReversal}
      </p>
    </div>
  );
}
