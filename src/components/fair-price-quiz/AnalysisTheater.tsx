import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { analysisSteps } from '@/data/fairPriceQuizData';

interface AnalysisTheaterProps {
  onComplete: () => void;
}

export function AnalysisTheater({ onComplete }: AnalysisTheaterProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStep >= analysisSteps.length) {
      // All steps complete
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }

    const step = analysisSteps[currentStep];
    
    // Animate progress to step target
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= step.progress) {
          clearInterval(progressInterval);
          return step.progress;
        }
        return prev + 2;
      });
    }, 30);

    // Move to next step after duration
    const stepTimer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, step.duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimer);
    };
  }, [currentStep, onComplete]);

  const currentMessage = currentStep < analysisSteps.length 
    ? analysisSteps[currentStep].message 
    : 'Complete!';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="max-w-md w-full mx-auto text-center">
        {/* Animated scanner effect */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full border-4 border-primary/30 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent animate-pulse" />
            <div className="text-4xl animate-pulse">📊</div>
          </div>
          {/* Scanning line animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse opacity-50" 
                 style={{ animation: 'pulse 1s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Current step message */}
        <p className="text-lg text-foreground mb-6 min-h-[28px] transition-all duration-300">
          {currentMessage}
        </p>

        {/* Progress bar */}
        <div className="w-full mb-4">
          <Progress value={progress} className="h-3" />
        </div>

        {/* Progress percentage */}
        <p className="text-sm text-muted-foreground">
          {Math.round(progress)}% complete
        </p>
      </div>
    </div>
  );
}
