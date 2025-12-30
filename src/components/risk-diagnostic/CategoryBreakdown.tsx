import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { riskCategories } from '@/data/riskDiagnosticData';
import { RiskScoreBreakdown, getProtectionLevel, getProtectionLevelColor } from '@/lib/riskCalculations';

interface CategoryBreakdownProps {
  breakdown: RiskScoreBreakdown;
}

export function CategoryBreakdown({ breakdown }: CategoryBreakdownProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categoryData = [
    { ...riskCategories[0], score: breakdown.storm },
    { ...riskCategories[1], score: breakdown.security },
    { ...riskCategories[2], score: breakdown.insurance },
    { ...riskCategories[3], score: breakdown.warranty },
  ];

  const getIcon = (percentage: number) => {
    if (percentage >= 75) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (percentage >= 50) return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    return <AlertTriangle className="w-5 h-5 text-red-400" />;
  };

  const getRecommendation = (categoryId: string, percentage: number): string => {
    if (percentage >= 75) {
      return 'Your protection is strong in this area. Maintain your current measures.';
    }

    switch (categoryId) {
      case 'storm':
        return percentage < 50
          ? 'Critical: Your home is highly vulnerable to storm damage. Impact windows are essential for protection.'
          : 'Moderate risk: Consider upgrading remaining windows to complete your storm protection.';
      case 'security':
        return percentage < 50
          ? 'High vulnerability: Standard windows are easy targets. Impact glass provides break-in resistance.'
          : 'Some exposure: Ground-floor windows may benefit from security upgrades.';
      case 'insurance':
        return percentage < 50
          ? 'Missing significant savings: You could be paying 20%+ more than necessary on premiums.'
          : 'Partial optimization: A wind mitigation inspection could unlock additional discounts.';
      case 'warranty':
        return percentage < 50
          ? 'Exposed to repair costs: Without proper warranty coverage, repairs are 100% out-of-pocket.'
          : 'Limited coverage: Check if labor is included in your current warranty.';
      default:
        return 'Consider improving protection in this area.';
    }
  };

  return (
    <div className="space-y-3">
      {categoryData.map((category) => {
        const isExpanded = expandedId === category.id;
        const protectionPct = Math.round(category.score.protectionPercentage);
        const level = getProtectionLevel(protectionPct);
        const levelColor = getProtectionLevelColor(protectionPct);
        const Icon = category.icon;

        return (
          <Card 
            key={category.id}
            className={`cursor-pointer transition-all ${isExpanded ? 'border-primary/50' : ''}`}
            onClick={() => setExpandedId(isExpanded ? null : category.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium truncate">{category.title}</h4>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`text-sm font-semibold ${levelColor}`}>
                          {protectionPct}%
                        </span>
                        {getIcon(protectionPct)}
                      </div>
                    </div>
                    <Progress 
                      value={protectionPct} 
                      className="h-2"
                    />
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-medium ${levelColor}`}>
                      {level} Protection
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getRecommendation(category.id, protectionPct)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
