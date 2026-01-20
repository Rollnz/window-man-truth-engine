/**
 * Conversion Path Timeline
 * 
 * Vertical timeline showing every cv_ event the lead triggered.
 * Provides sales reps with a "cheat sheet" of customer engagement.
 */

import { useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  DollarSign, 
  FileSearch, 
  Calculator, 
  MessageCircle, 
  Shield, 
  Zap,
  Target,
  BookOpen,
  AlertTriangle,
  Award,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ConversionEvent {
  id: string;
  event_name: string;
  created_at: string;
  event_data?: Record<string, unknown> | null;
}

interface ConversionPathTimelineProps {
  events: ConversionEvent[];
  maxEvents?: number;
  className?: string;
}

/**
 * Map event names to display info
 */
const EVENT_CONFIG: Record<string, { 
  label: string; 
  icon: typeof DollarSign; 
  delta: number;
  color: string;
}> = {
  'cv_fair_price_quiz_completed': { 
    label: 'Fair Price Quiz', 
    icon: Calculator, 
    delta: 20,
    color: 'text-blue-500'
  },
  'cv_quote_scanned': { 
    label: 'Quote Scanned', 
    icon: FileSearch, 
    delta: 25,
    color: 'text-green-500'
  },
  'cv_quote_generated': { 
    label: 'Quote Generated', 
    icon: DollarSign, 
    delta: 25,
    color: 'text-green-500'
  },
  'cv_reality_check_completed': { 
    label: 'Reality Check', 
    icon: Target, 
    delta: 15,
    color: 'text-amber-500'
  },
  'cv_risk_diagnostic_completed': { 
    label: 'Risk Diagnostic', 
    icon: Shield, 
    delta: 15,
    color: 'text-purple-500'
  },
  'cv_vulnerability_test_completed': { 
    label: 'Vulnerability Test', 
    icon: AlertTriangle, 
    delta: 15,
    color: 'text-red-500'
  },
  'cv_roleplay_completed': { 
    label: 'Roleplay Training', 
    icon: MessageCircle, 
    delta: 20,
    color: 'text-indigo-500'
  },
  'cv_fast_win_completed': { 
    label: 'Fast Win Finder', 
    icon: Zap, 
    delta: 15,
    color: 'text-yellow-500'
  },
  'cv_cost_calculator_completed': { 
    label: 'Cost Calculator', 
    icon: Calculator, 
    delta: 15,
    color: 'text-blue-500'
  },
  'cv_expert_chat_session': { 
    label: 'Expert Chat', 
    icon: MessageCircle, 
    delta: 20,
    color: 'text-cyan-500'
  },
  'cv_guide_downloaded': { 
    label: 'Guide Downloaded', 
    icon: BookOpen, 
    delta: 15,
    color: 'text-teal-500'
  },
  'cv_lead_captured': { 
    label: 'Lead Captured', 
    icon: Award, 
    delta: 30,
    color: 'text-green-600'
  },
  'cv_consultation_booked': { 
    label: 'Consultation Booked', 
    icon: TrendingUp, 
    delta: 50,
    color: 'text-emerald-600'
  },
};

// Fallback config for unknown events
const DEFAULT_EVENT_CONFIG = {
  label: 'Engagement',
  icon: Zap,
  delta: 5,
  color: 'text-muted-foreground'
};

export function ConversionPathTimeline({ 
  events, 
  maxEvents = 25,
  className 
}: ConversionPathTimelineProps) {
  // Filter for conversion events (cv_ prefix) and sort by time
  const conversionEvents = useMemo(() => {
    return events
      .filter(e => e.event_name.startsWith('cv_'))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, maxEvents);
  }, [events, maxEvents]);
  
  // Calculate total delta value
  const totalDelta = useMemo(() => {
    return conversionEvents.reduce((sum, event) => {
      const config = EVENT_CONFIG[event.event_name] || DEFAULT_EVENT_CONFIG;
      return sum + config.delta;
    }, 0);
  }, [conversionEvents]);
  
  if (conversionEvents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Conversion Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No conversion events recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Conversion Path
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            +{totalDelta} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
          
          {/* Events */}
          <div className="space-y-3">
            {conversionEvents.map((event, index) => {
              const config = EVENT_CONFIG[event.event_name] || {
                ...DEFAULT_EVENT_CONFIG,
                label: event.event_name.replace('cv_', '').replace(/_/g, ' ')
              };
              const Icon = config.icon;
              const isFirst = index === 0;
              
              // Extract metadata if available
              const quoteAmount = event.event_data?.quote_amount as number | undefined;
              const score = event.event_data?.score as number | undefined;
              
              return (
                <div key={event.id} className="relative flex items-start gap-3 pl-0">
                  {/* Timeline dot */}
                  <div className={cn(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background',
                    isFirst ? 'border-primary' : 'border-muted'
                  )}>
                    <Icon className={cn('h-3 w-3', config.color)} />
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">
                        {config.label}
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium flex-shrink-0">
                        +{config.delta}
                      </span>
                    </div>
                    
                    {/* Metadata row */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'h:mm a')}
                      </span>
                      {quoteAmount && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          ${quoteAmount.toLocaleString()}
                        </Badge>
                      )}
                      {score && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          Score: {score}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {events.filter(e => e.event_name.startsWith('cv_')).length > maxEvents && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Showing last {maxEvents} events
          </p>
        )}
      </CardContent>
    </Card>
  );
}
