import { Sparkles } from 'lucide-react';

interface CoverSkeletonProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function CoverSkeleton({ position = 'top-right' }: CoverSkeletonProps) {
  const positionClasses = {
    'top-right': '-top-6 -right-6 md:-top-8 md:-right-8',
    'top-left': '-top-6 -left-6 md:-top-8 md:-left-8',
    'bottom-right': '-bottom-6 -right-6 md:-bottom-8 md:-right-8',
    'bottom-left': '-bottom-6 -left-6 md:-bottom-8 md:-left-8',
  };

  return (
    <div
      className={`
        absolute z-10
        ${positionClasses[position]}
        pointer-events-none
        w-24 md:w-28 lg:w-32
        animate-fade-in
      `}
    >
      <div
        className="
          relative w-full aspect-[4/5]
          rounded-lg
          bg-gradient-to-br from-muted via-muted/80 to-muted
          shadow-lg
          overflow-hidden
        "
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
        
        {/* Generating indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-[10px] text-muted-foreground font-medium">Generating...</span>
        </div>

        {/* Book spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-muted-foreground/10" />
      </div>
    </div>
  );
}
