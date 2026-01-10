import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before animation starts after element is visible */
  delay?: number;
  /** Animation duration in ms */
  duration?: number;
  /** How much of the element must be visible to trigger (0-1) */
  threshold?: number;
}

/**
 * AnimateOnScroll
 * Wraps content with a fade-in + slide-up animation triggered when scrolled into view.
 * Uses Intersection Observer for performance.
 */
export function AnimateOnScroll({ 
  children, 
  className,
  delay = 0,
  duration = 500,
  threshold = 0.1
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add delay before triggering animation
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          // Unobserve after triggering (animation only plays once)
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-6',
        className
      )}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionProperty: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
}
