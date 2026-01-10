import { useEngagementScore } from '@/hooks/useEngagementScore';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TOOL_REGISTRY } from '@/config/toolRegistry';
import { ROUTES } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { Circle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Circular progress ring component
 */
function ProgressRing({ progress, size = 32, strokeWidth = 3, className }: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} className={cn('transform -rotate-90', className)}>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={cn('transition-all duration-700 ease-out', className)}
      />
    </svg>
  );
}

/**
 * Get suggested next tools based on what hasn't been completed
 */
function getNextSteps() {
  const suggestions = [
    { 
      id: 'vulnerability-test', 
      name: 'Vulnerability Test', 
      points: TOOL_REGISTRY['vulnerability-test']?.engagementScore || 25,
      route: ROUTES.VULNERABILITY_TEST,
    },
    { 
      id: 'quote-scanner', 
      name: 'Quote Scanner', 
      points: TOOL_REGISTRY['quote-scanner']?.engagementScore || 50,
      route: ROUTES.QUOTE_SCANNER,
    },
    { 
      id: 'fair-price-quiz', 
      name: 'Fair Price Quiz', 
      points: TOOL_REGISTRY['fair-price-quiz']?.engagementScore || 35,
      route: ROUTES.FAIR_PRICE_QUIZ,
    },
  ];
  
  return suggestions;
}

export function ReadinessIndicator() {
  const { score, hasIncreased, status, maxScore } = useEngagementScore();
  const progress = Math.min((score / maxScore) * 100, 100);
  const nextSteps = getNextSteps();
  
  // Don't show if score is 0 (user hasn't engaged yet)
  if (score === 0) return null;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            // Glass pill effect matching Impact Window aesthetic
            'flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer',
            'bg-background/60 backdrop-blur-md border border-border/50',
            'hover:bg-background/80 transition-all duration-300',
            'shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)]',
            // Subtle glow when score increases
            hasIncreased && 'ring-2 ring-primary/30 animate-pulse'
          )}
        >
          {/* Progress Ring with score inside */}
          <div className="relative">
            <ProgressRing 
              progress={progress} 
              size={28} 
              strokeWidth={2.5}
              className={status.ring}
            />
            <Zap className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3',
              status.color
            )} />
          </div>
          
          {/* Score display */}
          <div className="flex items-baseline gap-1">
            <AnimatedNumber 
              value={score} 
              className={cn('text-sm font-semibold tabular-nums', status.color)}
              duration={800}
            />
            <span className="text-xs text-muted-foreground">/150</span>
          </div>
          
          {/* Status label - hidden on mobile */}
          <span className={cn(
            'text-xs font-medium hidden lg:inline',
            status.color
          )}>
            {status.label}
          </span>
        </div>
      </TooltipTrigger>
      
      <TooltipContent 
        side="bottom" 
        align="end"
        className="w-64 p-0 bg-popover border-border"
      >
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Your Readiness Score</span>
            <span className={cn('text-lg font-bold', status.color)}>{score}</span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn('h-full rounded-full transition-all duration-500', status.bgColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Status explanation */}
          <p className="text-xs text-muted-foreground">
            {score < 100 
              ? 'Complete tools below to increase your score and unlock better negotiation power.'
              : '🎉 High Intent! You\'re ready to take action.'}
          </p>
          
          {/* Next steps checklist */}
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Boost Your Score
            </span>
            {nextSteps.map((step) => (
              <Link
                key={step.id}
                to={step.route}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm group-hover:text-foreground transition-colors">{step.name}</span>
                </div>
                <span className="text-xs font-medium text-emerald-500">+{step.points}pts</span>
              </Link>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
