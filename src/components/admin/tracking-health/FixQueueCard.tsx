import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FixQueueCardProps {
  pendingCount: number;
  deadLetterCount: number;
  resolvedToday: number;
  oldestPending: string | null;
  byDestination: Record<string, number>;
  isLoading?: boolean;
  onRetryAll?: () => Promise<void>;
}

const destinationLabels: Record<string, string> = {
  meta_capi: 'Meta CAPI',
  google_ec: 'Google EC',
  gtm_server: 'GTM Server',
  supabase: 'Supabase',
};

export function FixQueueCard({
  pendingCount,
  deadLetterCount,
  resolvedToday,
  oldestPending,
  byDestination,
  isLoading,
  onRetryAll,
}: FixQueueCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleRetryAll = async () => {
    if (!onRetryAll) return;
    setIsRetrying(true);
    try {
      await onRetryAll();
      toast({
        title: 'Retry initiated',
        description: `Retrying ${pendingCount} failed events...`,
      });
    } catch (error) {
      toast({
        title: 'Retry failed',
        description: 'Could not initiate retry. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>Fix Queue</span>
            <Skeleton className="h-4 w-4 badge-shimmer" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-8 w-12 badge-shimmer" />
            <Skeleton className="h-4 w-16 badge-shimmer" />
          </div>
          <Skeleton className="h-9 w-full rounded-md badge-shimmer" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-20 rounded-full badge-shimmer" />
            <Skeleton className="h-4 w-28 badge-shimmer" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = pendingCount > 0 || deadLetterCount > 0;
  const queueColor = pendingCount > 20 ? 'text-red-500' : pendingCount > 0 ? 'text-amber-500' : 'text-green-500';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>Fix Queue</span>
          {hasIssues ? (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-3xl font-bold tabular-nums', queueColor)}>
            {pendingCount}
          </span>
          <span className="text-sm text-muted-foreground">Pending</span>
        </div>

        {pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3"
            onClick={handleRetryAll}
            disabled={isRetrying || !onRetryAll}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRetrying && 'animate-spin')} />
            {isRetrying ? 'Retrying...' : 'Retry All'}
          </Button>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm">
          {deadLetterCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {deadLetterCount} Dead Letter
            </Badge>
          )}
          {resolvedToday > 0 && (
            <span className="text-green-500 text-xs">
              ✓ {resolvedToday} resolved today
            </span>
          )}
        </div>

        {Object.keys(byDestination).length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
              By destination
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {Object.entries(byDestination).map(([dest, count]) => (
                <div key={dest} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{destinationLabels[dest] || dest}</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {count}
                  </Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {oldestPending && (
          <p className="text-xs text-muted-foreground mt-2">
            Oldest: {new Date(oldestPending).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
