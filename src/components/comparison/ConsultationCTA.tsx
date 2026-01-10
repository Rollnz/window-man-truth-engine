import { Phone, Shield, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConsultationCTAProps {
  onBookConsultation: () => void;
}

export function ConsultationCTA({ onBookConsultation }: ConsultationCTAProps) {
  return (
    <section className="py-16 md:py-20 border-t border-border bg-gradient-to-b from-background to-secondary/20">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
            <Award className="w-4 h-4" />
            Tier 3: Its Window Man Standard
          </div>

          {/* Headline */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Ready for <span className="text-primary text-glow">High-Performance</span> Windows?
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            Schedule a free, no-pressure consultation. We'll give you an exact quote 
            and answer all your questions — even if you decide not to buy.
          </p>

          {/* Trust elements */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-success" />
              Lifetime Warranty
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4 text-success" />
              No Pressure Sales
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            size="lg" 
            variant="cta"
            className="text-lg px-8 py-6"
            onClick={onBookConsultation}
          >
            Get A WindowMan Estimate
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Free consultation • Custom quote in 24 hours • No obligations
          </p>
        </div>
      </div>
    </section>
  );
}
