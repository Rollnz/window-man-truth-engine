import { Phone, Loader2 } from 'lucide-react';
import { ActivityFilterBar } from './ActivityFilterBar';
import { ActivityRow } from './ActivityRow';
import { ActivityCall, ActivityFilters } from '@/hooks/useCallActivity';

interface ActivityFeedProps {
  calls: ActivityCall[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  filters: ActivityFilters;
  onFilterChange: (filters: ActivityFilters) => void;
}

export function ActivityFeed({
  calls,
  loading,
  error,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onRefresh,
  filters,
  onFilterChange,
}: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      {/* Section 1: Filter Bar */}
      <ActivityFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onRefresh={onRefresh}
      />

      {/* Section 2: Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-13 bg-gray-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={onRefresh}
            className="text-sm text-red-600 font-medium underline"
          >
            Retry
          </button>
        </div>
      ) : calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Phone className="w-10 h-10 text-gray-300 mb-3" />
          {filters.source_tool === "" && filters.status === "" ? (
            <>
              <p className="text-gray-600 font-medium">No calls yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Test an agent to see activity here
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 font-medium">
                No calls match your filters
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting the filters above
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
          {calls.map((call) => (
            <ActivityRow key={call.id} call={call} />
          ))}
        </div>
      )}

      {/* Section 3: Load More */}
      {calls.length > 0 && hasMore && (
        <div className="flex justify-center pt-3">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
