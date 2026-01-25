import { useState, useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisStep {
  id: string;
  label: string;
  duration: number; // ms
}

const analysisSteps: AnalysisStep[] = [
  { id: 'scan', label: 'Scanning document for text...', duration: 1250 },
  { id: 'warranty', label: 'Analyzing warranty terms...', duration: 1250 },
  { id: 'price', label: 'Checking price against 2025 market data...', duration: 1250 },
  { id: 'generate', label: 'Generating your gradecard...', duration: 1250 },
];

const TOTAL_DURATION = analysisSteps.reduce((sum, step) => sum + step.duration, 0); // 5000ms

interface ScannerStep3AnalysisProps {
  /** Called when 5-second theatrical animation completes */
  onComplete: () => void;
}

/**
 * Step 3: 5-Second Theatrical Loading State (PRESENTATION ONLY)
 * 
 * This component is purely visual - it runs a 5-second animation sequence
 * and calls onComplete when finished. It does NOT handle:
 * - GTM tracking (handled by useQuoteScanner hook)
 * - Analysis state (handled by parent modal)
 * - Modal closing (handled by parent's dual-condition logic)
 */
export function ScannerStep3Analysis({ onComplete }: ScannerStep3AnalysisProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const hasCalledComplete = useRef(false);

  useEffect(() => {
    // Progress bar animation (0-100 over 5 seconds)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2; // 50 steps * 100ms = 5000ms
      });
    }, 100);

    // Step progression - each step completes after its duration
    const stepTimeouts: NodeJS.Timeout[] = [];
    let cumulativeDelay = 0;

    analysisSteps.forEach((step, index) => {
      cumulativeDelay += step.duration;
      
      const timeout = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step.id]);
        setCurrentStepIndex(index + 1);
      }, cumulativeDelay);
      
      stepTimeouts.push(timeout);
    });

    // Call onComplete exactly once after all steps finish
    const completeTimeout = setTimeout(() => {
      if (!hasCalledComplete.current) {
        hasCalledComplete.current = true;
        console.log('[ScannerStep3] Theatrics complete, calling onComplete');
        onComplete();
      }
    }, TOTAL_DURATION + 100); // Small buffer after last step

    return () => {
      clearInterval(progressInterval);
      stepTimeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div className="py-6 space-y-6">
      {/* Animated Scanner Icon */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 analysis-pulse" />
          <div 
            className="absolute inset-0 rounded-full border-2 border-primary/20 analysis-pulse"
            style={{ animationDelay: '0.3s' }}
          />
          
          {/* Core icon */}
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center relative z-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Analyzing Your Quote...
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step List */}
      <div className="space-y-3">
        {analysisSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = index === currentStepIndex && !isCompleted;

          return (
            <div 
              key={step.id}
              className={cn(
                "flex items-center gap-3 transition-opacity duration-300",
                isCompleted || isCurrent ? "opacity-100" : "opacity-40"
              )}
            >
              {/* Status Icon */}
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                isCompleted 
                  ? "bg-primary text-white" 
                  : isCurrent 
                    ? "border-2 border-primary" 
                    : "border-2 border-slate-300"
              )}>
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ) : null}
              </div>

              {/* Step Label */}
              <span className={cn(
                "text-sm",
                isCompleted ? "text-slate-700" : "text-slate-500"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
