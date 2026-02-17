import { Button } from '@/components/ui/button';
import { Shield, TrendingDown, Clock } from 'lucide-react';
import { UrgencyTicker } from '@/components/social-proof';

interface QuizHeroProps {
  onStart: () => void;
}

export function QuizHero({ onStart }: QuizHeroProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Fair Price Diagnostic</span>
        </div>

        {/* Headline */}
        <h1 className="display-h1 text-lift text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
          Is Your Window Quote{' '}
          <span className="text-primary">Fair?</span>
        </h1>

        {/* Subheadline */}
        <div className="mb-8 max-w-md mx-auto space-y-4">
          <p className="text-lg md:text-xl text-muted-foreground">
            Compare your quote against
          </p>
          <UrgencyTicker variant="homepage" size="md" showToday={false} animated={true} />
          <p className="text-lg md:text-xl text-muted-foreground">
            in 60 seconds.
          </p>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm">60 seconds</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <TrendingDown className="w-5 h-5 text-primary" />
            <span className="text-sm">Spot overcharging</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm">Free analysis</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={onStart}
          size="lg"
          className="text-lg px-8 py-6 glow"
        >
          Analyze My Quote →
        </Button>

      </div>
    </div>
  );
}
