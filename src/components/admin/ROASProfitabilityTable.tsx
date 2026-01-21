import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import type { ROASRow } from "@/hooks/useAttributionROAS";

interface ROASProfitabilityTableProps {
  rows: ROASRow[];
  groupBy: 'platform' | 'campaign';
  startDate?: string;
  endDate?: string;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number | null, suffix?: string): string {
  if (value === null || !isFinite(value)) return '—';
  const formatted = value.toFixed(2);
  return suffix ? `${formatted}${suffix}` : formatted;
}

const QUALITY_BADGE_STYLES: Record<string, { variant: 'default' | 'secondary' | 'outline'; className: string }> = {
  high: { variant: 'default', className: 'bg-primary/20 text-primary border-primary/30' },
  medium: { variant: 'secondary', className: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
  low: { variant: 'outline', className: 'bg-muted text-muted-foreground' },
};

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google Ads',
  meta: 'Meta (FB/IG)',
  other: 'Other / Organic',
  unknown: 'Unknown',
};

export function ROASProfitabilityTable({
  rows,
  groupBy,
  startDate,
  endDate,
  isLoading = false,
}: ROASProfitabilityTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (row: ROASRow) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    
    if (groupBy === 'platform') {
      params.set('platform', row.group_key);
    } else {
      params.set('utm_campaign', row.group_key);
    }
    
    navigate(`/admin/revenue?${params}`);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{groupBy === 'platform' ? 'Platform' : 'Campaign'}</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Deals</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
              <TableHead className="text-right">CPA</TableHead>
              <TableHead>Quality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        <p>No profitability data for this period</p>
        <p className="text-sm mt-1">Add deals and ad spend to see ROAS metrics</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{groupBy === 'platform' ? 'Platform' : 'Campaign'}</TableHead>
            <TableHead className="text-right">Spend</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Deals</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
            <TableHead className="text-right">CPA</TableHead>
            <TableHead>Quality</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const qualityStyle = QUALITY_BADGE_STYLES[row.mapping_quality] || QUALITY_BADGE_STYLES.low;
            const displayName = groupBy === 'platform' 
              ? (PLATFORM_LABELS[row.group_key] || row.group_key)
              : (row.group_key || 'Unknown');
            
            return (
              <TableRow 
                key={row.group_key} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(row)}
              >
                <TableCell className="font-medium">{displayName}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.spend)}</TableCell>
                <TableCell className="text-right">{row.leads.toLocaleString()}</TableCell>
                <TableCell className="text-right">{row.deals_won.toLocaleString()}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                <TableCell className={`text-right font-medium ${row.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(row.profit)}
                </TableCell>
                <TableCell className={`text-right font-medium ${row.roas && row.roas >= 1 ? 'text-primary' : 'text-destructive'}`}>
                  {formatNumber(row.roas, 'x')}
                </TableCell>
                <TableCell className="text-right">{row.cpa !== null ? formatCurrency(row.cpa) : '—'}</TableCell>
                <TableCell>
                  <Badge variant={qualityStyle.variant} className={qualityStyle.className}>
                    {row.mapping_quality}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
