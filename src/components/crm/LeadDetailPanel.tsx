import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { X, Mail, Phone, Calendar, DollarSign, Zap, Copy, Check, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CRMLead, LeadStatus } from '@/types/crm';
import { StatusBadge, QualityBadge } from './StatusBadge';
import { QuickUpdateForm } from './QuickUpdateForm';
import { EventTimeline } from '@/components/admin/EventTimeline';

interface TimelineEvent {
  id: string;
  event_name: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  created_at: string;
  session_id: string;
}

interface LeadDetailPanelProps {
  lead: CRMLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (leadId: string, newStatus: LeadStatus, extras: {
    actualDealValue?: number;
    notes?: string;
    estimatedDealValue?: number;
  }) => Promise<boolean>;
}

export function LeadDetailPanel({ lead, isOpen, onClose, onUpdate }: LeadDetailPanelProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch session events when lead changes
  useEffect(() => {
    if (!lead?.original_session_id || !isOpen) {
      setEvents([]);
      return;
    }

    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await supabase.functions.invoke('admin-attribution', {
          body: null,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.data?.events) {
          const sessionEvents = response.data.events.filter(
            (e: TimelineEvent) => e.session_id === lead.original_session_id
          );
          setEvents(sessionEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [lead?.original_session_id, isOpen]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!lead) return null;

  const displayName = lead.first_name || lead.last_name 
    ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
    : lead.email.split('@')[0];

  const dealValue = lead.actual_deal_value || lead.estimated_deal_value || 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{displayName}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={lead.status} size="md" />
                <QualityBadge quality={lead.lead_quality} size="md" />
              </div>
            </div>
          </div>
          {/* Open Command Center Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              onClose();
              navigate(`/admin/leads/${lead.id}`);
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Open Command Center
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contact Info
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(lead.email, 'email')}
                >
                  {copiedField === 'email' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {lead.phone && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.phone}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(lead.phone!, 'phone')}
                  >
                    {copiedField === 'phone' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Attribution */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Attribution
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs">Source Tool</span>
                </div>
                <p className="text-sm font-medium">
                  {lead.original_source_tool?.split('-').map(w => 
                    w.charAt(0).toUpperCase() + w.slice(1)
                  ).join(' ') || 'Unknown'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Deal Value</span>
                </div>
                <p className="text-sm font-medium">
                  ${dealValue.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Created</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(lead.created_at), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-muted-foreground mb-1">
                  <span className="text-xs">Engagement Score</span>
                </div>
                <p className="text-sm font-medium">
                  {lead.engagement_score} pts
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Update Form */}
          <QuickUpdateForm 
            lead={lead} 
            onUpdate={onUpdate}
            onClose={onClose}
          />

          <Separator />

          {/* Journey Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Journey Timeline
            </h3>
            
            {lead.original_session_id ? (
              <EventTimeline 
                events={events} 
                isLoading={isLoadingEvents}
                emptyMessage="No events found for this session"
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No session data available
              </p>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Notes
                </h3>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
