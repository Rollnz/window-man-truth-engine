import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import type { buttonVariants } from '@/components/ui/button';

interface CtaCardProps {
  icon: ReactNode;
  label: string;
  subtext?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cta' | 'destructive';
  className?: string;
  /** Extra content rendered below the button (e.g., LocationBadge) */
  children?: ReactNode;
}

const buttonVariantMap: Record<
  NonNullable<CtaCardProps['variant']>,
  VariantProps<typeof buttonVariants>['variant']
> = {
  primary: 'default',
  secondary: 'secondary-action',
  outline: 'outline',
  ghost: 'ghost',
  cta: 'cta',
  destructive: 'destructive',
};

/**
 * CtaCard - Reusable CTA card for the slide-over choice step.
 * Renders an icon, label, optional subtext, and a full-width button.
 */
export function CtaCard({
  icon,
  label,
  subtext,
  onClick,
  variant = 'outline',
  className,
  children,
}: CtaCardProps) {
  const cardBg =
    variant === 'primary' || variant === 'cta'
      ? 'bg-primary/5 border-primary/20'
      : variant === 'destructive'
        ? 'bg-destructive/5 border-destructive/20'
        : 'bg-muted/30 border-border';

  return (
    <div className={cn('rounded-lg border p-4', cardBg, className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 p-2.5 rounded-full',
            variant === 'primary' || variant === 'cta'
              ? 'bg-primary/10'
              : variant === 'destructive'
                ? 'bg-destructive/10'
                : 'bg-muted'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <Button
            onClick={onClick}
            variant={buttonVariantMap[variant]}
            size="lg"
            className="w-full mb-1"
          >
            {label}
          </Button>
          {subtext && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              {subtext}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
