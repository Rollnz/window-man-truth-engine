import { Shield, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StampBadge } from './StampBadge';

interface DossierHeroProps {
  onOpenModal?: () => void;
}

export function DossierHero({ onOpenModal }: DossierHeroProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0F14]">
      {/* Background Image - z-0 */}
      <img 
        src="/images/beat-your-quote/hero-dossier.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-40 z-0"
      />
      
      {/* Dark Overlay - z-[1] */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F14]/70 via-[#0A0F14]/50 to-[#0A0F14] z-[1]" />

      {/* Scan Line Effect - z-[2] */}
      <div className="scanline-overlay z-[2]" />

      {/* Content - z-10 */}
      <div className="relative z-10 container px-4 text-center max-w-4xl">
        {/* Classified Stamp */}
        <div className="mb-8 animate-fade-in">
          <StampBadge variant="red">Classified</StampBadge>
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
            onClick={onOpenModal}
            className="border-border text-muted-foreground hover:bg-secondary"
          >
            <Shield className="mr-2 w-5 h-5" />
            Access Dossier
          </Button>
          <Button
            size="lg"
            onClick={onOpenModal}
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
