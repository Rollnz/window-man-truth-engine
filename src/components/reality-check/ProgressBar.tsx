import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.6)]",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full transition-all duration-500",
                    isCompleted ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.4)]" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
