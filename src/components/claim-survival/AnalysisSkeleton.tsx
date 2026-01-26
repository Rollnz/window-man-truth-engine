import { Skeleton } from "@/components/ui/skeleton";

export function AnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Timestamp skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-4 w-48 badge-shimmer" />
      </div>

      {/* Score Card skeleton */}
      <div className="rounded-lg border-2 border-border bg-muted/50 p-6 text-center space-y-3 overflow-hidden relative">
        <Skeleton className="h-14 w-24 mx-auto rounded-lg badge-shimmer" />
        <Skeleton className="h-4 w-40 mx-auto badge-shimmer" />
        <Skeleton className="h-4 w-64 mx-auto badge-shimmer" />
      </div>

      {/* Document Status section skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-48 badge-shimmer" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border overflow-hidden relative"
            >
              <Skeleton className="h-4 w-4 rounded-full flex-shrink-0 badge-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32 badge-shimmer" />
                  <Skeleton className="h-5 w-16 rounded-full badge-shimmer" />
                </div>
                <Skeleton className="h-3 w-full badge-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-32 badge-shimmer" />
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2 overflow-hidden relative">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-4 w-4 badge-shimmer" />
              <Skeleton className="h-4 flex-1 badge-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Processing indicator */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground font-mono animate-pulse">
          AI analyzing your evidence...
        </p>
      </div>
    </div>
  );
}
