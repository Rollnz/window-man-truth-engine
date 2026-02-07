import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HealthStatus } from './types';

interface HealthStatusCardProps {
  status: HealthStatus;
  reason: string;
  isLoading?: boolean;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: 'Healthy',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-500',
    borderColor: 'border-green-500/20',
    badgeVariant: 'default' as const,
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Degraded',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-500/20',
    badgeVariant: 'secondary' as const,
  },
  critical: {
    icon: XCircle,
    label: 'Critical',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
    borderColor: 'border-red-500/20',
    badgeVariant: 'destructive' as const,
  },
};

export function HealthStatusCard({ status, reason, isLoading }: HealthStatusCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>System Status</span>
            <Activity className="h-4 w-4 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden border', config.borderColor)}>
      <div className={cn('absolute inset-0 opacity-30', config.bgColor)} />
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>System Status</span>
          <Icon className={cn('h-4 w-4', config.textColor)} />
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('w-3 h-3 rounded-full', config.textColor.replace('text-', 'bg-'))} />
          <span className={cn('text-2xl font-bold', config.textColor)}>{config.label}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{reason}</p>
      </CardContent>
    </Card>
  );
}
