import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Draggable } from '@hello-pangea/dnd';
import { formatDistanceToNow } from 'date-fns';
import { User, Phone, DollarSign, Zap, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CRMLead } from '@/types/crm';
import { QualityBadge } from './StatusBadge';
import { LeadVelocityBadge } from './LeadVelocityBadge';

interface LeadCardProps {
  lead: CRMLead;
  index: number;
  onClick: (lead: CRMLead) => void;
}

export function LeadCard({ lead, index, onClick }: LeadCardProps) {
  const navigate = useNavigate();
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

  // Use updated_at as "stage entered at" for velocity tracking
  const stageEnteredAt = useMemo(() => {
    return lead.updated_at || lead.created_at;
  }, [lead.updated_at, lead.created_at]);

  const dealValue = lead.actual_deal_value || lead.estimated_deal_value || 0;
  
  // Multi-touch attribution detection
  // Primary: Click IDs (gclid/fbclid) - indicates paid ad click
  // Fallback: UTM source - indicates organic or untracked paid
  const hasGoogleClickId = !!lead.gclid;
  const hasMetaClickId = !!lead.fbclid;
  
  // UTM fallback when click IDs are blocked/missing
  const utmSource = lead.utm_source?.toLowerCase() || '';
  const hasGoogleUTM = !hasGoogleClickId && 
    ['google', 'google_ads', 'gads', 'adwords'].includes(utmSource);
  const hasMetaUTM = !hasMetaClickId && 
    ['facebook', 'meta', 'instagram', 'fb', 'ig'].includes(utmSource);
  
  // Display logic - show both if lead touched both platforms (high-touch lead)
  const showGoogleBadge = hasGoogleClickId || hasGoogleUTM;
  const showMetaBadge = hasMetaClickId || hasMetaUTM;

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
            {/* Header: Name + Quality + Attribution Badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm truncate">{displayName}</span>
                
                {/* Ad Attribution Platform Badges - supports multi-touch */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {showGoogleBadge && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "text-[10px] font-bold px-1 rounded cursor-default",
                            hasGoogleClickId 
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" // Click ID (solid)
                              : "bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700" // UTM (outline)
                          )}>
                            G
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {hasGoogleClickId ? 'Google Ads (gclid)' : 'Google (UTM source)'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {showMetaBadge && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "text-[10px] font-bold px-1 rounded cursor-default",
                            hasMetaClickId 
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" // Click ID (solid)
                              : "bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700" // UTM (outline)
                          )}>
                            M
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {hasMetaClickId ? 'Meta Ads (fbclid)' : 'Meta (UTM source)'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                
                {/* Velocity Badge */}
                <LeadVelocityBadge 
                  status={lead.status} 
                  stageEnteredAt={stageEnteredAt}
                  compact
                />
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

              {/* Time - using formatDistanceToNow directly */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
              </div>
            </div>

            {/* Phone indicator */}
            {lead.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </div>
            )}

            {/* View Profile Button */}
            <div className="pt-2 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs gap-1 hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/leads/${lead.id}`);
                }}
              >
                <ExternalLink className="h-3 w-3" />
                View Full Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
