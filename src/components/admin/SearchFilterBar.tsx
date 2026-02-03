import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export type ShowMode = 'all' | 'enabled' | 'disabled';

interface SearchFilterBarProps {
  onFilterChange: (filters: { query: string; showMode: ShowMode }) => void;
}

export function SearchFilterBar({ onFilterChange }: SearchFilterBarProps) {
  const [query, setQuery] = useState('');
  const [showMode, setShowMode] = useState<ShowMode>('all');

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    onFilterChange({ query: newQuery, showMode });
  }, [showMode, onFilterChange]);

  const handleModeChange = useCallback((newMode: ShowMode) => {
    setShowMode(newMode);
    onFilterChange({ query, showMode: newMode });
  }, [query, onFilterChange]);

  const getModeButtonClasses = (mode: ShowMode) => {
    const baseClasses = 'px-3 py-1.5 text-sm font-medium transition-colors';
    const isSelected = showMode === mode;

    if (isSelected) {
      if (mode === 'all') return `${baseClasses} bg-blue-500 text-white`;
      if (mode === 'enabled') return `${baseClasses} bg-green-500 text-white`;
      if (mode === 'disabled') return `${baseClasses} bg-gray-500 text-white`;
    }

    return `${baseClasses} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      {/* Search Input */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search agents..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Toggle Group */}
      <div className="flex">
        <button
          type="button"
          onClick={() => handleModeChange('all')}
          className={`${getModeButtonClasses('all')} rounded-l-md`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('enabled')}
          className={getModeButtonClasses('enabled')}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('disabled')}
          className={`${getModeButtonClasses('disabled')} rounded-r-md`}
        >
          Disabled
        </button>
      </div>
    </div>
  );
}
