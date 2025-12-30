import { Progress } from '@/components/ui/progress';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { CheckCircle, Circle } from 'lucide-react';

interface ReadinessScoreProps {
  completed: number;
  total: number;
}

export function ReadinessScore({ completed, total }: ReadinessScoreProps) {
  const percentage = Math.round((completed / total) * 100);
  
  // Determine status message and color
  const getStatus = () => {
    if (percentage === 0) {
      return { message: 'Not Started', color: 'text-muted-foreground' };
    } else if (percentage < 50) {
      return { message: 'Building Foundation', color: 'text-orange-500' };
    } else if (percentage < 100) {
      return { message: 'Almost There', color: 'text-yellow-500' };
    } else {
      return { message: 'Claim Ready', color: 'text-primary' };
    }
  };

  const status = getStatus();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {percentage === 100 ? (
            <CheckCircle className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Claim Readiness</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${status.color}`}>
            {status.message}
          </span>
          <span className="text-sm text-muted-foreground">
            <AnimatedNumber value={completed} /> of {total}
          </span>
        </div>
      </div>
      
      <Progress value={percentage} className="h-3" />
      
      <p className="mt-2 text-xs text-muted-foreground text-center">
        {percentage === 100 
          ? "You're fully prepared. Your vault is complete!"
          : `Complete ${total - completed} more document${total - completed === 1 ? '' : 's'} to be claim-ready.`
        }
      </p>
    </div>
  );
}
