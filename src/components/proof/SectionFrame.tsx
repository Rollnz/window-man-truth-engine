import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SectionFrameProps {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  onInView?: (sectionId: string) => void;
}

/**
 * SectionFrame - Standard section wrapper with IntersectionObserver
 * Sets data-inview="true" once when section enters viewport
 * Children use .wm-reveal for staggered entrance animations
 * Respects prefers-reduced-motion via CSS
 */
export function SectionFrame({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  onInView,
}: SectionFrameProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !inView) {
            setInView(true);
            onInView?.(id);
            observer.unobserve(section);
          }
        });
      },
      { threshold: 0.15, rootMargin: '-50px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [id, inView, onInView]);

  return (
    <section
      ref={sectionRef}
      id={id}
      data-inview={inView}
      className={cn(
        'py-12 md:py-20 scroll-mt-20',
        className
      )}
    >
      <div className="container px-4">
        {/* Section Header */}
        {(eyebrow || title || subtitle) && (
          <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
            {eyebrow && (
              <div className="wm-reveal wm-stagger-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <span className="text-sm text-primary font-medium">{eyebrow}</span>
              </div>
            )}
            
            {title && (
              <h2 className="wm-reveal wm-stagger-1 text-2xl md:text-4xl font-bold mb-4">
                {title}
              </h2>
            )}
            
            {subtitle && (
              <p className="wm-reveal wm-stagger-2 text-lg text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Section Content */}
        {children}
      </div>
    </section>
  );
}
