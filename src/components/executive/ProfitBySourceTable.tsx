import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { track } from '@/lib/tracking';
import type { ProfitRow, MatchCoverage, ExecutiveFilters } from '@/hooks/useExecutiveProfit';

interface ProfitBySourceTableProps {
  rows: ProfitRow[];
  matchCoverage: MatchCoverage | null;
  filters: ExecutiveFilters | null;
  isLoading: boolean;
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRatio(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(2)}x`;
}

export function ProfitBySourceTable({
  rows,
  matchCoverage,
  filters,
  isLoading,
}: ProfitBySourceTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (row: ProfitRow) => {
    if (!filters) return;

    track('exec_row_clicked', {
      page_path: '/admin/executive',
      section_id: 'profit-by-source',
      filters: {
        group_by: filters.group_by,
        value: row.group_key,
      },
    });

    // Navigate to revenue page with filters
    const params = new URLSearchParams();
    params.set('startDate', filters.start_date);
    params.set('endDate', filters.end_date);

    if (filters.group_by === 'platform') {
      params.set('platform', row.group_key);
    } else {
      params.set('utm_campaign', row.group_key);
    }

    navigate(`/admin/revenue?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  const spendMatchPct = matchCoverage?.spend_match_pct ?? null;
  const revenueMatchPct = matchCoverage?.revenue_match_pct ?? null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Profit by Source</CardTitle>
            <CardDescription>
              Click a row to drill down to detailed revenue data
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Spend Match:</span>{' '}
              {spendMatchPct !== null ? `${(spendMatchPct * 100).toFixed(0)}%` : '—'}
            </div>
            <div>
              <span className="font-medium">Revenue Match:</span>{' '}
              {revenueMatchPct !== null ? `${(revenueMatchPct * 100).toFixed(0)}%` : '—'}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No data available for this period
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{filters?.group_by === 'campaign' ? 'Campaign' : 'Platform'}</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Deals</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">Profit After Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isUnattributed = row.group_key === 'unattributed' || row.group_key === 'other';
                  const profitAfterSpendColor =
                    row.profit_after_spend > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : row.profit_after_spend < 0
                      ? 'text-destructive'
                      : '';

                  return (
                    <TableRow
                      key={row.group_key}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(row)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{row.group_key}</span>
                          {isUnattributed && (
                            <Badge variant="outline" className="text-xs">
                              Unattributed
                            </Badge>
                          )}
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(row.spend)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.deals_won}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(row.profit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatRatio(row.roas)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(row.cpa)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${profitAfterSpendColor}`}>
                        {formatCurrency(row.profit_after_spend)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
