// ═══════════════════════════════════════════════════════════════════════════
// AnalysisTheater
// Animated progress display with sequential checkmarks
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Scan, AlertCircle } from 'lucide-react';
import { useAnalysisTheater } from '@/hooks/audit/useAnalysisTheater';
import { TheaterProgressBar, TheaterCheckmark } from './theater';
import { TheaterStep } from '@/types/audit';

interface AnalysisTheaterProps {
  /** Steps to display */
  steps: TheaterStep[];
  /** Duration in milliseconds */
  duration: number;
  /** Percentage to pause at */
  pauseAt?: number;
  /** Callback when pause point reached */
  onPause: () => void;
  /** Callback when animation completes */
  onComplete: () => void;
  /** Auto-start animation */
  autoStart?: boolean;
  /** Title to display */
  title?: string;
  /** Subtitle to display */
  subtitle?: string;
}

/**
 * Analysis Theater component displaying animated progress with checkmarks.
 * Pauses at 90% to trigger lead capture gate.
 */
export function AnalysisTheater({
  steps,
  duration,
  pauseAt = 90,
  onPause,
  onComplete,
  autoStart = true,
  title = "Analyzing Your Quote",
  subtitle = "Our AI is scanning for hidden fees and red flags..."
}: AnalysisTheaterProps) {
  const { percent, phase, activeStepIndex, resume, start } = useAnalysisTheater({
    duration,
    pauseAt,
    steps,
    onPause,
    onComplete,
    autoStart,
  });

  const isPaused = phase === 'paused';
  const isComplete = phase === 'complete';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-500",
          isPaused 
            ? "bg-orange-500/20 border border-orange-500/30" 
            : isComplete
              ? "bg-emerald-500/20 border border-emerald-500/30"
              : "bg-primary/20 border border-primary/30"
        )}>
          {isPaused ? (
            <AlertCircle className="w-8 h-8 text-orange-400" />
          ) : (
            <Scan className={cn(
              "w-8 h-8 transition-colors",
              isComplete ? "text-emerald-400" : "text-primary"
            )} />
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2">
          {isPaused ? "Analysis Paused" : isComplete ? "Analysis Complete" : title}
        </h3>
        
        {/* Subtitle */}
        <p className={cn(
          "text-sm",
          isPaused ? "text-orange-400" : "text-slate-400"
        )}>
          {isPaused 
            ? "Enter your details to unlock your results" 
            : isComplete 
              ? "Your quote has been fully analyzed"
              : subtitle}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <TheaterProgressBar percent={percent} isPaused={isPaused} />
      </div>

      {/* Steps */}
      <div className="space-y-1 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        {steps.map((step, index) => (
          <TheaterCheckmark
            key={step.id}
            step={step}
            isComplete={percent >= step.completesAt}
            isActive={index === activeStepIndex && !isComplete}
            index={index}
          />
        ))}
      </div>

      {/* Paused state callout */}
      {isPaused && (
        <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-400">
                Your analysis is 90% complete
              </p>
              <p className="text-xs text-slate-400 mt-1">
                We've found potential issues. Enter your details to see the full report.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export resume function for external control
export { useAnalysisTheater };
