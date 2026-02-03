import { RefreshCw } from 'lucide-react';
import { SOURCE_TOOL_LABELS } from '@/constants/sourceToolLabels';
import { ActivityFilters } from '@/hooks/useCallActivity';

interface ActivityFilterBarProps {
  filters: ActivityFilters;
  onFilterChange: (filters: ActivityFilters) => void;
  onRefresh: () => void;
}

const statusOptions = [
  { label: "All", value: "", activeClass: "bg-blue-500 text-white" },
  { label: "Pending", value: "pending", activeClass: "bg-yellow-500 text-white" },
  { label: "Completed", value: "completed", activeClass: "bg-green-500 text-white" },
  { label: "Failed", value: "dead_letter", activeClass: "bg-red-500 text-white" },
  { label: "No Answer", value: "no_answer", activeClass: "bg-gray-500 text-white" },
];

export function ActivityFilterBar({
  filters,
  onFilterChange,
  onRefresh,
}: ActivityFilterBarProps) {
  return (
    <div className="flex items-center justify-between py-3">
      {/* Left: Source Tool Dropdown */}
      <select
        value={filters.source_tool}
        onChange={(e) =>
          onFilterChange({ ...filters, source_tool: e.target.value })
        }
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Tools</option>
        {Object.entries(SOURCE_TOOL_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {/* Center: Status Filter Pills */}
      <div className="flex">
        {statusOptions.map((option, index) => {
          const isSelected = filters.status === option.value;
          const isFirst = index === 0;
          const isLast = index === statusOptions.length - 1;

          return (
            <button
              key={option.value}
              onClick={() =>
                onFilterChange({ ...filters, status: option.value })
              }
              className={`
                px-3 py-1.5 text-sm font-medium transition-colors
                ${isFirst ? "rounded-l-md" : ""}
                ${isLast ? "rounded-r-md" : ""}
                ${!isFirst && !isLast ? "rounded-none" : ""}
                ${
                  isSelected
                    ? option.activeClass
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Right: Refresh Button */}
      <button
        onClick={onRefresh}
        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <RefreshCw className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
}
