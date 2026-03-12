import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  id: string;
  label: string;
  duration: number; // ms
}

interface StepProgressSequenceProps {
  steps: ProgressStep[];
  onComplete?: () => void;
  className?: string;
  title?: string;
  subtitle?: string;
  /** Safety multiplier for stuck detection (default 1.2) */
  maxTimeoutBuffer?: number;
}

/**
 * StepProgressSequence — Production-grade animated progress stepper.
 *
 * - Viewport-triggered (50% visibility, one-shot)
 * - Smooth CSS-transitioned progress bar per step
 * - Full ARIA progressbar + live region
 * - Stuck-protection fallback
 * - SSR & memory safe
 */
export function StepProgressSequence({
  steps,
  onComplete,
  className,
  title,
  subtitle,
  maxTimeoutBuffer = 1.2,
}: StepProgressSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [hasStarted, setHasStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isStuck, setIsStuck] = useState(false);

  const totalDuration = useMemo(
    () => steps.reduce((sum, s) => sum + s.duration, 0),
    [steps],
  );

  const isComplete = completedSteps.size === steps.length;

  // Cumulative target widths for smooth bar
  const cumulativeWidths = useMemo(() => {
    const widths: number[] = [];
    let sum = 0;
    for (const s of steps) {
      sum += s.duration;
      widths.push((sum / totalDuration) * 100);
    }
    return widths;
  }, [steps, totalDuration]);

  // --- Viewport trigger (SSR-safe, one-shot) ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = containerRef.current;
    if (!el || hasStarted) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setHasStarted(true);
      setCurrentStepIndex(steps.length);
      setCompletedSteps(new Set(steps.map((s) => s.id)));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted, steps]);

  // --- Step progression ---
  useEffect(() => {
    if (!hasStarted || isComplete) return;

    // Kick off first step
    if (currentStepIndex === -1) {
      setCurrentStepIndex(0);
      return;
    }

    if (currentStepIndex >= steps.length) return;

    const step = steps[currentStepIndex];
    const timer = setTimeout(() => {
      setCompletedSteps((prev) => new Set(prev).add(step.id));
      setCurrentStepIndex((i) => i + 1);
    }, step.duration);

    return () => clearTimeout(timer);
  }, [hasStarted, currentStepIndex, steps, isComplete]);

  // --- Completion callback ---
  useEffect(() => {
    if (!isComplete) return;
    const timer = setTimeout(() => onCompleteRef.current?.(), 300);
    return () => clearTimeout(timer);
  }, [isComplete]);

  // --- Stuck protection ---
  useEffect(() => {
    if (!hasStarted || isComplete) return;

    const safetyMs = totalDuration * maxTimeoutBuffer;
    const timer = setTimeout(() => {
      if (!isComplete) setIsStuck(true);
    }, safetyMs);

    return () => clearTimeout(timer);
  }, [hasStarted, isComplete, totalDuration, maxTimeoutBuffer]);

  const handleManualComplete = useCallback(() => {
    setCompletedSteps(new Set(steps.map((s) => s.id)));
    setCurrentStepIndex(steps.length);
    setIsStuck(false);
  }, [steps]);

  // Progress bar target width & transition duration
  const progressTarget =
    currentStepIndex < 0
      ? 0
      : isComplete
        ? 100
        : currentStepIndex < steps.length
          ? cumulativeWidths[currentStepIndex] ?? 0
          : 100;

  const progressTransitionMs =
    currentStepIndex >= 0 && currentStepIndex < steps.length
      ? steps[currentStepIndex].duration
      : 300;

  const ariaValue = Math.round(progressTarget);

  return (
    <div
      ref={containerRef}
      className={cn('rounded-xl border bg-card p-6 shadow-sm', className)}
      role="progressbar"
      aria-valuenow={ariaValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={title ?? 'Progress'}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="text-center mb-4">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {/* Step list — aria-live for screen readers */}
      <div className="space-y-2" aria-live="polite" aria-atomic="false">
        {steps.map((step, index) => {
          const done = completedSteps.has(step.id);
          const active = index === currentStepIndex && !done;
          const pending = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 transition-opacity duration-300',
                pending && !hasStarted ? 'opacity-40' : pending ? 'opacity-40' : 'opacity-100',
              )}
            >
              {/* Indicator */}
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200',
                  done
                    ? 'bg-primary text-primary-foreground'
                    : active
                      ? 'border-2 border-primary'
                      : 'border-2 border-muted-foreground/30',
                )}
              >
                {done ? (
                  <Check className="w-3 h-3" />
                ) : active ? (
                  <Loader2 className="w-3 h-3 text-primary animate-spin" />
                ) : null}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-sm',
                  done
                    ? 'text-green-600 dark:text-green-400'
                    : active
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Smooth progress bar */}
      <div className="mt-5">
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{
              width: `${progressTarget}%`,
              transition: `width ${progressTransitionMs}ms linear`,
            }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {ariaValue}% complete
        </p>
      </div>

      {/* Stuck fallback */}
      {isStuck && !isComplete && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Taking longer than expected…
          </p>
          <button
            onClick={handleManualComplete}
            className="text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Continue anyway
          </button>
        </div>
      )}
    </div>
  );
}
