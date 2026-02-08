import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { DailyMetric } from '@/hooks/useAnalyticsDashboard';
import { format, parseISO } from 'date-fns';

interface TrafficLeadsChartProps {
  dailyMetrics: DailyMetric[];
  isLoading: boolean;
}

export function TrafficLeadsChart({ dailyMetrics, isLoading }: TrafficLeadsChartProps) {
  // Reverse to show oldest first (left to right)
  const chartData = [...dailyMetrics].reverse().map((d) => ({
    ...d,
    dateFormatted: format(parseISO(d.date), 'MMM d'),
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic vs Leads (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic vs Leads</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No data available for selected date range</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic vs Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateFormatted"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'visitors') return [value, 'Visitors'];
                if (name === 'leads') return [value, 'Leads'];
                if (name === 'conversion_rate') return [`${value}%`, 'Conversion'];
                return [value, name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="visitors"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorVisitors)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="leads"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
