import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Shield, Check, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { useSectionTracking } from '@/hooks/useSectionTracking';
interface HeroSectionProps {
  firstName?: string;
  onOpenLeadModal?: (ctaSource: string) => void;
  onOpenPreQuoteModal?: (ctaSource: string) => void;
}
function AnimatedScore({
  targetScore,
  isVisible
}: {
  targetScore: number;
  isVisible: boolean;
}) {
  const [score, setScore] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const duration = 1500;
    const startTime = Date.now();
    let rafId = 0;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScore(Math.round(targetScore * eased));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [targetScore, isVisible]);
  return <span>{score}</span>;
}
const PreviewBars = ({
  isVisible
}: {
  isVisible: boolean;
}) => {
  const pillars = [{
    name: 'Safety & Code',
    score: 78,
    color: 'bg-primary'
  }, {
    name: 'Install Clarity',
    score: 42,
    color: 'bg-[hsl(var(--secondary))]'
  }, {
    name: 'Price Fairness',
    score: 39,
    color: 'bg-[hsl(var(--secondary))]'
  }, {
    name: 'Fine Print',
    score: 55,
    color: 'bg-amber-500'
  }, {
    name: 'Warranty',
    score: 71,
    color: 'bg-primary'
  }];
  return <div className="space-y-2">
      {pillars.map((pillar, index) => <div key={pillar.name} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-20 truncate">{pillar.name}</span>
          <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
            <div className={`h-full ${pillar.color} rounded-full transition-all duration-700 ease-out`} style={{
          width: isVisible ? `${pillar.score}%` : '0%',
          transitionDelay: isVisible ? `${index * 100}ms` : '0ms'
        }} />
          </div>
          <span className="text-[10px] font-medium text-foreground w-6">
            <AnimatedScore targetScore={pillar.score} isVisible={isVisible} />
          </span>
        </div>)}
    </div>;
};
export function HeroSection({
  firstName,
  onOpenLeadModal,
  onOpenPreQuoteModal
}: HeroSectionProps) {
  const safeFirstName = firstName?.trim().slice(0, 24);
  const sectionRef = useSectionTracking('hero');
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
  }, []);
  const handleUploadClick = () => {
    trackEvent('sample_report_upload_click', {
      location: 'hero_section'
    });
    onOpenPreQuoteModal?.('hero_upload');
  };
  const handleNoQuoteClick = () => {
    trackEvent('sample_report_no_quote_click', {
      location: 'hero_section'
    });
    onOpenPreQuoteModal?.('hero_no_quote');
  };
  const circumference = 2 * Math.PI * 56;
  const offset = circumference - 62 / 100 * circumference;
  return <section ref={sectionRef} className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />

      <div className="container px-4 relative">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-3 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Sample AI Audit Report</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {safeFirstName && safeFirstName.length >= 2 ? (
                <>
                  <span className="text-primary">{safeFirstName}</span>, See Exactly What Your AI Audit Looks Like
                </>
              ) : (
                <>See Exactly What Your AI Audit Looks Like</>
              )}
              <span className="block text-primary">Before You Upload Anything</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              This is a real-world example of the same report you'll receive: scorecard, risk flags, and plain-English findings.
            </p>

            <div className="flex flex-wrap gap-3">
              {['No charge', 'No obligation', 'You stay in control'].map(chip => <span key={chip} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border/50 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  {chip}
                </span>)}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="cta" size="lg" className="group" onClick={handleNoQuoteClick}>
                Don't Have a Quote Yet? Get Ready
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg" className="group" onClick={handleUploadClick}>
                <Upload className="w-5 h-5 mr-2" />
                Upload My Quote
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              PNG, JPEG. PDF Works Best for Multi-Page Uploads                
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-[hsl(var(--secondary)/0.1)] rounded-2xl blur-2xl" />
              <div className="relative bg-card/80 backdrop-blur-lg border border-border/50 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">Quote Safety Score</span>
                  </div>
                  <span className="text-xs text-muted-foreground">SAMPLE</span>
                </div>

                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="hsl(var(--muted))" strokeWidth="12" fill="none" />
                      <circle cx="64" cy="64" r="56" stroke="hsl(var(--primary))" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={isVisible ? offset : circumference} className="transition-all duration-[1500ms] ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-foreground">
                        <AnimatedScore targetScore={62} isVisible={isVisible} />
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-center text-muted-foreground mb-6">
                  Not a bad quote — a quote with <span className="text-[hsl(var(--secondary))] font-medium">avoidable risk</span>.
                </p>

                <PreviewBars isVisible={isVisible} />

                <p className="text-[10px] text-muted-foreground text-center mt-4 pt-4 border-t border-border/50">
                  Scores reflect completeness and protection — not brand names.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}