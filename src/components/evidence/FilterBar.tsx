import { MissionType, missionTypeLabels } from '@/data/evidenceData';
import { cn } from '@/lib/utils';
import { Flame, CloudLightning, Volume2, Lock, PiggyBank, LayoutGrid } from 'lucide-react';

interface FilterBarProps {
  activeFilter: MissionType | 'all';
  onFilterChange: (filter: MissionType | 'all') => void;
}

const filterIcons: Record<MissionType | 'all', React.ReactNode> = {
  all: <LayoutGrid className="w-4 h-4" />,
  heat: <Flame className="w-4 h-4" />,
  hurricane: <CloudLightning className="w-4 h-4" />,
  noise: <Volume2 className="w-4 h-4" />,
  security: <Lock className="w-4 h-4" />,
  cost: <PiggyBank className="w-4 h-4" />,
};

const filterOrder: (MissionType | 'all')[] = ['all', 'heat', 'hurricane', 'noise', 'security', 'cost'];

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-2 min-w-max md:flex-wrap md:justify-center">
        {filterOrder.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 whitespace-nowrap',
              activeFilter === filter
                ? 'bg-primary/10 border-primary text-primary shadow-md'
                : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:shadow-sm'
            )}
          >
            {filterIcons[filter]}
            <span>{missionTypeLabels[filter]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
