import * as React from 'react';
import { cn } from '@/lib/utils';

interface ImpactWindowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * ImpactWindowCard
 * Wraps content in a realistic impact window frame + glass effect.
 * Uses fixed dark aesthetic regardless of theme.
 * Supports ref forwarding for tooltip triggers.
 */
const ImpactWindowCard = React.forwardRef<HTMLDivElement, ImpactWindowCardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("impact-window-frame", className)} {...props}>
        <div className="impact-window-glass">
          <div className="impact-window-content">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

ImpactWindowCard.displayName = 'ImpactWindowCard';

export { ImpactWindowCard };
