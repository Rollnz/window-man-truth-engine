import { Link } from 'react-router-dom';
import { FlaskConical, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MethodologyBadgeProps {
  className?: string;
  /** Whether to show as inline link or block card */
  variant?: 'inline' | 'card';
}

/**
 * MethodologyBadge Component
 * 
 * Links to the About page's methodology section.
 * Establishes trust by showing users how our data is verified.
 */
export function MethodologyBadge({ className, variant = 'inline' }: MethodologyBadgeProps) {
  const href = '/about#methodology';

  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={href}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "text-xs font-medium",
                "bg-primary/10 text-primary",
                "border border-primary/20",
                "hover:bg-primary/20 hover:border-primary/40",
                "transition-colors",
                className
              )}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Methodology Verified</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">
              Results generated using Florida-specific data, Miami-Dade code requirements, 
              and verified industry averages. Click to learn more.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Card variant for sidebar/footer placement
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-primary/5 border border-primary/20",
        "hover:bg-primary/10 hover:border-primary/30",
        "transition-all group",
        className
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <FlaskConical className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          Methodology Verified
        </p>
        <p className="text-xs text-muted-foreground">
          See how we calculate results
        </p>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

export default MethodologyBadge;
