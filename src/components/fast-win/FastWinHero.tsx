import { Zap, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FastWinHeroProps {
  onStart: () => void;
  hasSessionData?: boolean;
}

export function FastWinHero({ onStart, hasSessionData }: FastWinHeroProps) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Radial glow background */}
      <div className="absolute inset-0 gradient-radial opacity-50 pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Timer badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary mb-6">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">45 Seconds</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
          Find Your <span className="text-primary text-glow">#1 Upgrade</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
          The 20% that delivers 80% of results
        </p>

        {/* Value props */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-primary" />
            <span>4 quick questions</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4 text-primary" />
            <span>Personalized result</span>
          </div>
        </div>

        {/* Personalization hint */}
        {hasSessionData && (
          <p className="text-sm text-primary/80 mb-4">
            ✓ We'll use your previous assessment data for better accuracy
          </p>
        )}

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={onStart}
          className="text-lg px-8 py-6 glow hover:glow-lg transition-all"
        >
          <Zap className="w-5 h-5 mr-2" />
          Start Speed Analysis
        </Button>

        {/* Trust text */}
        <p className="mt-6 text-xs text-muted-foreground">
          No email required • Free forever • Instant results
        </p>
      </div>
    </div>
  );
}
