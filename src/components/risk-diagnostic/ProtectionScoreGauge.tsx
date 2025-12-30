import { useMemo } from 'react';
import { getProtectionLevel, getProtectionLevelColor } from '@/lib/riskCalculations';

interface ProtectionScoreGaugeProps {
  score: number;
}

export function ProtectionScoreGauge({ score }: ProtectionScoreGaugeProps) {
  const level = getProtectionLevel(score);
  const levelColor = getProtectionLevelColor(score);

  // Calculate the arc path for the gauge
  const { arcPath, indicatorPosition } = useMemo(() => {
    const radius = 80;
    const strokeWidth = 12;
    const centerX = 100;
    const centerY = 90;
    const startAngle = 180; // Start from left
    const endAngle = 0; // End at right
    const totalAngle = 180;

    // Background arc (full semicircle)
    const bgStartRad = (startAngle * Math.PI) / 180;
    const bgEndRad = (endAngle * Math.PI) / 180;
    
    const bgStartX = centerX + radius * Math.cos(bgStartRad);
    const bgStartY = centerY - radius * Math.sin(bgStartRad);
    const bgEndX = centerX + radius * Math.cos(bgEndRad);
    const bgEndY = centerY - radius * Math.sin(bgEndRad);

    // Value arc
    const scoreAngle = startAngle - (score / 100) * totalAngle;
    const scoreRad = (scoreAngle * Math.PI) / 180;
    const scoreX = centerX + radius * Math.cos(scoreRad);
    const scoreY = centerY - radius * Math.sin(scoreRad);

    // Determine if we need the large arc flag
    const largeArcFlag = score > 50 ? 1 : 0;

    return {
      arcPath: {
        background: `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 1 1 ${bgEndX} ${bgEndY}`,
        value: score > 0 
          ? `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${scoreX} ${scoreY}`
          : '',
      },
      indicatorPosition: { x: scoreX, y: scoreY },
    };
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[110px]">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* Background arc */}
          <path
            d={arcPath.background}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value arc */}
          {arcPath.value && (
            <path
              d={arcPath.value}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
              }}
            />
          )}
          {/* Indicator dot */}
          <circle
            cx={indicatorPosition.x}
            cy={indicatorPosition.y}
            r="6"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth="2"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-4xl font-bold text-primary text-glow">
            {score}
          </span>
          <span className="text-sm text-muted-foreground">out of 100</span>
        </div>
      </div>

      {/* Protection level */}
      <div className={`mt-2 text-center ${levelColor}`}>
        <span className="text-lg font-semibold">{level} Protection</span>
      </div>
    </div>
  );
}
