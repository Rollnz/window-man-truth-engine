import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TrendingDown, FileSearch, ShieldCheck, Users } from 'lucide-react';
import { useTickerStats } from '@/hooks/useTickerStats';

interface StatItem {
  icon: React.ReactNode;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  color: string;
}

function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  return { count, ref };
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return num.toLocaleString();
  }
  return num.toString();
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const { count, ref } = useCountUp(stat.value, 2000 + index * 200);

  return (
    <div 
      ref={ref}
      className="flex flex-col items-center text-center px-4 py-3"
    >
      <div className={cn("mb-2", stat.color)}>
        {stat.icon}
      </div>
      <div className={cn("text-2xl sm:text-3xl font-black tabular-nums", stat.color)}>
        {stat.prefix}
        {formatNumber(count)}
        {stat.suffix}
      </div>
      <div className="text-xs sm:text-sm text-slate-400 mt-1">
        {stat.label}
      </div>
    </div>
  );
}

export function AnimatedStatsBar() {
  const { total } = useTickerStats();

  const stats: StatItem[] = [
    {
      icon: <TrendingDown className="w-5 h-5" />,
      value: 4200000,
      prefix: '$',
      suffix: '+',
      label: 'Overcharges Detected',
      color: 'text-red-400',
    },
    {
      icon: <FileSearch className="w-5 h-5" />,
      value: total,
      suffix: '+',
      label: 'Quotes Analyzed',
      color: 'text-primary',
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      value: 94,
      suffix: '%',
      label: 'Red Flag Detection Rate',
      color: 'text-emerald-400',
    },
    {
      icon: <Users className="w-5 h-5" />,
      value: 8400,
      suffix: '+',
      label: 'Florida Homeowners Protected',
      color: 'text-amber-400',
    },
  ];

  return (
    <section className="relative bg-slate-900/80 backdrop-blur-sm border-y border-slate-800/50 py-6 overflow-hidden">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-primary/5 to-emerald-500/5 animate-pulse" />
      
      <div className="container relative px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>

      {/* Bottom highlight line */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>
    </section>
  );
}
