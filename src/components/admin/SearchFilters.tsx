import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export interface SearchFilters {
  status?: string[];
  quality?: string[];
  matchType?: string[];
  dateFrom?: string;
  dateTo?: string;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  variant?: 'compact' | 'full';
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'qualifying', label: 'Qualifying' },
  { value: 'mql', label: 'MQL' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'appointment_set', label: 'Appointment Set' },
  { value: 'sat', label: 'SAT' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
  { value: 'dead', label: 'Dead' },
];

const QUALITY_OPTIONS = [
  { value: 'cold', label: 'Cold' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' },
  { value: 'qualified', label: 'Qualified' },
];

const MATCH_TYPE_OPTIONS = [
  { value: 'lead_fields', label: 'Lead fields only' },
  { value: 'notes', label: 'Notes only' },
  { value: 'call_notes', label: 'Call summaries only' },
];

export function SearchFilters({ filters, onFiltersChange, variant = 'full' }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeFilterCount = [
    filters.status?.length || 0,
    filters.quality?.length || 0,
    filters.matchType?.length || 0,
    filters.dateFrom ? 1 : 0,
    filters.dateTo ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const toggleArrayFilter = (key: 'status' | 'quality' | 'matchType', value: string) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({
      ...filters,
      [key]: updated.length > 0 ? updated : undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setIsOpen(false);
  };

  const setDateFilter = (key: 'dateFrom' | 'dateTo', value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  if (variant === 'compact') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs rounded-full">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-4">
          <FilterContent 
            filters={filters}
            toggleArrayFilter={toggleArrayFilter}
            setDateFilter={setDateFilter}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-4">
      <FilterContent 
        filters={filters}
        toggleArrayFilter={toggleArrayFilter}
        setDateFilter={setDateFilter}
        clearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
}

function FilterContent({
  filters,
  toggleArrayFilter,
  setDateFilter,
  clearFilters,
  activeFilterCount,
}: {
  filters: SearchFilters;
  toggleArrayFilter: (key: 'status' | 'quality' | 'matchType', value: string) => void;
  setDateFilter: (key: 'dateFrom' | 'dateTo', value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Filters</span>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Status filter */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Status</Label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((option) => {
            const isSelected = filters.status?.includes(option.value);
            return (
              <Badge
                key={option.value}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => toggleArrayFilter('status', option.value)}
              >
                {option.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Quality filter */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Lead Quality</Label>
        <div className="flex flex-wrap gap-1.5">
          {QUALITY_OPTIONS.map((option) => {
            const isSelected = filters.quality?.includes(option.value);
            return (
              <Badge
                key={option.value}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => toggleArrayFilter('quality', option.value)}
              >
                {option.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Match type filter */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Match Type</Label>
        <div className="space-y-2">
          {MATCH_TYPE_OPTIONS.map((option) => {
            const isSelected = filters.matchType?.includes(option.value);
            return (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`match-${option.value}`}
                  checked={isSelected}
                  onCheckedChange={() => toggleArrayFilter('matchType', option.value)}
                />
                <Label 
                  htmlFor={`match-${option.value}`} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date range filter */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="dateFrom" className="text-[10px] text-muted-foreground">From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setDateFilter('dateFrom', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dateTo" className="text-[10px] text-muted-foreground">To</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setDateFilter('dateTo', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Active filter badges display
export function ActiveFilterBadges({ 
  filters, 
  onFiltersChange 
}: { 
  filters: SearchFilters; 
  onFiltersChange: (filters: SearchFilters) => void;
}) {
  const removeFilter = (key: keyof SearchFilters, value?: string) => {
    if (key === 'dateFrom' || key === 'dateTo') {
      onFiltersChange({ ...filters, [key]: undefined });
    } else if (value && filters[key]) {
      const updated = (filters[key] as string[]).filter((v) => v !== value);
      onFiltersChange({
        ...filters,
        [key]: updated.length > 0 ? updated : undefined,
      });
    }
  };

  const hasFilters = filters.status?.length || filters.quality?.length || 
    filters.matchType?.length || filters.dateFrom || filters.dateTo;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.status?.map((s) => (
        <Badge key={`status-${s}`} variant="secondary" className="gap-1 text-xs">
          Status: {s.replace('_', ' ')}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => removeFilter('status', s)} 
          />
        </Badge>
      ))}
      {filters.quality?.map((q) => (
        <Badge key={`quality-${q}`} variant="secondary" className="gap-1 text-xs">
          Quality: {q}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => removeFilter('quality', q)} 
          />
        </Badge>
      ))}
      {filters.matchType?.map((m) => (
        <Badge key={`match-${m}`} variant="secondary" className="gap-1 text-xs">
          {m === 'lead_fields' ? 'Lead fields' : m === 'notes' ? 'Notes' : 'Call summaries'}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => removeFilter('matchType', m)} 
          />
        </Badge>
      ))}
      {filters.dateFrom && (
        <Badge variant="secondary" className="gap-1 text-xs">
          From: {filters.dateFrom}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => removeFilter('dateFrom')} 
          />
        </Badge>
      )}
      {filters.dateTo && (
        <Badge variant="secondary" className="gap-1 text-xs">
          To: {filters.dateTo}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => removeFilter('dateTo')} 
          />
        </Badge>
      )}
    </div>
  );
}
