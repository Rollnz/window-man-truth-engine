import { Card, CardContent } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { CostProjection } from '@/lib/calculations';
import { cn } from '@/lib/utils';
import { Clock, Calendar, CalendarDays, CalendarRange, Landmark } from 'lucide-react';

interface CostBreakdownProps {
  projection: CostProjection;
  isVisible: boolean;
}

interface BreakdownCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  delay: number;
  severity: 'low' | 'medium' | 'high';
  isVisible: boolean;
}

function BreakdownCard({ label, value, icon, delay, severity, isVisible }: BreakdownCardProps) {
  const severityConfig = {
    low: {
      border: 'border-yellow-500/50',
      text: 'text-yellow-500',
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-500',
      glow: { textShadow: '0 0 16px rgba(234, 179, 8, 0.4)' },
    },
    medium: {
      border: 'border-orange-500/50',
      text: 'text-orange-500',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
      glow: { textShadow: '0 0 16px rgba(249, 115, 22, 0.4)' },
    },
    high: {
      border: 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
      text: 'text-red-500',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      glow: { textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' },
    },
  };

  const config = severityConfig[severity];

  return (
    <Card 
      className={cn(
        'bg-card/50 backdrop-blur border-2 transition-all duration-500',
        config.border,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <CardContent className="pt-6 text-center">
        <div className={cn('flex justify-center mb-2', config.iconColor)}>
          {icon}
        </div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className={cn('text-2xl sm:text-3xl font-bold', config.text)} style={config.glow}>
          {isVisible ? (
            <AnimatedNumber value={value} prefix="$" duration={1500} />
          ) : (
            '$0'
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function getSeverity(value: number): 'low' | 'medium' | 'high' {
  if (value < 500) return 'low';
  if (value < 2000) return 'medium';
  return 'high';
}

export function CostBreakdown({ projection, isVisible }: CostBreakdownProps) {
  const cards = [
    { label: 'Daily Waste', value: projection.daily, icon: <Clock className="h-5 w-5" /> },
    { label: 'Monthly Waste', value: projection.monthly, icon: <Calendar className="h-5 w-5" /> },
    { label: 'Annual Waste', value: projection.annual, icon: <CalendarDays className="h-5 w-5" /> },
    { label: '5-Year Loss', value: projection.year5, icon: <CalendarRange className="h-5 w-5" /> },
    { label: '10-Year Loss', value: projection.year10, icon: <Landmark className="h-5 w-5" /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <BreakdownCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          delay={index * 150}
          severity={getSeverity(card.value)}
          isVisible={isVisible}
        />
      ))}
    </div>
  );
}
