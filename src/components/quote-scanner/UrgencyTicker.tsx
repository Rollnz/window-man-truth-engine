import { useState, useEffect, useRef, useMemo } from 'react';
import { Shield } from 'lucide-react';

// Generates consistent "random" number for a date string
// Same seed = same number (no flickering on refresh)
const getDailyRandom = (seed: string, min: number, max: number) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const random = (Math.abs(hash) % 1000) / 1000;
  return Math.floor(random * (max - min + 1)) + min;
};

// easeOutExpo count animation
function useCountUp(end: number, duration: number = 2500) {
  const [count, setCount] = useState(0);
  const prevEndRef = useRef(0);

  useEffect(() => {
    if (end === prevEndRef.current) return;
    prevEndRef.current = end;
    
    if (end === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < duration) {
        const t = progress / duration;
        const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setCount(Math.floor(ease * end));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export function UrgencyTicker() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Dynamic date-based calculation with UPDATED VALUES
  const { total, today } = useMemo(() => {
    const startDate = new Date('2024-02-12'); // Updated start date
    const now = new Date();
    
    const daysPassed = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Today's count: seeded random 12-28
    const todayString = now.toISOString().split('T')[0];
    const todayCount = getDailyRandom(todayString, 12, 28);

    // Total: base + growth + today (UPDATED VALUES)
    const baseTotal = 0;
    const growthRate = 4.9;
    const currentTotal = Math.floor(baseTotal + (daysPassed * growthRate) + todayCount);

    return { total: currentTotal, today: todayCount };
  }, []);

  // Single IntersectionObserver for unified trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Both animate simultaneously
  const totalCount = useCountUp(isVisible ? total : 0, 2500);
  const todayCount = useCountUp(isVisible ? today : 0, 2500);

  return (
    <div ref={ref} className="flex items-center justify-center">
      <div className="inline-flex items-center divide-x divide-zinc-700/50 rounded-lg 
                      bg-zinc-900/70 border border-zinc-700/40 overflow-hidden 
                      shadow-xl backdrop-blur-sm ring-1 ring-white/5">
        
        {/* Left: Total Count */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-zinc-100 tabular-nums">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-400">quotes scanned</span>
        </div>

        {/* Right: Today Count */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 h-full">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full 
                           rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </div>
          <span className="text-sm font-semibold text-amber-300 tabular-nums">
            +{todayCount} today
          </span>
        </div>

      </div>
    </div>
  );
}
