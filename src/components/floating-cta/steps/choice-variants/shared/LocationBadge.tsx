import { useState, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LocationPersonalization } from '@/hooks/useLocationPersonalization';

interface LocationBadgeProps {
  locationData: LocationPersonalization | null;
  isLoading: boolean;
  onResolveZip: (zip: string) => Promise<void>;
  className?: string;
}

/**
 * LocationBadge - Shows detected county or a compact ZIP input.
 *
 * When location is known: "Serving [City], [County] County"
 * When unknown: single-field ZIP input with "Where are you located?"
 * During resolution: "Analyzing [County] County requirements..."
 */
export function LocationBadge({
  locationData,
  isLoading,
  onResolveZip,
  className,
}: LocationBadgeProps) {
  const [zipInput, setZipInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    const clean = zipInput.replace(/\D/g, '').slice(0, 5);
    if (clean.length === 5) {
      await onResolveZip(clean);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-primary/5 border border-primary/20 text-primary',
          'text-xs font-medium badge-shimmer',
          className
        )}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>
          {locationData
            ? `Analyzing ${locationData.county} County requirements...`
            : 'Looking up your area...'}
        </span>
      </div>
    );
  }

  // Known location
  if (locationData) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
          'bg-primary/5 border border-primary/20 text-primary',
          'text-xs font-medium',
          className
        )}
      >
        <MapPin className="w-3 h-3" />
        <span>
          Serving {locationData.city}, {locationData.county} County
        </span>
      </div>
    );
  }

  // Unknown — compact ZIP input
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-muted/50 border border-border text-muted-foreground',
        'text-xs',
        className
      )}
    >
      <MapPin className="w-3 h-3 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={5}
        placeholder="Enter ZIP"
        value={zipInput}
        onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (zipInput.length === 5) handleSubmit();
        }}
        className={cn(
          'w-16 bg-transparent border-none outline-none',
          'text-xs text-foreground placeholder:text-muted-foreground',
          'focus:ring-0'
        )}
        aria-label="Enter your ZIP code"
      />
      {zipInput.length === 5 && (
        <button
          onClick={handleSubmit}
          className="text-primary font-medium hover:underline"
        >
          Go
        </button>
      )}
    </div>
  );
}
