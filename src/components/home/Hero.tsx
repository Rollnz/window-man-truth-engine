import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onInterrogateClick: () => void;
  onHowItWorksClick: () => void;
}

export function Hero({ onInterrogateClick, onHowItWorksClick }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 gradient-dark" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] gradient-radial opacity-50" />
      
      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main headline - No animation delay for faster LCP */}
          <h1 className="display-h1 text-lift text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-foreground">What Your Quote</span>
            <span className="block mt-2 text-primary text-glow">Isn't Telling You</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            An estimate interrogation system for impact windows — designed to expose hidden upgrades, 
            padded pricing, and compliance gaps before you sign anything.
          </p>

          {/* Authority / Credibility Line */}
          <p className="text-sm text-muted-foreground/70 mb-10 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            Built from real Florida impact window estimates — not contractor marketing claims.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              className="glow-sm hover:glow text-base px-8 py-6 group"
              onClick={onInterrogateClick}
            >
              Interrogate Your Estimate
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Secondary CTA - Text link */}
          <button 
            onClick={onHowItWorksClick}
            className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            See how the system works →
          </button>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
