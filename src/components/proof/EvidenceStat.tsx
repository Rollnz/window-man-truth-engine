import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface EvidenceStatProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  note?: string;
  variant?: 'primary' | 'neutral' | 'success';
  showVerified?: boolean;
  animate?: boolean;
}

/**
 * EvidenceStat - Reusable stat tile with optional count-up animation
 * Respects prefers-reduced-motion
 */
export function EvidenceStat({
  label,
  value,
  prefix = '',
  suffix = '',
  note,
  variant = 'primary',
  showVerified = false,
  animate = true,
}: EvidenceStatProps) {
  const [displayValue, setDisplayValue] = useState<string | number>(animate ? 0 : value);
  const [hasAnimated, setHasAnimated] = useState(false);
  const statRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (!animate || prefersReducedMotion || hasAnimated) {
      setDisplayValue(value);
      return;
    }

    const stat = statRef.current;
    if (!stat) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            
            // Only animate numeric values
            const numericValue = typeof value === 'number' 
              ? value 
              : parseFloat(String(value).replace(/[^0-9.]/g, ''));

            if (!isNaN(numericValue)) {
              const duration = 900;
              const startTime = performance.now();
              
              const animateCount = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(numericValue * easeOut);
                
                setDisplayValue(current);
                
                if (progress < 1) {
                  requestAnimationFrame(animateCount);
                } else {
                  setDisplayValue(value);
                }
              };
              
              requestAnimationFrame(animateCount);
            } else {
              setDisplayValue(value);
            }
            
            observer.unobserve(stat);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(stat);
    return () => observer.disconnect();
  }, [value, animate, hasAnimated, prefersReducedMotion]);

  const variantStyles = {
    primary: 'text-primary',
    neutral: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
  };

  return (
    <div
      ref={statRef}
      className={cn(
        'flex flex-col items-center p-6 rounded-xl',
        'bg-card border border-border',
        'transition-all duration-300',
        'hover:border-primary/30 hover:shadow-sm'
      )}
    >
      {/* Value */}
      <div className={cn(
        'text-3xl md:text-4xl font-bold mb-2',
        variantStyles[variant]
      )}>
        {prefix}{displayValue}{suffix}
      </div>
      
      {/* Label */}
      <div className="text-sm text-muted-foreground text-center mb-1">
        {label}
      </div>
      
      {/* Note */}
      {note && (
        <div className="text-xs text-muted-foreground/70 text-center mt-1">
          {note}
        </div>
      )}
      
      {/* Verified badge */}
      {showVerified && (
        <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Verified</span>
        </div>
      )}
    </div>
  );
}
