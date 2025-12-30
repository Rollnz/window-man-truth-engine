interface QuizProgressProps {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Text indicator */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Question {current + 1} of {total}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(progress)}% Complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out glow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < current
                ? 'bg-primary glow-sm'
                : i === current
                  ? 'bg-primary animate-pulse'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
