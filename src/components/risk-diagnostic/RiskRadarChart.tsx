import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RiskScoreBreakdown } from '@/lib/riskCalculations';
import { useIsMobile } from '@/hooks/use-mobile';

interface RiskRadarChartProps {
  breakdown: RiskScoreBreakdown;
}

export function RiskRadarChart({ breakdown }: RiskRadarChartProps) {
  const isMobile = useIsMobile();

  const data = useMemo(() => [
    {
      category: 'Storm',
      protection: Math.round(breakdown.storm.protectionPercentage),
      fullMark: 100,
    },
    {
      category: 'Security',
      protection: Math.round(breakdown.security.protectionPercentage),
      fullMark: 100,
    },
    {
      category: 'Insurance',
      protection: Math.round(breakdown.insurance.protectionPercentage),
      fullMark: 100,
    },
    {
      category: 'Warranty',
      protection: Math.round(breakdown.warranty.protectionPercentage),
      fullMark: 100,
    },
  ], [breakdown]);

  return (
    <div className="w-full aspect-square max-w-[320px] mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "65%" : "70%"} data={data}>
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
          />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ 
              fill: 'hsl(var(--foreground))', 
              fontSize: isMobile ? 11 : 12,
              fontWeight: 500,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ 
              fill: 'hsl(var(--muted-foreground))', 
              fontSize: 10 
            }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Protection Level"
            dataKey="protection"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ 
              fill: 'hsl(var(--primary))', 
              strokeWidth: 0,
              r: 4,
            }}
            activeDot={{
              fill: 'hsl(var(--primary))',
              stroke: 'hsl(var(--primary-foreground))',
              strokeWidth: 2,
              r: 6,
            }}
          />
          {!isMobile && (
            <Legend 
              wrapperStyle={{ 
                paddingTop: '10px',
                fontSize: '12px',
              }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
