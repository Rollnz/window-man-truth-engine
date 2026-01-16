import { useState } from "react";
import { format, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRange {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
}

// Preset options for quick selection
const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
] as const;

export function DateRangePicker({
  value,
  onChange,
  disabled = false,
}: DateRangePickerProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const handlePreset = (days: number) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    onChange({ startDate, endDate });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      <div className="flex gap-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.days}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset.days)}
            disabled={disabled}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <span className="text-muted-foreground mx-1">or</span>

      {/* Start date picker */}
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "w-[130px] justify-start text-left font-normal",
              !value.startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.startDate ? format(value.startDate, "MMM d, yyyy") : "Start"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value.startDate}
            onSelect={(date) => {
              onChange({ ...value, startDate: date });
              setStartOpen(false);
            }}
            disabled={(date) =>
              date > new Date() || (value.endDate ? date > value.endDate : false)
            }
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground">to</span>

      {/* End date picker */}
      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "w-[130px] justify-start text-left font-normal",
              !value.endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.endDate ? format(value.endDate, "MMM d, yyyy") : "End"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value.endDate}
            onSelect={(date) => {
              onChange({ ...value, endDate: date });
              setEndOpen(false);
            }}
            disabled={(date) =>
              date > new Date() || (value.startDate ? date < value.startDate : false)
            }
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
