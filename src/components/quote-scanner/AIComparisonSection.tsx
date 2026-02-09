import { useRef, useEffect, type RefObject } from 'react';
import { Brain, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/gtm';

interface AIComparisonSectionProps {
  uploadRef?: RefObject<HTMLDivElement>;
}

const traditionalItems = [
  'Commission bias and hidden sales pressure',
  'Inconsistent advice from door-to-door reps',
  'Cannot compare every product and code requirement',
  'Limited time, human error, no audit trail',
];

const aiItems = [
  'Reads every line item and clause instantly',
  'Flags hidden risks and overpricing with data',
  'Zero commission bias — works only for you',
  '24/7 consistent logic, updated to FL building code',
];

export function AIComparisonSection({ uploadRef }: AIComparisonSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const hasTrackedView = useRef(false);

  // Section-view analytics (fires once at 50% visibility)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedView.current) {
          hasTrackedView.current = true;
          trackEvent('section_view', {
            section: 'ai_comparison',
            page: 'quote-scanner',
          });
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScrollToUpload = () => {
    uploadRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCTAClick = () => {
    trackEvent('cta_click', {
      location: 'ai_comparison_section',
      destination: 'scanner',
      cta_label: 'Try the AI Quote Scanner',
    });
    handleScrollToUpload();
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24 bg-background overflow-hidden"
    >
      {/* Subtle grid overlay */}
      <div className="pattern-grid absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider rounded-full bg-primary/10 text-primary">
            AI Advantage
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why AI Instead of a Human Advisor?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Traditional window advisors work on commission. Our AI works on data
            — scanning every line of your quote in seconds with zero bias.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Decorative Brain icon (desktop only, centered between cards) */}
          <div
            className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center w-14 h-14 rounded-full bg-card border border-border"
            aria-hidden="true"
          >
            <Brain className="w-7 h-7 text-primary animate-tech-pulse" />
          </div>

          {/* Traditional Advisors Card */}
          <Card className={cn('border-destructive/30 elev-md')}>
            <div className="h-1 rounded-t-lg bg-destructive" />
            <CardHeader>
              <CardTitle className="text-lg">Traditional Advisors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {traditionalItems.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <AlertTriangle
                    className="w-5 h-5 mt-0.5 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground text-sm">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Quote Scanner Card */}
          <Card className={cn('border-primary/30 elev-md')}>
            <div className="h-1 rounded-t-lg bg-primary" />
            <CardHeader>
              <CardTitle className="text-lg">AI Quote Scanner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiItems.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 mt-0.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground text-sm">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-10">
          <Button
            variant="cta"
            size="lg"
            onClick={handleCTAClick}
            data-id="cta-ai-comparison"
            className="gap-2"
          >
            Try the AI Quote Scanner
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
