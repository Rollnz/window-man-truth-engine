import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveWasteCounterProps {
  dailyWaste: number;
}

export function LiveWasteCounter({ dailyWaste }: LiveWasteCounterProps) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 200);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate waste per second
  const wastePerSecond = dailyWaste / 86400; // 86400 seconds in a day
  const wastedSinceOpen = wastePerSecond * secondsElapsed;

  return (
    <Card className={cn(
      'bg-destructive/10 border-destructive/30 transition-all duration-200',
      isPulsing && 'shadow-[0_0_30px_hsl(var(--destructive)/0.3)]'
    )}>
      <CardContent className="py-6">
        <div className="flex items-center justify-center gap-3">
          <AlertTriangle className={cn(
            'h-6 w-6 text-destructive transition-transform duration-200',
            isPulsing && 'scale-110'
          )} />
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Money wasted since you opened this page
            </p>
            <p className={cn(
              'text-3xl sm:text-4xl font-bold text-destructive transition-all duration-200',
              isPulsing && 'scale-105'
            )}>
              ${wastedSinceOpen.toFixed(4)}
            </p>
          </div>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-3">
          Based on ${dailyWaste.toFixed(2)}/day in energy waste
        </p>
      </CardContent>
    </Card>
  );
}
