// ═══════════════════════════════════════════════════════════════════════════
// PreGateInterstitial - 4-step deterministic stepper between upload & gate
// Builds perceived value before lead capture modal opens
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { Fingerprint, FileText, AlertTriangle, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// DETERMINISTIC JITTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Produces a stable jitter offset seeded by scanAttemptId + stepIndex.
 * Same upload always yields the same timing (QA-friendly).
 * Range: -80ms to +120ms
 */
function getStepJitter(scanAttemptId: string, stepIndex: number): number {
  let hash = 0;
  const seed = scanAttemptId + String(stepIndex);
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 201) - 80;
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const STEPS = [
  { label: 'Creating document fingerprint...', icon: Fingerprint, baseMs: 500, minMs: 420 },
  { label: 'Extracting line items and scope details...', icon: FileText, baseMs: 700, minMs: 620 },
  { label: 'Detecting potential risk flags...', icon: AlertTriangle, baseMs: 650, minMs: 500 },
  { label: 'Preparing scorecard vectors...', icon: Sparkles, baseMs: 450, minMs: 420 },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface PreGateInterstitialProps {
  scanAttemptId: string;
  onComplete: () => void;
}

export function PreGateInterstitial({ scanAttemptId, onComplete }: PreGateInterstitialProps) {
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showBanner, setShowBanner] = useState(false);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Clear any existing timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    let cumulativeDelay = 0;

    // Schedule each step sequentially
    STEPS.forEach((step, index) => {
      const jitter = getStepJitter(scanAttemptId, index);
      const duration = Math.max(step.minMs, step.baseMs + jitter);

      // Activate step
      const activateTimer = setTimeout(() => {
        setActiveStep(index);
      }, cumulativeDelay);
      timersRef.current.push(activateTimer);

      cumulativeDelay += duration;

      // Complete step
      const completeTimer = setTimeout(() => {
        setCompletedSteps(index + 1);
      }, cumulativeDelay);
      timersRef.current.push(completeTimer);
    });

    // After all steps: 400ms pause, then show banner
    const bannerTimer = setTimeout(() => {
      setShowBanner(true);
    }, cumulativeDelay + 400);
    timersRef.current.push(bannerTimer);

    // Banner visible 800ms, then fire onComplete
    const completeTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, cumulativeDelay + 400 + 800);
    timersRef.current.push(completeTimer);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [scanAttemptId, onComplete]);

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      {/* Steps */}
      {STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = completedSteps > index;
        const isActive = activeStep === index && !isCompleted;
        const isPending = activeStep < index && !isCompleted;

        return (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 transition-opacity duration-300',
              isPending && 'opacity-40'
            )}
          >
            {/* Status indicator */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
                isCompleted && 'bg-emerald-500/20 border border-emerald-500/40',
                isActive && index === 2
                  ? 'bg-amber-500/20 border border-amber-500/40'
                  : isActive
                    ? 'bg-primary/20 border border-primary/40'
                    : '',
                isPending && 'bg-slate-700/50 border border-slate-600/30'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : isActive ? (
                <Loader2
                  className={cn(
                    'w-4 h-4 animate-spin',
                    index === 2 ? 'text-amber-400' : 'text-primary'
                  )}
                />
              ) : (
                <StepIcon className="w-4 h-4 text-slate-500" />
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                'text-sm transition-colors duration-300',
                isCompleted && 'text-emerald-400',
                isActive && index === 2 ? 'text-amber-300' : isActive ? 'text-white' : '',
                isPending && 'text-slate-500'
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}

      {/* Completion banner */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 transition-all duration-500',
          showBanner ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-400">Pre-check complete</p>
          <p className="text-xs text-emerald-400/70">We found potential areas to review.</p>
        </div>
      </div>
    </div>
  );
}

export default PreGateInterstitial;
