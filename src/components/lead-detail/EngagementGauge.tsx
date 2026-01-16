import { cn } from '@/lib/utils';
import { Flame, Thermometer, Snowflake } from 'lucide-react';

interface EngagementGaugeProps {
  score: number;
  className?: string;
}

export function EngagementGauge({ score, className }: EngagementGaugeProps) {
  const getConfig = () => {
    if (score >= 150) {
      return {
        label: 'Qualified',
        color: 'text-red-500',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/50',
        icon: Flame,
        percentage: 100,
      };
    }
    if (score >= 100) {
      return {
        label: 'Hot',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/50',
        icon: Flame,
        percentage: Math.min(100, (score / 150) * 100),
      };
    }
    if (score >= 50) {
      return {
        label: 'Warm',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/50',
        icon: Thermometer,
        percentage: Math.min(100, (score / 150) * 100),
      };
    }
    return {
      label: 'Cold',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/50',
      icon: Snowflake,
      percentage: Math.min(100, (score / 150) * 100),
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg border p-3', config.bgColor, config.borderColor, className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', config.color)} />
          <span className={cn('font-semibold text-sm', config.color)}>{config.label}</span>
        </div>
        <span className={cn('text-lg font-bold', config.color)}>{score}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', config.color.replace('text-', 'bg-'))}
          style={{ width: `${config.percentage}%` }}
        />
      </div>
    </div>
  );
}
