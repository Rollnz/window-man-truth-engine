import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';
import type { AnalyticsSummary } from '@/hooks/useAnalyticsDashboard';

interface CPACalculatorProps {
  summary: AnalyticsSummary;
  qualifiedLeads?: number;
}

const STORAGE_KEY = 'wm_analytics_ad_spend';

export function CPACalculator({ summary, qualifiedLeads = 0 }: CPACalculatorProps) {
  const [adSpend, setAdSpend] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || '';
    }
    return '';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, adSpend);
    }
  }, [adSpend]);

  const spendValue = parseFloat(adSpend) || 0;
  const cpa = summary.totalLeads > 0 
    ? spendValue / summary.totalLeads 
    : 0;
  const cpq = qualifiedLeads > 0 
    ? spendValue / qualifiedLeads 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cost Per Lead Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="ad-spend" className="text-sm whitespace-nowrap">
              Ad Spend:
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="ad-spend"
                type="number"
                min="0"
                step="100"
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                className="w-32 pl-7"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">CPA: </span>
              <span className="font-semibold text-lg">
                ${cpa.toFixed(2)}
              </span>
              <span className="text-muted-foreground">/lead</span>
            </div>

            {qualifiedLeads > 0 && (
              <div>
                <span className="text-muted-foreground">CPQ: </span>
                <span className="font-semibold text-lg text-primary">
                  ${cpq.toFixed(2)}
                </span>
                <span className="text-muted-foreground">/qualified</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
