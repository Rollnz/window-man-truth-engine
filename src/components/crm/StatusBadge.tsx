import { cn } from '@/lib/utils';
import { LeadStatus, LeadQuality, LEAD_STATUS_CONFIG, LEAD_QUALITY_CONFIG } from '@/types/crm';

interface StatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = LEAD_STATUS_CONFIG[status];
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.color,
      'text-white',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      {config.title}
    </span>
  );
}

interface QualityBadgeProps {
  quality: LeadQuality;
  size?: 'sm' | 'md';
}

export function QualityBadge({ quality, size = 'sm' }: QualityBadgeProps) {
  const config = LEAD_QUALITY_CONFIG[quality];
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.color,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      {config.label}
    </span>
  );
}
