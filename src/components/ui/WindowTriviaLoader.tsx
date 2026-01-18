import { useEffect, useState, useRef, useCallback } from 'react';

const WINDOW_TRIVIA = [
  "Did you know? Glass is actually a liquid that forgot how to flow.",
  "The Defenestration of Prague wasn't about software—it was about throwing people out of windows.",
  "Before glass, people used flattened animal horns for windows. Be glad you live in 2026.",
  "Your window quote is currently being scrutinized by 3 microscopic lawyers.",
  "Fun fact: The White House has 147 windows. Imagine that cleaning bill.",
  "Analyzing sash weights and balances...",
  "Checking for drafty corners...",
  "A single-pane window loses heat 20x faster than an insulated wall.",
  "The word 'window' comes from Old Norse 'vindauga'—literally 'wind eye'.",
];

interface WindowTriviaLoaderProps {
  isActive: boolean;
  isComplete?: boolean;
  onComplete?: () => void;
}

// Logarithmic progress: fast start, slow finish
// Formula: progress = 90 * (1 - e^(-t/8)) where t is seconds elapsed
const calculateProgress = (elapsedMs: number): number => {
  const t = elapsedMs / 1000;
  const progress = 90 * (1 - Math.exp(-t / 8));
  return Math.min(progress, 90);
};

export function WindowTriviaLoader({ 
  isActive, 
  isComplete = false, 
  onComplete 
}: WindowTriviaLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaKey, setTriviaKey] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const triviaIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Progress animation
  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setIsTimedOut(false);
      startTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    startTimeRef.current = Date.now();

    const animate = () => {
      if (!startTimeRef.current) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      
      // Timeout after 60 seconds - cap at 95%
      if (elapsed > 60000) {
        setProgress(95);
        setIsTimedOut(true);
        return;
      }

      const newProgress = calculateProgress(elapsed);
      setProgress(newProgress);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive]);

  // Handle completion
  useEffect(() => {
    if (isComplete && isActive) {
      setProgress(100);
      // Brief pause before closing
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [isComplete, isActive, onComplete]);

  // Trivia rotation
  useEffect(() => {
    if (!isActive) {
      setTriviaIndex(0);
      setTriviaKey(0);
      if (triviaIntervalRef.current) {
        clearInterval(triviaIntervalRef.current);
      }
      return;
    }

    triviaIntervalRef.current = setInterval(() => {
      setTriviaIndex((prev) => (prev + 1) % WINDOW_TRIVIA.length);
      setTriviaKey((prev) => prev + 1);
    }, 3500);

    return () => {
      if (triviaIntervalRef.current) {
        clearInterval(triviaIntervalRef.current);
      }
    };
  }, [isActive]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Prevent closing by clicking backdrop
    e.stopPropagation();
  }, []);

  if (!isActive) return null;

  const statusText = isTimedOut 
    ? "Finalizing report details..." 
    : isComplete 
      ? "Report ready!" 
      : "Generating your report...";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="status"
      aria-live="polite"
      aria-label="Generating presentation, please wait"
    >
      <div className="flex flex-col items-center gap-6 p-4 md:p-6 max-w-sm">
        {/* Screen reader only status */}
        <span className="sr-only">{statusText}</span>

        {/* Window Frame */}
        <div className="relative w-48 h-64 md:w-56 md:h-72 border-4 border-muted-foreground/40 dark:border-muted-foreground/30 bg-primary/5 dark:bg-primary/10 rounded-sm shadow-xl overflow-hidden">
          {/* Window Cross Dividers (muntins) */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/20" />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-muted-foreground/20" />
          </div>

          {/* Glass Reflection Effect */}
          <div 
            className="absolute inset-0 pointer-events-none z-20 opacity-20"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)',
            }}
          />

          {/* Rising Sash (Progress Bar) */}
          <div 
            className="absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out bg-gradient-to-t from-primary/40 via-primary/30 to-primary/20"
            style={{ height: `${progress}%` }}
          >
            {/* Sash Rail Handle */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-muted-foreground/60 dark:bg-muted-foreground/50 border-y border-muted-foreground/30">
              {/* Handle grip lines */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-center gap-1">
                <div className="w-4 h-0.5 bg-muted-foreground/40 rounded-full" />
                <div className="w-4 h-0.5 bg-muted-foreground/40 rounded-full" />
              </div>
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <span className="text-2xl md:text-3xl font-bold text-foreground/80 tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Trivia Text */}
        <p 
          key={triviaKey}
          aria-hidden="true"
          className="text-sm md:text-base text-muted-foreground text-center max-w-xs px-4 italic animate-trivia-fade"
        >
          {WINDOW_TRIVIA[triviaIndex]}
        </p>

        {/* Status Text */}
        <p className="text-sm font-medium text-foreground/70">
          {statusText}
        </p>
      </div>
    </div>
  );
}
