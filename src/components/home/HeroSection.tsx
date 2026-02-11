import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Eye } from 'lucide-react';
import { ROUTES } from '@/config/navigation';

export function HeroSection() {
  return (
    <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[hsl(var(--surface-1))]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.15)_0%,transparent_70%)]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(var(--secondary)/0.08)_0%,transparent_70%)]" />
      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8 animate-fade-in"><Shield className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">Free Pro-Consumer Protection Service</span></div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up"><span className="text-foreground">You Don't Lose Money on Windows</span><br /><span className="text-foreground">Because Prices Are High.</span><span className="block mt-4 text-primary [text-shadow:0_0_40px_hsl(var(--primary)/0.4)]">You Lose Money Because You Don't Know What You Don't Know.</span></h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>Contractors see code requirements, pricing margins, and fine print.<br className="hidden md:block" />Homeowners see a total price — and hope it's fair.</p>
          <p className="text-xl md:text-2xl font-semibold text-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>Window Man exists to end that imbalance.</p>
          <div className="max-w-2xl mx-auto mb-10 p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <p className="text-muted-foreground leading-relaxed">The impact window industry isn't broken because contractors are dishonest. It's broken because the system rewards technical knowledge — and homeowners aren't given access to it.<span className="block mt-3 text-foreground font-medium">Until now.</span></p>
            <p className="text-sm text-muted-foreground mt-4 border-t border-border/50 pt-4">Window Man is a free, pro-consumer protection service that uses AI to audit window estimates the same way insurers, inspectors, and experienced professionals do — <em>before you sign anything</em>.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col items-center">
              <Button asChild size="lg" variant="cta" className="text-sm sm:text-base px-4 sm:px-8 py-6 group cta-glow w-full sm:w-auto"><Link to={ROUTES.QUOTE_SCANNER}><Eye className="mr-2 w-5 h-5 flex-shrink-0" />See What People Miss In Window Contracts<ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1 flex-shrink-0" /></Link></Button>
              <p className="mt-2 text-xs text-muted-foreground">No upload required. No pressure.</p>
            </div>
          </div>
          <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}><Link to="/sample-report" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors group"><span className="border-b border-primary/50 group-hover:border-primary text-sm">View a Real Sample AI Report</span><span className="ml-2 transition-transform group-hover:translate-x-1">→</span></Link><p className="text-xs text-muted-foreground mt-1">See exactly what the analysis looks like before sharing anything.</p></div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(var(--surface-1))] to-transparent" />
    </section>
  );
}
