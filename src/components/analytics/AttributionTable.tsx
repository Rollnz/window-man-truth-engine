import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AttributionRow } from '@/hooks/useAnalyticsDashboard';

interface AttributionTableProps {
  attribution: AttributionRow[];
  isLoading: boolean;
}

export function AttributionTable({ attribution, isLoading }: AttributionTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attribution Breakdown (90 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (attribution.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attribution Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          No attribution data available
        </CardContent>
      </Card>
    );
  }

  const maxLeads = Math.max(...attribution.map((a) => a.lead_count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attribution Breakdown (90 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Medium</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Qualified</TableHead>
              <TableHead className="text-right">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attribution.slice(0, 15).map((row, index) => {
              const barWidth = maxLeads > 0 ? (row.lead_count / maxLeads) * 100 : 0;
              
              const qualRateBadge = row.qualification_rate >= 20
                ? 'bg-green-500/10 text-green-600'
                : row.qualification_rate >= 10
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-red-500/10 text-red-600';

              return (
                <TableRow key={`${row.utm_source}-${row.utm_medium}-${row.utm_campaign}-${index}`}>
                  <TableCell className="font-medium">
                    <div className="relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/10 rounded"
                        style={{ width: `${barWidth}%` }}
                      />
                      <span className="relative z-10">{row.utm_source}</span>
                    </div>
                  </TableCell>
                  <TableCell>{row.utm_medium}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={row.utm_campaign}>
                    {row.utm_campaign}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {row.lead_count}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.qualified_count}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className={cn('text-xs', qualRateBadge)}>
                      {row.qualification_rate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
