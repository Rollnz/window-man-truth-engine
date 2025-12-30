import { Trophy, ArrowRight, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FastWinResult } from '@/lib/fastWinLogic';
import { HonorableMentions } from './HonorableMentions';

interface WinnerCardProps {
  result: FastWinResult;
  onSave: () => void;
  onGetPrice: () => void;
}

export function WinnerCard({ result, onSave, onGetPrice }: WinnerCardProps) {
  const { product, matchScore, honorableMentions, reasoning } = result;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Confetti effect (CSS-only subtle particles) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              animation: `confetti-fall ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto">
        {/* Trophy badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/20 border border-warning/40 text-warning">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">YOUR #1 FAST WIN</span>
          </div>
        </div>

        {/* Main winner card */}
        <div
          className="relative p-8 rounded-2xl border-2 border-warning bg-card animate-[reveal-winner_0.6s_ease-out_forwards] winner-glow"
          style={{
            boxShadow: '0 0 30px hsl(38 92% 50% / 0.3), 0 0 60px hsl(38 92% 50% / 0.15)',
          }}
        >
          {/* Product icon */}
          <div className="text-6xl text-center mb-4">{product.icon}</div>

          {/* Product name */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
            {product.name}
          </h2>

          {/* Headline */}
          <p className="text-lg text-primary text-center font-medium mb-4">
            {product.headline}
          </p>

          {/* Key statistic */}
          <div className="bg-muted/50 rounded-xl p-4 mb-4">
            <p className="text-center text-lg text-foreground">
              "{product.statistic}"
            </p>
          </div>

          {/* 80/20 badge */}
          <div className="flex justify-center gap-4 text-sm text-muted-foreground mb-4">
            <span>💡 80% of results</span>
            <span>•</span>
            <span>20% of cost</span>
          </div>

          {/* ROI statement */}
          <p className="text-center text-success font-medium mb-2">
            📉 {product.roiStatement}
          </p>

          {/* Match score */}
          <p className="text-center text-xs text-muted-foreground">
            {matchScore}% match based on your inputs
          </p>
        </div>

        {/* Reasoning */}
        {reasoning && (
          <p className="text-center text-sm text-muted-foreground mt-4 italic">
            {reasoning}
          </p>
        )}

        {/* Honorable mentions */}
        <HonorableMentions mentions={honorableMentions} />

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            size="lg"
            onClick={onGetPrice}
            className="flex-1 glow hover:glow-lg transition-all"
          >
            Get a Price for {product.name.split(' ')[0]}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSave}
            className="flex-1"
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Save This Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
}
