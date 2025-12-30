import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizProgress } from './QuizProgress';
import { ConfidenceMeter } from './ConfidenceMeter';
import type { QuizQuestion as QuizQuestionType } from '@/data/quizData';

interface QuizQuestionProps {
  question: QuizQuestionType;
  currentStep: number;
  totalSteps: number;
  onAnswer: (optionId: string, confidence: number) => void;
  onBack: () => void;
  isAnimating: boolean;
  direction: 'forward' | 'back';
}

export function QuizQuestion({
  question,
  currentStep,
  totalSteps,
  onAnswer,
  onBack,
  isAnimating,
  direction,
}: QuizQuestionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showConfidence, setShowConfidence] = useState(false);

  const handleSelect = (optionId: string) => {
    if (isAnimating) return;
    setSelectedId(optionId);
    setShowConfidence(true);
  };

  const handleConfidenceSet = (confidence: number) => {
    if (selectedId) {
      // Small delay for visual feedback
      setTimeout(() => {
        onAnswer(selectedId, confidence);
        setSelectedId(null);
        setShowConfidence(false);
      }, 150);
    }
  };

  const animationClass = isAnimating
    ? direction === 'forward'
      ? 'animate-slide-out-left'
      : 'animate-slide-out-right'
    : direction === 'forward'
      ? 'animate-slide-in-right'
      : 'animate-slide-in-left';

  // Grid layout: 2 columns for 4 options, stacked for 2-3
  const gridClass = question.options.length === 4
    ? 'grid-cols-2'
    : 'grid-cols-1';

  return (
    <div className="min-h-[80vh] flex flex-col px-4 py-8">
      <QuizProgress current={currentStep} total={totalSteps} />

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
          {/* Test file header */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-muted/50 border border-border text-xs text-muted-foreground mb-4">
            <span className="font-mono">TEST FILE #{question.questionNumber}</span>
          </div>

          {/* Question */}
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 leading-relaxed">
            {question.question}
          </h2>

          {/* Options */}
          <div className={`grid gap-3 ${gridClass}`}>
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                disabled={isAnimating || showConfidence}
                className={`
                  w-full p-5 rounded-xl border-2 text-center transition-all duration-200
                  ${
                    selectedId === option.id
                      ? 'border-primary bg-primary/10 scale-[0.98] glow'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-card/80 active:scale-[0.98]'
                  }
                  ${showConfidence && selectedId !== option.id ? 'opacity-50' : ''}
                `}
              >
                <span className="text-lg font-medium text-foreground">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Confidence meter - shows after selection */}
          {showConfidence && (
            <ConfidenceMeter onConfidenceSet={handleConfidenceSet} />
          )}
        </div>
      </div>
    </div>
  );
}
