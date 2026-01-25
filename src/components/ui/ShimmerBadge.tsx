import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_MODEL_CONFIG } from '@/config/aiModel';
import type { LucideIcon } from 'lucide-react';

interface ShimmerBadgeProps {
  /** Custom text to display. Defaults to "AI - Powered by {MODEL_NAME}" */
  text?: string;
  /** Show AI model name from config. Default: true */
  showModelName?: boolean;
  /** Custom icon. Default: Sparkles */
  icon?: LucideIcon;
  /** Hide the icon entirely */
  hideIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Color variant */
  variant?: 'primary' | 'destructive' | 'success' | 'dossier';
}

const variantStyles = {
  primary: 'bg-primary/10 border-primary/20 text-primary',
  destructive: 'bg-destructive/10 border-destructive/20 text-destructive',
  success: 'bg-success/10 border-success/20 text-success',
  dossier: 'bg-[hsl(var(--dossier-primary)/0.1)] border-[hsl(var(--dossier-primary)/0.2)] text-[hsl(var(--dossier-primary))]',
};

/**
 * ShimmerBadge - Animated AI-powered badge with sweeping shimmer effect
 * 
 * Use this component for consistent AI branding across tool hero sections.
 * The shimmer animation creates visual interest and signals AI capabilities.
 */
export function ShimmerBadge({
  text,
  showModelName = true,
  icon: Icon = Sparkles,
  hideIcon = false,
  className,
  variant = 'primary',
}: ShimmerBadgeProps) {
  const displayText = text ?? (showModelName 
    ? `AI - Powered by ${AI_MODEL_CONFIG.displayName}` 
    : 'Powered by AI');

  return (
    <div
      className={cn(
        'badge-shimmer inline-flex items-center gap-2 px-4 py-1.5',
        'text-[11px] font-semibold uppercase tracking-widest',
        'border rounded-full',
        variantStyles[variant],
        className
      )}
    >
      {!hideIcon && <Icon className="w-3 h-3 relative z-10" />}
      <span className="relative z-10">{displayText}</span>
    </div>
  );
}
