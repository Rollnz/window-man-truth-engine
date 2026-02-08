import { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { useProjectedQuotes } from '@/hooks/useProjectedQuotes';

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

  // Use shared hook for quote calculations
  const { total, today } = useProjectedQuotes();

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
