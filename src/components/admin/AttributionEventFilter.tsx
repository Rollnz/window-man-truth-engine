import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker, DateRange } from "./DateRangePicker";

interface AttributionEventFilterProps {
  eventFilter: string;
  onEventFilterChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClearFilters: () => void;
  options: string[];
  disabled?: boolean;
}

export function AttributionEventFilter({
  eventFilter,
  onEventFilterChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  options,
  disabled = false,
}: AttributionEventFilterProps) {
  // Check if any filters are active
  const hasActiveFilters = eventFilter !== 'all' || dateRange.startDate || dateRange.endDate;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-muted/30 rounded-lg border">
      {/* Date Range */}
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground mb-2">Date Range</p>
        <DateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          disabled={disabled}
        />
      </div>

      {/* Event Type Filter */}
      <div className="lg:w-[250px]">
        <p className="text-sm font-medium text-muted-foreground mb-2">Event Type</p>
        <Select value={eventFilter} onValueChange={onEventFilterChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {options.map((eventName) => (
              <SelectItem key={eventName} value={eventName}>
                {eventName.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="lg:self-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
