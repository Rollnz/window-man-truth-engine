import { useState, useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackQuoteUploadSuccess } from '@/lib/gtm';
import { useSessionData } from '@/hooks/useSessionData';

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

interface ScannerStep3AnalysisProps {
  /** Called when all steps complete (after 5 seconds) */
  onComplete: () => void;
  /** Whether actual analysis is still loading */
  isAnalyzing?: boolean;
  /** Scan attempt ID for tracking */
  scanAttemptId?: string;
}

/**
 * Step 3: 5-Second Theatrical Loading State
 * Shows animated progress with value-driven microcopy.
 * Fires quote_upload_success tracking event when complete.
 */
export function ScannerStep3Analysis({
  onComplete,
  isAnalyzing = false,
  scanAttemptId,
}: ScannerStep3AnalysisProps) {
  const { sessionData } = useSessionData();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const hasFiredTracking = useRef(false);

  useEffect(() => {
    let stepIndex = 0;
    let progressInterval: NodeJS.Timeout;

    // Progress bar animation
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    // Step progression
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

    // Note: onComplete is handled by the second useEffect after tracking fires
    // This prevents duplicate calls

    return () => {
      clearInterval(progressInterval);
      stepTimeouts.forEach(clearTimeout);
    };
  }, []);

  // Fire quote_upload_success and complete when analysis is done
  useEffect(() => {
    if (completedSteps.length === analysisSteps.length && !isAnalyzing && !hasFiredTracking.current) {
      hasFiredTracking.current = true;
      
      // Fire quote_upload_success tracking event ($50 value)
      const fireTrackingAndComplete = async () => {
        try {
          await trackQuoteUploadSuccess({
            scanAttemptId: scanAttemptId || `scan-${Date.now()}`,
            email: sessionData.email || undefined,
            phone: sessionData.phone || undefined,
            leadId: sessionData.leadId || undefined,
            sourceTool: 'quote-scanner',
          });
          console.log('[ScannerStep3] quote_upload_success fired');
        } catch (e) {
          console.error('[ScannerStep3] Tracking error:', e);
        }
        
        // Complete after tracking
        setTimeout(onComplete, 200);
      };
      
      fireTrackingAndComplete();
    }
  }, [completedSteps.length, isAnalyzing, onComplete, scanAttemptId, sessionData]);

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
