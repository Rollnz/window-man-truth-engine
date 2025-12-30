import { Mail, Calendar, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RiskScoreBreakdown, generateActionItems } from '@/lib/riskCalculations';
import { SessionData } from '@/hooks/useSessionData';
import { RiskRadarChart } from './RiskRadarChart';
import { ProtectionScoreGauge } from './ProtectionScoreGauge';
import { CategoryBreakdown } from './CategoryBreakdown';
import { InsuranceSavingsBanner } from './InsuranceSavingsBanner';
import { RiskActionPlan } from './RiskActionPlan';
import { RiskAnswers } from '@/lib/riskCalculations';

interface ProtectionReportProps {
  breakdown: RiskScoreBreakdown;
  answers: RiskAnswers;
  sessionData: SessionData;
  onEmailReport: () => void;
  onScheduleConsultation: () => void;
  onUpdateHomeSize: (size: number) => void;
}

export function ProtectionReport({
  breakdown,
  answers,
  sessionData,
  onEmailReport,
  onScheduleConsultation,
  onUpdateHomeSize,
}: ProtectionReportProps) {
  const actionItems = generateActionItems(breakdown);
  
  // Determine if user has impact discount based on insurance-2 answer
  const hasImpactDiscount = answers['insurance-2'] === 'yes';

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Your Protection Gap Report
        </h1>
        <p className="text-muted-foreground">
          Here's your personalized window protection analysis
        </p>
      </div>

      {/* Protection Score */}
      <div className="py-4">
        <ProtectionScoreGauge score={breakdown.protectionScore} />
      </div>

      <Separator />

      {/* Radar Chart */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-center">
          Protection by Category
        </h2>
        <RiskRadarChart breakdown={breakdown} />
      </div>

      <Separator />

      {/* Insurance Savings */}
      <InsuranceSavingsBanner
        sessionData={sessionData}
        hasImpactDiscount={hasImpactDiscount}
        onUpdateHomeSize={onUpdateHomeSize}
      />

      <Separator />

      {/* Category Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Detailed Breakdown</h2>
        <CategoryBreakdown breakdown={breakdown} />
      </div>

      <Separator />

      {/* Action Plan */}
      <RiskActionPlan
        actionItems={actionItems}
        onScheduleConsultation={onScheduleConsultation}
      />

      {/* Email Report Button */}
      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={onEmailReport}
        >
          <Mail className="mr-2 w-4 h-4" />
          Email My Protection Plan
        </Button>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        This analysis is based on your responses and general industry data. 
        A professional assessment can provide more specific recommendations.
      </p>
    </div>
  );
}
