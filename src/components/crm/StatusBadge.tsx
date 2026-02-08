import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { LeadStatus, LeadQuality, LEAD_STATUS_CONFIG, LEAD_QUALITY_CONFIG } from '@/types/crm';

interface StatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, size = 'sm' }, ref) => {
    // Defensive fallback for unknown status values
    const config = LEAD_STATUS_CONFIG[status] ?? {
      title: status || 'Unknown',
      color: 'bg-gray-500',
      description: 'Unknown status',
    };
    
    return (
      <span 
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          config.color,
          'text-white',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        )}
      >
        {config.title}
      </span>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

interface QualityBadgeProps {
  quality: LeadQuality;
  size?: 'sm' | 'md';
}

export const QualityBadge = forwardRef<HTMLSpanElement, QualityBadgeProps>(
  ({ quality, size = 'sm' }, ref) => {
    // Defensive fallback for unknown quality values
    const config = LEAD_QUALITY_CONFIG[quality] ?? {
      label: quality || 'Unknown',
      color: 'bg-gray-100 text-gray-600',
    };
    
    return (
      <span 
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          config.color,
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        )}
      >
        {config.label}
      </span>
    );
  }
);
QualityBadge.displayName = 'QualityBadge';
