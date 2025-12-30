import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FastWinQuestion, FastWinOption } from '@/data/fastWinData';

interface SpeedCardProps {
  question: FastWinQuestion;
  currentStep: number;
  totalSteps: number;
  onSelect: (value: string) => void;
  onBack: () => void;
  isAnimating: boolean;
  direction: 'forward' | 'back';
}

export function SpeedCard({
  question,
  currentStep,
  totalSteps,
  onSelect,
  onBack,
  isAnimating,
  direction,
}: SpeedCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (option: FastWinOption) => {
    if (isAnimating) return;
    setSelectedId(option.id);
    // Small delay for visual feedback before transitioning
    setTimeout(() => {
      onSelect(option.value);
      setSelectedId(null);
    }, 200);
  };

  const animationClass = isAnimating
    ? direction === 'forward'
      ? 'animate-slide-out-left'
      : 'animate-slide-out-right'
    : direction === 'forward'
      ? 'animate-slide-in-right'
      : 'animate-slide-in-left';

  return (
    <div className="min-h-[80vh] flex flex-col px-4 py-8">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < currentStep
                ? 'bg-primary glow-sm'
                : i === currentStep
                  ? 'bg-primary'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Back button */}
      {currentStep > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={isAnimating}
          className="self-start mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      )}

      {/* Question content */}
      <div className={`flex-1 flex flex-col items-center justify-center ${animationClass}`}>
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Question title */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {question.title}
          </h2>
          <p className="text-muted-foreground mb-8">{question.subtitle}</p>

          {/* Options as speed cards */}
          <div className="grid gap-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                disabled={isAnimating}
                className={`
                  w-full p-5 rounded-xl border-2 text-left transition-all duration-200
                  flex items-center gap-4
                  ${
                    selectedId === option.id
                      ? 'border-primary bg-primary/10 scale-[0.98] glow'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-card/80 active:scale-[0.98]'
                  }
                `}
              >
                <span className="text-3xl">{option.icon}</span>
                <span className="text-lg font-medium text-foreground">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
