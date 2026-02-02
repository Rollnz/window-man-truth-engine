import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

type AnimationDirection = 'up' | 'left' | 'right';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before animation starts after element is visible */
  delay?: number;
  /** Animation duration in ms */
  duration?: number;
  /** How much of the element must be visible to trigger (0-1) */
  threshold?: number;
  /** Direction to animate from. Default 'up'. Use 'left'/'right' for horizontal reveals on desktop */
  direction?: AnimationDirection;
  /** Apply horizontal direction only on desktop (md+). Mobile always uses 'up' */
  desktopDirectionOnly?: boolean;
}

/**
 * AnimateOnScroll
 * Wraps content with scroll-triggered animations.
 * - Mobile: fade-up (20px translateY)
 * - Desktop: supports left/right horizontal reveals (30px translateX)
 * Uses IntersectionObserver for performance.
 * Respects prefers-reduced-motion.
 * Cleans up will-change after animation completes.
 */
export function AnimateOnScroll({ 
  children, 
  className,
  delay = 0,
  duration = 400,
  threshold = 0.3,
  direction = 'up',
  desktopDirectionOnly = true
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Determine effective direction based on viewport
  const getTransformStyle = useCallback(() => {
    if (isVisible) return 'translate(0, 0)';
    
    // Check if we should use horizontal direction
    const useHorizontal = direction !== 'up' && 
      (!desktopDirectionOnly || (typeof window !== 'undefined' && window.innerWidth >= 768));
    
    if (useHorizontal) {
      return direction === 'left' ? 'translateX(-30px)' : 'translateX(30px)';
    }
    return 'translateY(20px)';
  }, [isVisible, direction, desktopDirectionOnly]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      setAnimationComplete(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add delay before triggering animation
          setTimeout(() => {
            setIsVisible(true);
            // Clean up will-change after animation completes
            setTimeout(() => {
              setAnimationComplete(true);
            }, duration + 50);
          }, delay);
          // Unobserve after triggering (animation only plays once)
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [delay, threshold, duration]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{ 
        opacity: isVisible ? 1 : 0,
        transform: getTransformStyle(),
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        willChange: animationComplete ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
}
