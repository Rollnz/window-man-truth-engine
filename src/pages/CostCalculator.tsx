import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { logEvent } from '@/lib/windowTruthClient';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';
import { CalculatorInputs, ValidatedInputs } from '@/components/cost-calculator/CalculatorInputs';
import { CostBreakdown } from '@/components/cost-calculator/CostBreakdown';
import { TimelineChart } from '@/components/cost-calculator/TimelineChart';
import { LiveWasteCounter } from '@/components/cost-calculator/LiveWasteCounter';
import { BreakEvenIndicator } from '@/components/cost-calculator/BreakEvenIndicator';
import {
  calculateCostOfInaction,
  convertBillRangeToNumber,
  convertAgeRangeToMultiplier,
  CostProjection
} from '@/lib/calculations';
import { ArrowLeft, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';

export default function CostCalculator() {
  usePageTracking('cost-calculator');
  const { sessionData, updateFields, markToolCompleted } = useSessionData();
  const [projection, setProjection] = useState<CostProjection | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Check if user has Reality Check score
  const hasRealityCheckScore = sessionData.realityCheckScore !== undefined;

  const handleCalculate = (inputs: ValidatedInputs) => {
    setIsCalculating(true);

    // Simulate brief calculation delay for UX
    setTimeout(() => {
      // Convert string inputs to numbers
      const monthlyBill = convertBillRangeToNumber(inputs.energyBill);
      const energyLossRate = convertAgeRangeToMultiplier(inputs.windowAge);

      // Calculate projection
      const result = calculateCostOfInaction({
        monthlyBill,
        energyLossRate,
        windowCount: inputs.windowCount,
        homeSize: inputs.homeSize,
      });

      setProjection(result);
      setShowResults(true);
      setIsCalculating(false);

      // Save to session
      updateFields({
        currentEnergyBill: inputs.energyBill,
        windowAge: inputs.windowAge,
        homeSize: inputs.homeSize,
        windowCount: inputs.windowCount,
        costOfInactionTotal: result.year5,
      });

      // Mark tool as completed
      markToolCompleted('cost-calculator');

      // Track tool completion
      logEvent({
        event_name: 'tool_completed',
        tool_name: 'cost-calculator',
        params: {
          year1_cost: result.year1,
          year5_cost: result.year5,
          window_age: inputs.windowAge,
          window_count: inputs.windowCount,
        },
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tools
            </Link>
            
            {hasRealityCheckScore && (
              <Badge variant="outline" className="border-primary/50 text-primary">
                Reality Score: {sessionData.realityCheckScore}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Cost of <span className="text-primary">Inaction</span> Calculator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See exactly how much money you're losing every day, month, and year by 
            delaying your window upgrade. The numbers might surprise you.
          </p>
        </div>

        {/* Reality Check Callout */}
        {hasRealityCheckScore && sessionData.realityCheckScore! >= 76 && (
          <div className="mb-8 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-destructive" />
              <p className="text-sm">
                Your Reality Score of <span className="font-bold">{sessionData.realityCheckScore}</span> suggests 
                urgent action is needed. Let's see the financial impact.
              </p>
            </div>
          </div>
        )}

        {/* Calculator Inputs */}
        {!showResults && (
          <CalculatorInputs
            sessionData={sessionData}
            onCalculate={handleCalculate}
            isCalculating={isCalculating}
          />
        )}

        {/* Results Section */}
        {showResults && projection && (
          <div className="space-y-8 animate-fade-in">
            {/* Live Waste Counter */}
            <LiveWasteCounter dailyWaste={projection.daily} />

            {/* Cost Breakdown Cards */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Energy Loss Breakdown</h2>
              <CostBreakdown projection={projection} isVisible={showResults} />
            </div>

            {/* Timeline Chart */}
            <TimelineChart projection={projection} />

            {/* Break-Even Indicator */}
            <BreakEvenIndicator
              breakEvenYears={projection.breakEvenYears}
              investmentCost={projection.investment.estimated}
              tenYearSavings={projection.netSavingsAt10Years}
            />

            {/* Recalculate Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowResults(false)}
                className="text-sm"
              >
                Adjust My Inputs
              </Button>
            </div>

            {/* CTA Section */}
            <div className="p-6 rounded-xl bg-primary/10 border border-primary/30 text-center">
              <h3 className="text-xl font-semibold mb-2">Ready to Stop the Bleeding?</h3>
              <p className="text-muted-foreground mb-4">
                Talk to our expert system to get personalized recommendations 
                based on your specific situation.
              </p>
              <Button 
                asChild
                size="lg" 
                className="shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)]"
              >
                <Link to="/expert">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Get Expert Advice
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <MinimalFooter />
    </div>
  );
}
