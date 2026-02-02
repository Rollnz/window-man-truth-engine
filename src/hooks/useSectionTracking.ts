import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/gtm';
import { getLeadAnchor } from '@/lib/leadAnchor';

/**
 * Section Visibility Tracking Hook
 * 
 * Tracks when a section becomes visible in the viewport using
 * IntersectionObserver. Fires analytics event once per section
 * when 50% of the section is visible.
 * 
 * @param sectionName - Unique identifier for the section
 * @returns ref - Attach to the section's root element
 * 
 * @example
 * export function HeroSection() {
 *   const sectionRef = useSectionTracking('hero');
 *   return <section ref={sectionRef}>...</section>;
 * }
 */
export function useSectionTracking(sectionName: string) {
  const sectionRef = useRef<HTMLElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true;
            
            trackEvent('sample_report_section_view', {
              section: sectionName,
              lead_id: getLeadAnchor(),
              visibility_ratio: entry.intersectionRatio,
              timestamp: Date.now()
            });
          }
        });
      },
      { 
        threshold: 0.5, // 50% visible = counted
        rootMargin: '0px' // No offset
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [sectionName]);

  return sectionRef;
}
