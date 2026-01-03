import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine, type TooltipProps } from 'recharts';
import { CostProjection } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimelineChartProps {
  projection: CostProjection;
}

export function TimelineChart({ projection }: TimelineChartProps) {
  const data = projection.yearlyProjections.map((item) => ({
    name: item.label,
    'Energy Loss': Math.round(item.loss),
    'Investment Cost': Math.round(item.investment),
  }));

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ${Number(entry.value).toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Cost Comparison Over Time
          {projection.breakEvenYears < 10 && (
            <span className="text-sm font-normal text-primary">
              • Break-even: {projection.breakEvenYears} years
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="Energy Loss" 
                fill="hsl(var(--destructive))" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
              <Bar 
                dataKey="Investment Cost" 
                fill="#22C55E" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
              {projection.breakEvenYears < 10 && (
                <ReferenceLine 
                  y={projection.investment.estimated} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: 'Investment', 
                    position: 'right',
                    fill: 'hsl(var(--primary))'
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-center">
            <span className="text-destructive font-semibold">Red bars</span> show cumulative energy loss. 
            <span className="text-green-500 font-semibold ml-1">Green bars</span> show one-time investment cost.
            <br />
            <span className="text-muted-foreground">
              When red exceeds green, you've lost more than you would have invested.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
