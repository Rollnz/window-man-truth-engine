import { useEffect, useState, useRef } from 'react';
import { Shield, ShieldCheck, FileText, DollarSign, ScrollText, Award } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { getLeadAnchor } from '@/lib/leadAnchor';

interface Pillar { name: string; score: number; icon: typeof Shield; color: string; }

const pillars: Pillar[] = [
  { name: 'Safety & Code Match', score: 78, icon: ShieldCheck, color: 'bg-primary' },
  { name: 'Install & Scope Clarity', score: 42, icon: FileText, color: 'bg-[hsl(var(--secondary))]' },
  { name: 'Price Fairness', score: 39, icon: DollarSign, color: 'bg-[hsl(var(--secondary))]' },
  { name: 'Fine Print Transparency', score: 55, icon: ScrollText, color: 'bg-amber-500' },
  { name: 'Warranty Value', score: 71, icon: Award, color: 'bg-primary' },
];

function AnimatedScore({ targetScore, isVisible }: { targetScore: number; isVisible: boolean }) {
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

function SegmentedBar({ score, color, isVisible }: { score: number; color: string; isVisible: boolean }) {
  const segments = 10;
  const filledSegments = Math.round((score / 100) * segments);
  return (
    <div className="flex gap-1">
      {[...Array(segments)].map((_, i) => (
        <div key={i} className={`h-3 flex-1 rounded-sm transition-all duration-500 ${i < filledSegments && isVisible ? color : 'bg-muted/50'}`} style={{ transitionDelay: isVisible ? `${i * 50}ms` : '0ms' }} />
      ))}
    </div>
  );
}

export function ScoreboardSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const hasTrackedSection = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (!hasTrackedSection.current) {
          hasTrackedSection.current = true;
          trackEvent('sample_report_section_view', {
            section: 'scoreboard',
            lead_id: getLeadAnchor(),
            visibility_ratio: entry.intersectionRatio,
            timestamp: Date.now()
          });
        }
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const totalScore = 62;
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (totalScore / 100) * circumference;

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Quote Safety Score: <span className="text-primary">62 / 100</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Not a bad quote — a quote with <span className="text-[hsl(var(--secondary))] font-medium">avoidable risk</span> and missing protections.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-10 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 md:w-56 md:h-56">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="80" stroke="hsl(var(--muted))" strokeWidth="16" fill="none" />
                    <circle cx="50%" cy="50%" r="80" stroke="url(#scoreGradient)" strokeWidth="16" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={isVisible ? offset : circumference} className="transition-all duration-1500 ease-out" />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--secondary))" />
                        <stop offset="50%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl md:text-6xl font-bold text-foreground"><AnimatedScore targetScore={totalScore} isVisible={isVisible} /></span>
                    <span className="text-sm text-muted-foreground mt-1">out of 100</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground"><span className="text-amber-500 font-medium">Caution Zone</span> — Needs review before signing</p>
                </div>
              </div>

              <div className="space-y-5">
                {pillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={pillar.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${pillar.score >= 70 ? 'text-primary' : pillar.score >= 50 ? 'text-amber-500' : 'text-[hsl(var(--secondary))]'}`} />
                          <span className="text-sm font-medium text-foreground">{pillar.name}</span>
                        </div>
                        <span className={`text-sm font-bold ${pillar.score >= 70 ? 'text-primary' : pillar.score >= 50 ? 'text-amber-500' : 'text-[hsl(var(--secondary))]'}`}>
                          <AnimatedScore targetScore={pillar.score} isVisible={isVisible} />/100
                        </span>
                      </div>
                      <SegmentedBar score={pillar.score} color={pillar.color} isVisible={isVisible} />
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-8 pt-6 border-t border-border/50">Scores reflect completeness and protection — not brand names.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
