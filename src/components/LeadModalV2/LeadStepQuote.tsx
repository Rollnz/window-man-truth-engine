import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { HasQuote } from './types';

interface LeadStepQuoteProps {
  onSelect: (value: HasQuote) => void;
  selected: HasQuote | null;
}

const OPTIONS: { value: HasQuote; label: string }[] = [
  { value: 'yes', label: 'Yes, I have a written estimate' },
  { value: 'getting', label: "I'm getting quotes now" },
  { value: 'no', label: 'Not yet' },
];

export function LeadStepQuote({ onSelect, selected }: LeadStepQuoteProps) {
  const [choosing, setChoosing] = useState<HasQuote | null>(null);

  const handleClick = (value: HasQuote) => {
    setChoosing(value);
    setTimeout(() => onSelect(value), 300);
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground" aria-live="polite">
          Do you already have a written estimate?
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        We can help you evaluate it.
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
