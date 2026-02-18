// ═══════════════════════════════════════════════════════════════════════════
// useAnalysisTheater Hook
// Timer-based progress animation with 90% pause gate
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  TheaterPhase, 
  TheaterStep, 
  AnalysisTheaterConfig,
  AnalysisTheaterState 
} from '@/types/audit';

interface UseAnalysisTheaterOptions {
  /** Total duration in milliseconds (default: 12000 for 12s) */
  duration?: number;
  /** Percentage to pause at (default: 90) */
  pauseAt?: number;
  /** Steps to display with checkmarks */
  steps: TheaterStep[];
  /** Callback when pause point is reached */
  onPause?: () => void;
  /** Callback when animation completes (after resume) */
  onComplete?: () => void;
  /** Auto-start animation (default: false) */
  autoStart?: boolean;
}

/**
 * Hook for managing the analysis theater animation.
 * 
 * Features:
 * - Smooth 60fps animation using requestAnimationFrame
 * - Pauses at configurable percentage (default 90%)
 * - Tracks which steps are complete based on percentage
 * - Supports resume after lead capture
 * 
 * @example
 * ```tsx
 * const { percent, phase, activeStepIndex, resume, start } = useAnalysisTheater({
 *   duration: 12000,
 *   pauseAt: 90,
 *   steps: PATH_A_THEATER_STEPS,
 *   onPause: () => setShowLeadForm(true),
 *   onComplete: () => setShowResults(true)
 * });
 * ```
 */
/**
 * @deprecated Use `useDeterministicScanner` instead — no animation timing needed.
 *
 * Timer-based progress animation with a 90% pause gate.
 * Drives the visual "analyzing" theater experience during AI quote scanning.
 */
export function useAnalysisTheater(options: UseAnalysisTheaterOptions): AnalysisTheaterState & {
  start: () => void;
} {
  const {
    duration = 12000,
    pauseAt = 90,
    steps,
    onPause,
    onComplete,
    autoStart = false,
  } = options;

  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState<TheaterPhase>('idle');
  
  // Refs for animation state
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);
  const hasCalledPauseRef = useRef(false);
  const hasCalledCompleteRef = useRef(false);

  // Calculate active step index based on current percentage
  const activeStepIndex = steps.findIndex((step, index) => {
    const nextStep = steps[index + 1];
    if (!nextStep) return percent < 100;
    return percent >= step.completesAt && percent < nextStep.completesAt;
  });

  // Animation loop
  const animate = useCallback((currentTime: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = currentTime;
    }

    const elapsed = currentTime - startTimeRef.current;
    const targetDuration = phase === 'running' && pausedAtRef.current === 0 
      ? (duration * pauseAt / 100) 
      : (duration * (100 - pauseAt) / 100);
    
    const startPercent = pausedAtRef.current;
    const endPercent = phase === 'running' && pausedAtRef.current === 0 ? pauseAt : 100;
    
    // Calculate progress with easeOutQuart for natural deceleration
    const rawProgress = Math.min(elapsed / targetDuration, 1);
    const easedProgress = 1 - Math.pow(1 - rawProgress, 4);
    
    const currentPercent = startPercent + (endPercent - startPercent) * easedProgress;
    setPercent(currentPercent);

    // Check if we've hit the pause point
    if (currentPercent >= pauseAt && pausedAtRef.current === 0 && !hasCalledPauseRef.current) {
      hasCalledPauseRef.current = true;
      setPhase('paused');
      pausedAtRef.current = pauseAt;
      startTimeRef.current = null;
      onPause?.();
      return;
    }

    // Check if animation is complete
    if (currentPercent >= 100 && !hasCalledCompleteRef.current) {
      hasCalledCompleteRef.current = true;
      setPercent(100);
      setPhase('complete');
      onComplete?.();
      return;
    }

    // Continue animation
    if (rawProgress < 1) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [duration, pauseAt, phase, onPause, onComplete]);

  // Start animation
  const start = useCallback(() => {
    if (phase !== 'idle') return;
    
    setPhase('running');
    hasCalledPauseRef.current = false;
    hasCalledCompleteRef.current = false;
    pausedAtRef.current = 0;
    startTimeRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [phase, animate]);

  // Resume animation after pause
  const resume = useCallback(() => {
    if (phase !== 'paused') return;
    
    setPhase('running');
    startTimeRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [phase, animate]);

  // Reset animation
  const reset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setPercent(0);
    setPhase('idle');
    pausedAtRef.current = 0;
    startTimeRef.current = null;
    hasCalledPauseRef.current = false;
    hasCalledCompleteRef.current = false;
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && phase === 'idle') {
      start();
    }
  }, [autoStart, phase, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    percent,
    phase,
    activeStepIndex: activeStepIndex === -1 ? steps.length - 1 : activeStepIndex,
    resume,
    reset,
    start,
  };
}
