import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LeadNavigationProps {
  currentIndex: number;
  totalLeads: number;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  className?: string;
}

export function LeadNavigation({
  currentIndex,
  totalLeads,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  className,
}: LeadNavigationProps) {
  if (totalLeads === 0) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="h-8 w-8"
        title="Previous lead (←)"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {currentIndex >= 0 ? currentIndex + 1 : '—'} of {totalLeads}
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!hasNext}
        className="h-8 w-8"
        title="Next lead (→)"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <span className="hidden lg:inline text-xs text-muted-foreground ml-2 border-l pl-2">
        Use ← → arrows
      </span>
    </div>
  );
}
