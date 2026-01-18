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
 * Wraps content in a section that marks itself in-view when it first enters the viewport.
 *
 * When the section intersects the viewport (threshold 0.15, rootMargin '-50px') it sets the
 * `data-inview` attribute to `true` once and invokes `onInView` with the section `id` if provided.
 * The component applies an entrance animation that respects users' reduced-motion preferences.
 *
 * @param id - The HTML id applied to the section; passed to `onInView` when the section becomes visible.
 * @param onInView - Optional callback invoked once with the section `id` when the section first enters view.
 * @returns The section element containing an optional eyebrow, title, subtitle, and the provided children.
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
        // Entrance animation (respects reduced motion)
        'transition-all duration-500 ease-out',
        !inView && 'opacity-0 translate-y-4 motion-reduce:opacity-100 motion-reduce:translate-y-0',
        inView && 'opacity-100 translate-y-0',
        className
      )}
    >
      <div className="container px-4">
        {/* Section Header */}
        {(eyebrow || title || subtitle) && (
          <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <span className="text-sm text-primary font-medium">{eyebrow}</span>
              </div>
            )}
            
            {title && (
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                {title}
              </h2>
            )}
            
            {subtitle && (
              <p className="text-lg text-muted-foreground">
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