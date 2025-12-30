import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface BreakEvenIndicatorProps {
  breakEvenYears: number;
  investmentCost: number;
  tenYearSavings: number;
}

export function BreakEvenIndicator({
  breakEvenYears,
  investmentCost,
  tenYearSavings,
}: BreakEvenIndicatorProps) {
  // Calculate progress (break-even as percentage of 10 years)
  const progressPercent = Math.min((breakEvenYears / 10) * 100, 100);

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/30">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Return on Investment</h3>
              <p className="text-sm text-muted-foreground">
                Your investment of {formatCurrency(investmentCost)} pays for itself in:
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary">
                  {breakEvenYears} years
                </span>
                <span className="text-sm text-muted-foreground">
                  Break-even point
                </span>
              </div>
              
              <Progress value={progressPercent} className="h-3" />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Today</span>
                <span>10 years</span>
              </div>
            </div>
            
            {tenYearSavings > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-sm">
                  After 10 years, you're ahead by{' '}
                  <span className="font-bold text-green-500">
                    {formatCurrency(tenYearSavings)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
