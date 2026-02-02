import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, FileWarning, ArrowRight } from 'lucide-react';

interface StatCardProps { value: string; label: string; description?: string; icon: React.ReactNode; iconColor: string; delay?: number; }

function StatCard({ value, label, description, icon, iconColor, delay = 0 }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } }, { threshold: 0.3 }); if (ref.current) observer.observe(ref.current); return () => observer.disconnect(); }, []);
  return (
    <div ref={ref} className={`relative p-8 rounded-2xl bg-card border border-border/50 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl ${iconColor}`} />
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${iconColor.replace('bg-', 'bg-').replace('-500', '-500/10')} border ${iconColor.replace('bg-', 'border-').replace('-500', '-500/30')}`}>{icon}</div>
        <div className="flex-1"><div className="text-4xl md:text-5xl font-bold text-foreground mb-2">{value}</div><div className="text-lg font-semibold text-foreground mb-1">{label}</div>{description && <p className="text-sm text-muted-foreground">{description}</p>}</div>
      </div>
    </div>
  );
}

export function MarketRealitySection() {
  return (
    <section className="py-20 md:py-32 relative bg-[hsl(var(--surface-1))]">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16"><h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">This Is a <span className="text-[hsl(var(--secondary))]">$3.8 Billion Industry</span><br />— and Homeowners Are at a Disadvantage</h2><p className="text-lg text-muted-foreground mb-6">Impact-resistant windows are one of the largest home investments in Florida. Yet price, quality, and protection vary wildly — even when homeowners believe they've done everything right.</p></div>
        <div className="max-w-3xl mx-auto mb-16 p-8 rounded-2xl bg-card/50 border border-border/50"><p className="text-lg text-muted-foreground leading-relaxed">In Florida alone, homeowners spend billions every year on hurricane-rated windows and doors. The demand is real. The stakes are high. And the margin for error is thin.</p><p className="text-lg text-muted-foreground leading-relaxed mt-4">But the problem isn't just how much these projects cost.</p><p className="text-lg text-foreground font-medium mt-4">The problem is that two quotes with similar prices can hide radically different levels of protection — and homeowners aren't given the information needed to tell the difference.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          <StatCard value="$1.92B" label="Annual Spend" description="The estimated amount Floridians spend every year on impact-resistant windows alone." icon={<TrendingUp className="w-6 h-6 text-primary" />} iconColor="bg-primary" delay={0} />
          <StatCard value="31%" label="Claims Denied" description="Nearly one in three Florida homeowners received $0 after Hurricane Irma — despite filing an insurance claim." icon={<AlertTriangle className="w-6 h-6 text-[hsl(var(--secondary))]" />} iconColor="bg-[hsl(var(--secondary))]" delay={150} />
          <StatCard value="The Pattern" label="Technical Failures" description="Claims weren't denied because homeowners acted recklessly. They were denied because of missing documentation, code-compliance gaps, and technical failures hidden in contracts." icon={<FileWarning className="w-6 h-6 text-amber-500" />} iconColor="bg-amber-500" delay={300} />
        </div>
        <div className="max-w-3xl mx-auto text-center mb-12"><div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-[hsl(var(--secondary)/0.05)] border border-primary/20"><p className="text-lg text-muted-foreground mb-4">When something goes wrong, insurers don't look at intent.</p><p className="text-xl font-semibold text-foreground">They look at specifications, documentation, and technical compliance.</p><p className="text-lg text-[hsl(var(--secondary))] font-medium mt-4">And that's where homeowners — even careful ones — are most exposed.</p></div></div>
        <div className="text-center"><Button asChild size="lg" variant="cta" className="group"><Link to="/sample-report">View a Real Sample AI Report<ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" /></Link></Button><p className="mt-3 text-sm text-muted-foreground">See how hidden risks are flagged before they become expensive problems.</p></div>
      </div>
    </section>
  );
}
