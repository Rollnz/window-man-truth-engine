import { cn } from '@/lib/utils';

interface ImpactWindowCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ImpactWindowCard
 * Wraps content in a realistic impact window frame + glass effect.
 * Uses fixed dark aesthetic regardless of theme.
 */
export function ImpactWindowCard({ children, className }: ImpactWindowCardProps) {
  return (
    <div className={cn("impact-window-frame", className)}>
      <div className="impact-window-glass">
        <div className="impact-window-content">
          {children}
        </div>
      </div>
    </div>
  );
}
