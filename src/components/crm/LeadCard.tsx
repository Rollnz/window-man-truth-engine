import { useMemo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { formatDistanceToNow } from 'date-fns';
import { User, Phone, DollarSign, Clock, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CRMLead, LEAD_QUALITY_CONFIG } from '@/types/crm';
import { QualityBadge } from './StatusBadge';

interface LeadCardProps {
  lead: CRMLead;
  index: number;
  onClick: (lead: CRMLead) => void;
}

export function LeadCard({ lead, index, onClick }: LeadCardProps) {
  const displayName = useMemo(() => {
    if (lead.first_name || lead.last_name) {
      return `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
    }
    return lead.email.split('@')[0];
  }, [lead.first_name, lead.last_name, lead.email]);

  const sourceToolLabel = useMemo(() => {
    if (!lead.original_source_tool) return null;
    return lead.original_source_tool
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [lead.original_source_tool]);

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(lead.created_at), { addSuffix: true });
  }, [lead.created_at]);

  const dealValue = lead.actual_deal_value || lead.estimated_deal_value || 0;

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(lead)}
          className={cn(
            'cursor-pointer transition-all duration-200 hover:shadow-md',
            'border border-border/50 bg-card',
            snapshot.isDragging && 'shadow-lg rotate-2 scale-105'
          )}
        >
          <CardContent className="p-3 space-y-2">
            {/* Header: Name + Quality */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm truncate">{displayName}</span>
              </div>
              <QualityBadge quality={lead.lead_quality} />
            </div>

            {/* Email */}
            <p className="text-xs text-muted-foreground truncate pl-6">
              {lead.email}
            </p>

            {/* Source Tool */}
            {sourceToolLabel && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>{sourceToolLabel}</span>
              </div>
            )}

            {/* Footer: Score, Value, Time */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {/* Engagement Score */}
                <div className="flex items-center gap-1" title="Engagement Score">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    lead.engagement_score >= 100 ? 'bg-green-500' :
                    lead.engagement_score >= 50 ? 'bg-amber-500' : 'bg-blue-500'
                  )} />
                  <span>{lead.engagement_score}</span>
                </div>

                {/* Deal Value */}
                {dealValue > 0 && (
                  <div className="flex items-center gap-1" title="Deal Value">
                    <DollarSign className="h-3 w-3" />
                    <span>{dealValue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>

            {/* Phone indicator */}
            {lead.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
