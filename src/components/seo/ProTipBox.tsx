import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProTipBoxProps {
  title: string;
  description: string;
  linkTo: string;
  linkText: string;
  variant?: 'default' | 'warning' | 'success';
  className?: string;
}

/**
 * ProTipBox - Semantic internal linking component for guides
 * 
 * Used to create contextual links from guides to tools following
 * the "Guides → Tools" linking law of the semantic authority system.
 * 
 * @example
 * <ProTipBox
 *   title="Already have a quote?"
 *   description="Scan it for hidden fees and pressure tactics before you sign."
 *   linkTo="/ai-scanner"
 *   linkText="Scan your quote now"
 * />
 */
const ProTipBox: React.FC<ProTipBoxProps> = ({
  title,
  description,
  linkTo,
  linkText,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-primary/5 border-primary/20 text-primary',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  };

  const iconColor = {
    default: 'text-primary',
    warning: 'text-amber-500',
    success: 'text-emerald-500',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 sm:p-5 my-6',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', iconColor[variant])}>
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground mb-1">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            {description}
          </p>
          <Link
            to={linkTo}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline',
              iconColor[variant]
            )}
          >
            {linkText}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProTipBox;
