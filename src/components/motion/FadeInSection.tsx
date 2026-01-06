import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FadeInSectionProps {
  children: ReactNode;
  className?: string;
  /**
   * Adds a staggered animation delay (in seconds) so multiple
   * sections can fade in one after another.
   */
  delay?: number;
}

/**
 * Reveals its children with a gentle fade/slide animation once
 * the wrapper enters the viewport. Uses IntersectionObserver so
 * it only triggers when visible instead of on every render.
 */
export function FadeInSection({ children, className, delay = 0 }: FadeInSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "opacity-0",
        isVisible && "animate-fade-in opacity-100",
        className
      )}
      style={isVisible && delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
