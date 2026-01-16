import { useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { CRMLead, LeadStatus, LEAD_STATUS_CONFIG } from '@/types/crm';
import { LeadCard } from './LeadCard';

interface KanbanColumnProps {
  status: LeadStatus;
  leads: CRMLead[];
  onLeadClick: (lead: CRMLead) => void;
}

export function KanbanColumn({ status, leads, onLeadClick }: KanbanColumnProps) {
  const config = LEAD_STATUS_CONFIG[status];
  
  const totalValue = useMemo(() => {
    return leads.reduce((sum, lead) => 
      sum + (lead.actual_deal_value || lead.estimated_deal_value || 0), 0
    );
  }, [leads]);

  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[300px]">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 rounded-t-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', config.color)} />
          <h3 className="font-semibold text-sm">{config.title}</h3>
          <span className="flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-muted">
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-muted-foreground">
            ${totalValue.toLocaleString()}
          </span>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-2 space-y-2 overflow-y-auto',
              'border-x border-b border-border rounded-b-lg',
              'min-h-[200px] max-h-[calc(100vh-300px)]',
              snapshot.isDraggingOver && 'bg-primary/5 border-primary/30'
            )}
          >
            {leads.map((lead, index) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                index={index}
                onClick={onLeadClick}
              />
            ))}
            {provided.placeholder}
            
            {leads.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                No leads
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
