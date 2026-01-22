import { useState } from 'react';
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { track } from '@/lib/tracking';
import type { RedFlag } from '@/hooks/useExecutiveProfit';

interface RedFlagsPanelProps {
  redFlags: RedFlag[];
  isLoading: boolean;
}

function RedFlagItem({ flag }: { flag: RedFlag }) {
  const handleClick = () => {
    track('exec_red_flag_clicked', {
      page_path: '/admin/executive',
      section_id: 'red-flags',
      filters: {
        flag_type: flag.type,
        severity: flag.severity,
      },
    });
  };

  const isCritical = flag.severity === 'critical';

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
        isCritical
          ? 'border-destructive/50 bg-destructive/5'
          : 'border-warning/50 bg-warning/5'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {isCritical ? (
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        )}
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <Badge
              variant={isCritical ? 'destructive' : 'outline'}
              className={!isCritical ? 'border-warning text-warning' : ''}
            >
              {isCritical ? 'Critical' : 'Warning'}
            </Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {flag.type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm font-medium">{flag.message}</p>
          <p className="text-xs text-muted-foreground">{flag.action}</p>
        </div>
      </div>
    </div>
  );
}

export function RedFlagsPanel({ redFlags, isLoading }: RedFlagsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (redFlags.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">All Clear</p>
              <p className="text-xs text-muted-foreground">No red flags detected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleFlags = expanded ? redFlags : redFlags.slice(0, 3);
  const hasMore = redFlags.length > 3;
  const criticalCount = redFlags.filter((f) => f.severity === 'critical').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Red Flags</CardTitle>
            <Badge variant="destructive" className="h-5">
              {redFlags.length}
            </Badge>
            {criticalCount > 0 && (
              <Badge variant="outline" className="h-5 text-xs border-destructive text-destructive">
                {criticalCount} critical
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleFlags.map((flag, i) => (
          <RedFlagItem key={`${flag.type}-${i}`} flag={flag} />
        ))}

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show {redFlags.length - 3} More
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
