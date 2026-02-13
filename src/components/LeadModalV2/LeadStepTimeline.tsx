import { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { Timeline } from './types';

interface LeadStepTimelineProps {
  onSelect: (value: Timeline) => void;
  selected: Timeline | null;
}

const OPTIONS: { value: Timeline; label: string }[] = [
  { value: '30days', label: 'Within 30 days' },
  { value: '90days', label: 'Within 90 days' },
  { value: '6months', label: 'Within 6 months' },
  { value: 'research', label: 'Just researching' },
];

export function LeadStepTimeline({ onSelect, selected }: LeadStepTimelineProps) {
  const [choosing, setChoosing] = useState<Timeline | null>(null);

  const handleClick = (value: Timeline) => {
    setChoosing(value);
    setTimeout(() => onSelect(value), 300);
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground" aria-live="polite">
          When are you planning your window project?
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        This helps us tailor your guidance.
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
