import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DollarSign, TrendingUp } from 'lucide-react';

export type ViewMode = 'upfront' | 'longterm';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
      <span className="text-sm font-medium text-muted-foreground">Show:</span>
      <ToggleGroup 
        type="single" 
        value={value}
        onValueChange={(val) => val && onChange(val as ViewMode)}
        className="bg-muted rounded-lg p-1"
      >
        <ToggleGroupItem 
          value="upfront" 
          className="data-[state=on]:bg-background data-[state=on]:text-foreground px-4 py-2 text-sm"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Upfront Price
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="longterm"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4 py-2 text-sm"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          10-Year True Cost
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
