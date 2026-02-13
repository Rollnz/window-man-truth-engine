import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface WarningCardProps {
  severity: 'critical' | 'warning';
  label: string;
  detail: string;
  visible: boolean;
  reducedMotion: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function WarningCard({
  severity,
  label,
  detail,
  visible,
  reducedMotion,
  style,
  className,
}: WarningCardProps) {
  // Deterministic retrigger: increment animKey on each false→true transition
  const [animKey, setAnimKey] = useState(0);
  const prevVisible = useRef(false);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      setAnimKey(k => k + 1);
    }
    prevVisible.current = visible;
  }, [visible]);

  const isCritical = severity === 'critical';

  return (
    // Outer Wrapper: positioning + visibility gate
    // Opacity utilities live ONLY here
    <div
      className={cn(
        'transition-opacity duration-150',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className,
      )}
      style={style}
    >
      {/* Inner Wrapper: animation only — NO opacity utility classes */}
      <div
        key={animKey}
        className={cn(
          'will-change-transform',
          reducedMotion
            ? 'transition-opacity duration-300'
            : 'animate-glitch-pop',
        )}
      >
        <div
          className={cn(
            'bg-black/70 backdrop-blur-sm border-l-2 rounded-r-md px-3 py-2 max-w-[220px] md:max-w-[260px]',
            isCritical
              ? 'border-l-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              : 'border-l-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.4)]',
          )}
        >
          <div className="flex items-center gap-1.5">
            {/* Severity dot */}
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                isCritical ? 'bg-red-500' : 'bg-amber-400',
              )}
            />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-white/90 truncate">
              {label}
            </span>
          </div>
          <p className="text-[9px] md:text-[10px] text-white/60 mt-0.5 truncate">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}
