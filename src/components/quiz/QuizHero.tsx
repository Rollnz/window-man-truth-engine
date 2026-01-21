import { Brain, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuizHeroProps {
  onStart: () => void;
}

export function QuizHero({ onStart }: QuizHeroProps) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Radial glow background */}
      <div className="absolute inset-0 gradient-radial opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Warning badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 text-destructive mb-6">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">90% Fail This Test</span>
        </div>

        {/* Main headline */}
        <h1 className="display-h1 text-lift text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
          The <span className="text-primary text-glow">Window IQ</span> Challenge
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-4">
          Civilian Vulnerability Test
        </p>

        {/* Hook */}
        <p className="text-lg text-muted-foreground/80 mb-8 max-w-lg mx-auto">
          Most Florida homeowners fail this test and overpay by <span className="text-primary font-semibold">$5,000+</span> on their windows.
        </p>

        {/* Value props */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="w-4 h-4 text-primary" />
            <span>5 trap questions</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>Under 2 minutes</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={onStart}
          className="text-lg px-8 py-6 glow hover:glow-lg transition-all"
        >
          <Brain className="w-5 h-5 mr-2" />
          Test My Window IQ
        </Button>

        {/* Trust text */}
        <p className="mt-6 text-xs text-muted-foreground">
          No email required to see your score • Free forever
        </p>
      </div>
    </div>
  );
}
