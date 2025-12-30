import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ConfidenceMeterProps {
  onConfidenceSet: (level: number) => void;
}

const confidenceLevels = [
  { level: 1, label: 'Guessing', emoji: '🤔' },
  { level: 2, label: 'Unsure', emoji: '😐' },
  { level: 3, label: 'Fairly Sure', emoji: '🙂' },
  { level: 4, label: 'Confident', emoji: '😊' },
  { level: 5, label: 'Certain', emoji: '😎' },
];

export function ConfidenceMeter({ onConfidenceSet }: ConfidenceMeterProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  return (
    <div className="text-center mt-6 animate-fade-in">
      <p className="text-sm text-muted-foreground mb-3">
        How confident are you in your answer?
      </p>
      <div className="flex justify-center gap-2">
        {confidenceLevels.map(({ level, label, emoji }) => (
          <Button
            key={level}
            variant="outline"
            size="sm"
            className={`flex flex-col items-center p-2 h-auto transition-all ${
              hoveredLevel === level ? 'border-primary bg-primary/10' : ''
            }`}
            onMouseEnter={() => setHoveredLevel(level)}
            onMouseLeave={() => setHoveredLevel(null)}
            onClick={() => onConfidenceSet(level)}
          >
            <span className="text-lg">{emoji}</span>
            <span className="text-xs mt-1 hidden sm:block">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
