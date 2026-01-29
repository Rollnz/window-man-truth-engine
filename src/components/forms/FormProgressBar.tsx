import { cn } from "@/lib/utils";

/**
 * FormProgressBar - Visual progress indicator for multi-step forms
 * 
 * Features:
 * - Shows current step and total steps
 * - Animated progress bar
 * - Accessible with ARIA attributes
 * 
 * @example
 * <FormProgressBar currentStep={2} totalSteps={5} />
 */

export interface FormProgressBarProps {
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Optional step labels for enhanced UX */
  stepLabels?: string[];
  /** Additional className */
  className?: string;
  /** Variant: 'default' shows full bar, 'compact' just shows text */
  variant?: 'default' | 'compact';
}

export function FormProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
  className,
  variant = 'default',
}: FormProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
  const currentLabel = stepLabels?.[currentStep - 1];

  if (variant === 'compact') {
    return (
      <div 
        className={cn("text-sm text-muted-foreground", className)}
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}${currentLabel ? `: ${currentLabel}` : ''}`}
      >
        Step {currentStep} of {totalSteps}
        {currentLabel && <span className="ml-1 font-medium text-foreground">— {currentLabel}</span>}
      </div>
    );
  }

  return (
    <div 
      className={cn("space-y-2", className)}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}${currentLabel ? `: ${currentLabel}` : ''}`}
    >
      {/* Text indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        {currentLabel && (
          <span className="font-medium text-foreground">
            {currentLabel}
          </span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step dots (optional, for visual reference) */}
      {totalSteps <= 7 && (
        <div className="flex justify-between items-center px-1">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNumber = i + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            
            return (
              <div
                key={stepNumber}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-200",
                  isCompleted && "bg-primary",
                  isCurrent && "bg-primary ring-2 ring-primary/30",
                  !isCompleted && !isCurrent && "bg-muted"
                )}
                aria-hidden="true"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
