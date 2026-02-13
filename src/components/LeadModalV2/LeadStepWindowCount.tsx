import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import type { WindowScope } from './types';

interface LeadStepWindowCountProps {
  onSelect: (value: WindowScope) => void;
  selected: WindowScope | null;
}

const OPTIONS: { value: WindowScope; label: string }[] = [
  { value: '1_5', label: '1 \u2013 5 windows' },
  { value: '6_15', label: '6 \u2013 15 windows' },
  { value: '16_plus', label: '16+ windows' },
  { value: 'whole_house', label: 'Whole house' },
];

export function LeadStepWindowCount({ onSelect, selected }: LeadStepWindowCountProps) {
  const [choosing, setChoosing] = useState<WindowScope | null>(null);

  const handleClick = (value: WindowScope) => {
    setChoosing(value);
    setTimeout(() => onSelect(value), 300);
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-2">
        <LayoutGrid className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground" aria-live="polite">
          Roughly how many windows?
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Helps us estimate your project scope.
      </p>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const isActive = choosing === opt.value || selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleClick(opt.value)}
              disabled={choosing !== null}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200
                ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50 text-foreground'
                }
                ${choosing !== null && !isActive ? 'opacity-50' : ''}
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
