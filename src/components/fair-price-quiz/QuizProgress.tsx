import { Progress } from '@/components/ui/progress';

interface QuizProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function QuizProgress({ currentStep, totalSteps }: QuizProgressProps) {
  const progressValue = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Question {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(progressValue)}%</span>
      </div>
      <Progress value={progressValue} className="h-2" />
    </div>
  );
}
