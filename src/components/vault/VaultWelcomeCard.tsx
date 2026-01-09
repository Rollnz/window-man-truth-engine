import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, TrendingDown, CheckCircle } from 'lucide-react';
import { gradeConfig } from '@/data/fairPriceQuizData';
import { formatCurrency } from '@/lib/fairPriceCalculations';

interface FairPriceQuizResults {
  quoteAmount: number;
  fairMarketValue: { low: number; high: number };
  overagePercentage: number;
  grade: string;
  verdict: string;
  redFlagCount: number;
  redFlags: string[];
  potentialOverpay: number | null;
  analyzedAt: string;
}

interface VaultWelcomeCardProps {
  results: FairPriceQuizResults;
  userName: string;
  onDismiss: () => void;
}

export function VaultWelcomeCard({ results, userName, onDismiss }: VaultWelcomeCardProps) {
  const gradeInfo = gradeConfig[results.grade as keyof typeof gradeConfig] || gradeConfig.fair;

  return (
    <Card className="relative p-6 mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30">
      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onDismiss}
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Analysis Synced Successfully</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome{userName ? `, ${userName}` : ''}! Your Analysis is Ready
          </h2>
          <p className="text-muted-foreground mt-2">
            Your Fair Price Diagnostic results are now securely stored in your Vault.
          </p>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Grade */}
          <Card className="p-4 bg-card/80 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Grade</p>
            <Badge 
              variant="outline" 
              className={`text-lg font-bold px-3 py-1 ${gradeInfo.color} border-current`}
            >
              {gradeInfo.label.toUpperCase()}
            </Badge>
          </Card>

          {/* Your Quote */}
          <Card className="p-4 bg-card/80 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Quote</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(results.quoteAmount)}
            </p>
          </Card>

          {/* Fair Market Value */}
          <Card className="p-4 bg-card/80 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fair Market Value</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(results.fairMarketValue.low)} - {formatCurrency(results.fairMarketValue.high)}
            </p>
          </Card>
        </div>

        {/* Potential Overpay Warning */}
        {results.potentialOverpay && results.potentialOverpay > 0 && (
          <Card className="p-4 bg-destructive/10 border-destructive/30">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-destructive shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Potential Overpay Detected</p>
                <p className="text-xl font-bold text-destructive">
                  {formatCurrency(results.potentialOverpay)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Use the tools below to compare quotes, prepare for negotiations, and protect your investment.
          </p>
        </div>
      </div>
    </Card>
  );
}
