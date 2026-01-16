import { 
  Eye, 
  Calculator, 
  MessageSquare, 
  Upload, 
  FileText, 
  Target, 
  CheckCircle,
  Play,
  Award,
  AlertTriangle,
  Zap,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { LeadEvent } from '@/hooks/useLeadDetail';

interface TimelineEventCardProps {
  event: LeadEvent;
  isFirst?: boolean;
  isLast?: boolean;
  isFacebookSource?: boolean;
}

export function TimelineEventCard({ event, isFirst, isLast, isFacebookSource }: TimelineEventCardProps) {
  const getEventConfig = () => {
    const name = event.event_name.toLowerCase();
    const category = event.event_category?.toLowerCase() || '';

    // Tool completions
    if (name.includes('quote_scanned') || name.includes('scanner')) {
      return { icon: FileText, color: 'bg-purple-500', label: 'Quote Scanned' };
    }
    if (name.includes('quote_generated') || name.includes('estimate')) {
      return { icon: Calculator, color: 'bg-blue-500', label: 'Quote Generated' };
    }
    if (name.includes('reality_check')) {
      return { icon: Target, color: 'bg-cyan-500', label: 'Reality Check' };
    }
    if (name.includes('risk_diagnostic')) {
      return { icon: AlertTriangle, color: 'bg-amber-500', label: 'Risk Diagnostic' };
    }
    if (name.includes('fair_price') || name.includes('quiz')) {
      return { icon: Award, color: 'bg-green-500', label: 'Fair Price Quiz' };
    }
    if (name.includes('fast_win')) {
      return { icon: Zap, color: 'bg-yellow-500', label: 'Fast Win' };
    }
    if (name.includes('vulnerability')) {
      return { icon: AlertTriangle, color: 'bg-red-500', label: 'Vulnerability Test' };
    }
    if (name.includes('cost_calculator')) {
      return { icon: Calculator, color: 'bg-indigo-500', label: 'Cost Calculator' };
    }
    if (name.includes('roleplay')) {
      return { icon: MessageSquare, color: 'bg-pink-500', label: 'Roleplay' };
    }
    
    // Engagement events
    if (name.includes('lead_captured')) {
      return { icon: CheckCircle, color: 'bg-green-600', label: 'Lead Captured' };
    }
    if (name.includes('consultation')) {
      return { icon: CheckCircle, color: 'bg-emerald-500', label: 'Consultation Booked' };
    }
    if (name.includes('guide_downloaded') || name.includes('download')) {
      return { icon: BookOpen, color: 'bg-orange-500', label: 'Guide Downloaded' };
    }
    if (name.includes('document_uploaded') || name.includes('upload')) {
      return { icon: Upload, color: 'bg-violet-500', label: 'Document Uploaded' };
    }
    if (name.includes('expert_chat') || name.includes('chat')) {
      return { icon: MessageSquare, color: 'bg-blue-400', label: 'Expert Chat' };
    }
    if (name.includes('vault_sync')) {
      return { icon: CheckCircle, color: 'bg-teal-500', label: 'Vault Sync' };
    }
    
    // Started events
    if (name.includes('_started') || name.includes('start')) {
      return { icon: Play, color: 'bg-gray-400', label: event.event_name.replace(/_/g, ' ') };
    }
    
    // Page views
    if (category === 'pageview' || name.includes('view')) {
      return { icon: Eye, color: 'bg-gray-300', label: 'Page View' };
    }

    // Default
    return { icon: Eye, color: 'bg-gray-400', label: event.event_name.replace(/_/g, ' ') };
  };

  const config = getEventConfig();
  const Icon = config.icon;

  const getEventDetails = (): string[] => {
    const details: string[] = [];
    
    if (event.page_path) {
      details.push(event.page_path);
    }
    
    if (event.event_data && typeof event.event_data === 'object') {
      const data = event.event_data as Record<string, unknown>;
      if (data.tool_name) details.push(`Tool: ${data.tool_name}`);
      if (data.score !== undefined) details.push(`Score: ${data.score}`);
      if (data.result) details.push(`Result: ${data.result}`);
    }
    
    return details;
  };

  const details = getEventDetails();

  return (
    <div className="flex gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            config.color,
            isFacebookSource && isFirst && 'ring-2 ring-blue-400 ring-offset-2'
          )}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        {!isLast && <div className="w-0.5 bg-border flex-1 mt-2" />}
      </div>

      {/* Content */}
      <div className="pb-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm capitalize">{config.label}</p>
            {details.map((detail, i) => (
              <p key={i} className="text-xs text-muted-foreground truncate max-w-xs">
                {detail}
              </p>
            ))}
          </div>
          <time className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(event.created_at), 'h:mm a')}
          </time>
        </div>
      </div>
    </div>
  );
}
