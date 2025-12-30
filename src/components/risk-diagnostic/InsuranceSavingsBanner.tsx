import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { calculateInsuranceSavings, InsuranceSavingsResult } from '@/lib/riskCalculations';
import { SessionData } from '@/hooks/useSessionData';

interface InsuranceSavingsBannerProps {
  sessionData: SessionData;
  hasImpactDiscount: boolean;
  onUpdateHomeSize?: (size: number) => void;
}

export function InsuranceSavingsBanner({ 
  sessionData, 
  hasImpactDiscount,
  onUpdateHomeSize 
}: InsuranceSavingsBannerProps) {
  const [localHomeSize, setLocalHomeSize] = useState<string>(
    sessionData.homeSize?.toString() || ''
  );

  const homeSize = sessionData.homeSize || parseInt(localHomeSize) || 2000;
  const zipCode = sessionData.zipCode;

  const savings: InsuranceSavingsResult = useMemo(() => {
    return calculateInsuranceSavings(homeSize, hasImpactDiscount, zipCode);
  }, [homeSize, hasImpactDiscount, zipCode]);

  const handleCalculate = () => {
    const size = parseInt(localHomeSize);
    if (size > 0 && onUpdateHomeSize) {
      onUpdateHomeSize(size);
    }
  };

  // If user already has discount, show congratulations message
  if (savings.isAlreadyReceivingDiscount) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-400 mb-1">You're Already Saving!</h3>
              <p className="text-sm text-muted-foreground">
                Great news — you're already receiving an impact window insurance discount. 
                Make sure to keep your wind mitigation inspection current to maintain your savings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Potential Insurance Savings</h3>
        </div>

        {!sessionData.homeSize ? (
          <div className="space-y-3 mb-4">
            <Label htmlFor="homeSize" className="text-muted-foreground">
              Enter your home size to calculate savings:
            </Label>
            <div className="flex gap-2">
              <Input
                id="homeSize"
                type="number"
                placeholder="e.g., 2500"
                value={localHomeSize}
                onChange={(e) => setLocalHomeSize(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCalculate} variant="secondary">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Based on your {homeSize.toLocaleString()} sq ft home
            {zipCode && ` in ${zipCode}`}:
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-card">
            <p className="text-xs text-muted-foreground mb-1">Est. Annual Premium</p>
            <p className="text-xl font-bold">${savings.estimatedAnnualPremium.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-card">
            <p className="text-xs text-muted-foreground mb-1">Potential Savings</p>
            <p className="text-xl font-bold text-primary">
              -${savings.potentialAnnualSavings.toLocaleString()}/yr
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">10-Year Savings</span>
            <span className="text-2xl font-bold text-primary">
              ${savings.savingsOver10Years.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {savings.discountPercentage}% average impact window discount
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-3 italic">
          * Estimates based on Florida averages. Actual savings depend on your specific policy and provider.
        </p>
      </CardContent>
    </Card>
  );
}
