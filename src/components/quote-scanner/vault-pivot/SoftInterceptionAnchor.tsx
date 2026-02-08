import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * SoftInterceptionAnchor
 * Micro-text block that breaks the 4th wall and creates intimacy.
 * Uses Intersection Observer for subtle fade-in animation.
 */
export function SoftInterceptionAnchor() {
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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Slight delay for dramatic effect
        setTimeout(() => setIsVisible(true), 200);
        observer.unobserve(element);
      }
    }, {
      threshold: 0.5
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={cn('w-full py-10 md:py-12 text-center transition-all duration-700 ease-out', isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
      <p className="text-muted-foreground font-light text-base md:text-lg leading-relaxed">
        Hey — You Up There.
        <br />
        <span className="text-foreground/80">
          Scroll down just a little bit… yeah, right here.
        </span>
      </p>
    </div>;
}