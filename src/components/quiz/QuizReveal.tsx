import { CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuizQuestion } from '@/data/quizData';

interface QuizRevealProps {
  question: QuizQuestion;
  userAnswerId: string;
  userConfidence: number;
  onContinue: () => void;
}

export function QuizReveal({
  question,
  userAnswerId,
  userConfidence,
  onContinue,
}: QuizRevealProps) {
  const userAnswer = question.options.find((o) => o.id === userAnswerId);
  const isCorrect = userAnswer?.isCorrect || false;
  const wasConfident = userConfidence >= 4;

  // Extra sting if they were confident and wrong
  const showConfidenceStinger = !isCorrect && wasConfident;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 animate-fade-in">
      <div className="w-full max-w-xl mx-auto">
        {/* Result indicator */}
        <div className="flex justify-center mb-6">
          {isCorrect ? (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
          )}
        </div>

        {/* Result text */}
        <div className="text-center mb-6">
          {isCorrect ? (
            <h2 className="text-2xl font-bold text-primary mb-2">CORRECT</h2>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-destructive mb-2">
                {question.revealTitle}
              </h2>
              {showConfidenceStinger && (
                <p className="text-sm text-destructive/80 flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  You were confident. That's exactly how they get you.
                </p>
              )}
            </>
          )}
        </div>

        {/* Correct answer callout */}
        <div className={`p-4 rounded-lg border mb-6 ${
          isCorrect 
            ? 'bg-primary/10 border-primary/30' 
            : 'bg-destructive/10 border-destructive/30'
        }`}>
          <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
          <p className="text-lg font-semibold text-foreground">
            {question.correctAnswer}
          </p>
        </div>

        {/* Explanation */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">
            Intelligence Briefing
          </h3>
          <p className="text-foreground leading-relaxed mb-4">
            {question.revealExplanation}
          </p>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Why most fail:</span>{' '}
              {question.trapReason}
            </p>
          </div>
        </div>

        {/* Continue button */}
        <Button
          size="lg"
          onClick={onContinue}
          className="w-full text-lg"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
