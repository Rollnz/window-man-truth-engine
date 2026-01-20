/**
 * Intent Signals Summary
 * 
 * One-liner + expandable cards showing what the lead cares about.
 * Derived from tool usage patterns.
 */

import { useMemo, useState } from 'react';
import { 
  DollarSign, 
  Shield, 
  FileCheck, 
  Flame, 
  Handshake, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  deriveIntentSignals, 
  generateIntentSummary,
  type IntentCategory,
  type IntentSignal 
} from '@/lib/intentSignals';

interface ConversionEvent {
  event_name: string;
  event_data?: Record<string, unknown> | null;
}

interface IntentSignalsSummaryProps {
  events: ConversionEvent[];
  className?: string;
}

const INTENT_ICONS: Record<IntentCategory, typeof DollarSign> = {
  price: DollarSign,
  quality: Shield,
  insurance: FileCheck,
  urgency: Flame,
  negotiation: Handshake,
  research: BookOpen,
};

const INTENT_COLORS: Record<IntentCategory, string> = {
  price: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  quality: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  insurance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  urgency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  negotiation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  research: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

export function IntentSignalsSummary({ events, className }: IntentSignalsSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const signals = useMemo(() => {
    return deriveIntentSignals(events);
  }, [events]);
  
  const summary = useMemo(() => {
    return generateIntentSummary(signals);
  }, [signals]);
  
  if (signals.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Intent Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Not enough engagement data to determine intent.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const topSignals = signals.slice(0, 3);
  const hasMore = signals.length > 3;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Intent Signals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* One-liner summary */}
        <p className="text-sm font-medium text-foreground">
          {summary}
        </p>
        
        {/* Signal badges */}
        <div className="flex flex-wrap gap-2">
          {topSignals.map(signal => {
            const Icon = INTENT_ICONS[signal.category];
            return (
              <Badge 
                key={signal.category}
                variant="secondary"
                className={cn('flex items-center gap-1', INTENT_COLORS[signal.category])}
              >
                <Icon className="h-3 w-3" />
                {signal.label}
                <span className="opacity-60">({signal.strength})</span>
              </Badge>
            );
          })}
        </div>
        
        {/* Expandable talking points */}
        {(isExpanded || topSignals.length <= 2) && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sales Talking Points
            </p>
            {(isExpanded ? signals : topSignals).map(signal => (
              <div 
                key={signal.category}
                className="text-xs p-2 rounded bg-muted/50"
              >
                <span className="font-medium">{signal.label}:</span>{' '}
                <span className="text-muted-foreground">{signal.talkingPoint}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Expand/collapse button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show all {signals.length} signals
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
