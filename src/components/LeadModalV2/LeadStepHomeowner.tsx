import { useState } from 'react';
import { Home } from 'lucide-react';

interface LeadStepHomeownerProps {
  onSelect: (value: boolean) => void;
  selected: boolean | null;
}

const OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: 'Yes, I own the home' },
  { value: false, label: 'No, I rent or other' },
];

export function LeadStepHomeowner({ onSelect, selected }: LeadStepHomeownerProps) {
  const [choosing, setChoosing] = useState<boolean | null>(null);

  const handleClick = (value: boolean) => {
    setChoosing(value);
    setTimeout(() => onSelect(value), 300);
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Home className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground" aria-live="polite">
          Do you own the home?
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        This affects your options and next steps.
      </p>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const isActive = choosing === opt.value || selected === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => handleClick(opt.value)}
              disabled={choosing !== null}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200
                ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50 text-foreground'
                }
                ${choosing !== null && choosing !== opt.value ? 'opacity-50' : ''}
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
