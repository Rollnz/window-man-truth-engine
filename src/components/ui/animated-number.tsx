import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}
export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 1500,
  decimals = 0,
  className
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const difference = endValue - startValue;
    if (difference === 0) return;
    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + difference * easeOut;
      setDisplayValue(currentValue);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, displayValue]);
  const formattedValue = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return <span className={cn("tabular-nums text-green-400", className)}>
      {prefix}{formattedValue}{suffix}
    </span>;
}