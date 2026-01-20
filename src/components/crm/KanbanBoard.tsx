import { useCallback, useMemo, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { CRMLead, LeadStatus, KANBAN_COLUMNS } from '@/types/crm';
import { KanbanColumn } from './KanbanColumn';
import { LeadDetailPanel } from './LeadDetailPanel';

interface KanbanBoardProps {
  leads: CRMLead[];
  onStatusChange: (leadId: string, newStatus: LeadStatus, extras?: {
    actualDealValue?: number;
    notes?: string;
    estimatedDealValue?: number;
  }) => Promise<boolean>;
}

export function KanbanBoard({ leads, onStatusChange }: KanbanBoardProps) {
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Group leads by status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, CRMLead[]> = {
      new: [],
      qualifying: [],
      mql: [],
      qualified: [],
      appointment_set: [],
      sat: [],
      closed_won: [],
      closed_lost: [],
      dead: [],
    };

    leads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    // Sort each column by created_at (newest first)
    Object.keys(grouped).forEach(status => {
      grouped[status as LeadStatus].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return grouped;
  }, [leads]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as LeadStatus;
    await onStatusChange(draggableId, newStatus);
  }, [onStatusChange]);

  const handleLeadClick = useCallback((lead: CRMLead) => {
    setSelectedLead(lead);
    setIsPanelOpen(true);
  }, []);

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedLead(null), 300);
  }, []);

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              leads={leadsByStatus[status]}
              onLeadClick={handleLeadClick}
            />
          ))}
        </div>
      </DragDropContext>

      <LeadDetailPanel
        lead={selectedLead}
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        onUpdate={onStatusChange}
      />
    </>
  );
}
