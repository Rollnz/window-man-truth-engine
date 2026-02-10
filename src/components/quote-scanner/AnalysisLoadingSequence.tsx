import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  'Scanning document...',
  'Identifying line items...',
  'Checking market rates...',
  'Finalizing score',
];

const STEP_INTERVAL = 800;

interface AnalysisLoadingSequenceProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function AnalysisLoadingSequence({ isActive, onComplete }: AnalysisLoadingSequenceProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= STEPS.length) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 400);
          return prev;
        }
        return next;
      });
    }, STEP_INTERVAL);

    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-lg">
      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6">
        Analyzing Your Quote
      </h3>
      <ul className="space-y-4">
        {STEPS.map((label, i) => {
          const isCompleted = i < currentStep;
          const isActiveStep = i === currentStep && isActive;
          const isFuture = i > currentStep;

          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-3 transition-opacity duration-300',
                isFuture && 'opacity-30',
                (isCompleted || isActiveStep) && 'opacity-100',
                isActiveStep && 'animate-fade-in'
              )}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {isCompleted ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : isActiveStep ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  isCompleted && 'text-muted-foreground line-through',
                  isActiveStep && 'text-foreground',
                  isFuture && 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
