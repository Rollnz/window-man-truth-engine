import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RiskActionPlanProps {
  actionItems: string[];
  onScheduleConsultation: () => void;
}

export function RiskActionPlan({ actionItems, onScheduleConsultation }: RiskActionPlanProps) {
  if (actionItems.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Excellent Protection!</h3>
          <p className="text-muted-foreground">
            Your home is well-protected across all categories. Keep up the great work!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {actionItems.length}
          </span>
          Priority Action Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actionItems.map((item, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
          >
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              {index + 1}
            </span>
            <p className="text-sm flex-1">{item}</p>
          </div>
        ))}

        <Button 
          onClick={onScheduleConsultation}
          className="w-full mt-4"
          size="lg"
        >
          Get Protected Today
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
