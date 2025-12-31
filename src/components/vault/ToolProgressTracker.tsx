import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ToolProgress {
  id: string;
  name: string;
  path: string;
  completed: boolean;
  icon: React.ReactNode;
}

interface ToolProgressTrackerProps {
  tools: ToolProgress[];
}

export function ToolProgressTracker({ tools }: ToolProgressTrackerProps) {
  const completedCount = tools.filter(t => t.completed).length;
  const progressPercent = (completedCount / tools.length) * 100;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Your Progress</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount} of {tools.length} tools completed
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.path}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
              tool.completed
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/30 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            <div className="relative">
              {tool.icon}
              {tool.completed && (
                <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-primary fill-background" />
              )}
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {tool.name}
            </span>
          </Link>
        ))}
      </div>

      {completedCount < tools.length && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Complete more tools to build your protection file
        </p>
      )}
    </div>
  );
}
