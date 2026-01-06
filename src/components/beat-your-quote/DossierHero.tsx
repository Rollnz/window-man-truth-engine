import { Shield, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DossierHero() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with Dark Overlay */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center opacity-30"
          style={{ 
            backgroundImage: 'url(/images/beat-your-quote/hero-dossier.webp)',
            backgroundColor: 'hsl(var(--background))'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F14]/80 via-[#0A0F14]/60 to-[#0A0F14]" />
      </div>

      {/* Scan Line Effect */}
      <div className="scanline-overlay" />

      {/* Content */}
      <div className="relative z-10 container px-4 text-center max-w-4xl">
        {/* Classified Stamp */}
        <div className="stamp stamp-red mb-8 animate-fade-in">
          CLASSIFIED
        </div>

        {/* Shield Icon */}
        <Shield className="w-16 h-16 mx-auto mb-6 text-primary animate-fade-in" />

        {/* Main Title */}
        <h1 className="font-typewriter text-4xl md:text-6xl lg:text-7xl font-bold mb-4 animate-fade-in">
          <span className="text-foreground">THE </span>
          <span className="text-primary glow-cyan">WINDOW MAN</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-fade-in">
          Florida's Impact Window Homeowner Advocate
        </p>

        {/* Description */}
        <p className="text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
          Exposing contractor manipulation tactics through fear-based education
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => scrollToSection('concept')}
            className="border-border text-muted-foreground hover:bg-secondary"
          >
            <Shield className="mr-2 w-5 h-5" />
            Access Dossier
          </Button>
          <Button 
            size="lg"
            onClick={() => scrollToSection('beat-quote')}
            className="glow group"
          >
            Beat Your Quote
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-primary opacity-60" />
        </div>
      </div>
    </section>
  );
}
