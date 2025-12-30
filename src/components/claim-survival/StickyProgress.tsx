import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface StickyProgressProps {
  visible: boolean;
  completed: number;
  total: number;
  onCtaClick: () => void;
  isUnlocked: boolean;
}

export function StickyProgress({ 
  visible, 
  completed, 
  total, 
  onCtaClick,
  isUnlocked 
}: StickyProgressProps) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Progress Section */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">Claim Readiness</span>
              <span className="text-xs text-muted-foreground">
                {completed}/{total} documents
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* CTA Button */}
          <Button 
            size="sm" 
            onClick={onCtaClick}
            className="shrink-0"
          >
            <Shield className="mr-2 h-4 w-4" />
            {isUnlocked ? 'View Vault' : 'Save Progress'}
          </Button>
        </div>
      </div>
    </div>
  );
}
