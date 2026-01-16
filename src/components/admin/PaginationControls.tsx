import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown } from "lucide-react";

interface PaginationControlsProps {
  currentCount: number;
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function PaginationControls({
  currentCount,
  totalCount,
  hasMore,
  isLoading,
  onLoadMore,
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{currentCount}</span> of{" "}
        <span className="font-medium">{totalCount.toLocaleString()}</span> total events
      </p>
      
      {hasMore && (
        <Button
          variant="outline"
          onClick={onLoadMore}
          disabled={isLoading}
          className="min-w-[160px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Load More
            </>
          )}
        </Button>
      )}
      
      {!hasMore && currentCount > 0 && (
        <p className="text-sm text-muted-foreground italic">
          All events loaded
        </p>
      )}
    </div>
  );
}
