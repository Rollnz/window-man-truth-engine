/**
 * Lead Velocity Badge
 * 
 * Visual indicator showing how long a lead has been in the current stage.
 * Fire = hot/new, Snowflake = cold/stale, AlertTriangle = needs attention
 */

import { useMemo, useState, useEffect } from 'react';
import { Flame, Snowflake, AlertTriangle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  getVelocityStatus, 
  getTimeInStage, 
  STAGE_SLA_CONFIG,
  type VelocityStatus 
} from '@/config/stageSLA';
import type { LeadStatus } from '@/types/crm';

interface LeadVelocityBadgeProps {
  status: LeadStatus;
  /** When the lead entered this stage (usually updated_at) */
  stageEnteredAt: Date | string;
  /** Show compact version (icon only) */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

const VELOCITY_ICONS: Record<VelocityStatus, typeof Flame> = {
  hot: Flame,
  warm: Clock,
  stale: AlertTriangle,
  cold: Snowflake,
};

const VELOCITY_STYLES: Record<VelocityStatus, string> = {
  hot: 'text-orange-500 dark:text-orange-400',
  warm: 'text-amber-500 dark:text-amber-400',
  stale: 'text-red-500 dark:text-red-400 animate-pulse',
  cold: 'text-blue-400 dark:text-blue-300',
};

const VELOCITY_BG_STYLES: Record<VelocityStatus, string> = {
  hot: 'bg-orange-100 dark:bg-orange-900/30',
  warm: 'bg-amber-100 dark:bg-amber-900/30',
  stale: 'bg-red-100 dark:bg-red-900/30',
  cold: 'bg-blue-100 dark:bg-blue-900/30',
};

export function LeadVelocityBadge({ 
  status, 
  stageEnteredAt, 
  compact = true,
  className 
}: LeadVelocityBadgeProps) {
  // Refresh velocity status every 60 seconds
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);
  
  const velocityData = useMemo(() => {
    const velocityStatus = getVelocityStatus(status, stageEnteredAt);
    const timeInStage = getTimeInStage(stageEnteredAt);
    const config = STAGE_SLA_CONFIG[status];
    
    return {
      status: velocityStatus,
      time: timeInStage,
      slaWarning: config.warningMinutes,
      slaStale: config.staleMinutes,
    };
  }, [status, stageEnteredAt]);
  
  const tooltipContent = useMemo(() => {
    const statusLabel = {
      hot: 'Fresh lead',
      warm: 'Needs attention soon',
      stale: 'URGENT: Going cold!',
      cold: 'Inactive',
    }[velocityData.status];
    
    return (
      <div className="text-xs space-y-1">
        <p className="font-medium">{statusLabel}</p>
        <p>Time in stage: {velocityData.time}</p>
        {velocityData.status !== 'hot' && velocityData.slaStale !== Infinity && (
          <p className="text-muted-foreground">
            SLA: Act within {velocityData.slaStale}min
          </p>
        )}
      </div>
    );
  }, [velocityData]);
  
  // Don't show badge for terminal stages (after all hooks)
  if (velocityData.slaStale === Infinity) {
    return null;
  }
  
  const Icon = VELOCITY_ICONS[velocityData.status];
  const iconStyle = VELOCITY_STYLES[velocityData.status];
  const bgStyle = VELOCITY_BG_STYLES[velocityData.status];
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center justify-center rounded-full p-1',
              bgStyle,
              className
            )}>
              <Icon className={cn('h-3 w-3', iconStyle)} />
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
            bgStyle,
            iconStyle,
            className
          )}>
            <Icon className="h-3 w-3" />
            <span>{velocityData.time}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
