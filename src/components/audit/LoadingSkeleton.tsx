import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
  return (
    <div className="py-16 md:py-24 bg-slate-950">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <Skeleton className="h-12 w-96 max-w-full bg-slate-800" />
          <Skeleton className="h-6 w-72 max-w-full bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-8">
            <Skeleton className="h-[400px] bg-slate-800 rounded-xl" />
            <Skeleton className="h-[400px] bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingSkeleton;
