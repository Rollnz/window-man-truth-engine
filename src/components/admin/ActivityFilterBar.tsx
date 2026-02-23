import { RefreshCw } from 'lucide-react';
import { SOURCE_TOOL_LABELS } from '@/constants/sourceToolLabels';
import { ActivityFilters } from '@/hooks/useCallActivity';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  { label: "No Answer", value: "no_answer", activeClass: "bg-muted-foreground text-white" },
];

export function ActivityFilterBar({
  filters,
  onFilterChange,
  onRefresh,
}: ActivityFilterBarProps) {
  return (
    <div className="flex items-center justify-between py-3">
      {/* Left: Source Tool Dropdown — shadcn Select */}
      <Select
        value={filters.source_tool || "__all__"}
        onValueChange={(val) =>
          onFilterChange({ ...filters, source_tool: val === "__all__" ? "" : val })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Tools" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Tools</SelectItem>
          {Object.entries(SOURCE_TOOL_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
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
        className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
      >
        <RefreshCw className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
