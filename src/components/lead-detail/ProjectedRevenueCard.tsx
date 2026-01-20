/**
 * Projected Revenue Card
 * 
 * Shows score-based revenue projection for pre-close ROAS visibility.
 * Helps identify which traffic sources bring engaged users.
 */

import { useMemo } from 'react';
import { TrendingUp, DollarSign, Target, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  calculateRevenueProjection, 
  getRevenueTier,
  type ConfidenceLevel 
} from '@/lib/revenueProjection';
import type { LeadQuality } from '@/types/crm';

interface ProjectedRevenueCardProps {
  engagementScore: number;
  leadQuality: LeadQuality | string | null;
  estimatedDealValue?: number | null;
  className?: string;
}

const CONFIDENCE_STYLES: Record<ConfidenceLevel, { label: string; color: string }> = {
  high: { label: 'High confidence', color: 'text-green-600 dark:text-green-400' },
  medium: { label: 'Medium confidence', color: 'text-amber-600 dark:text-amber-400' },
  low: { label: 'Low confidence', color: 'text-muted-foreground' },
};

export function ProjectedRevenueCard({ 
  engagementScore, 
  leadQuality,
  estimatedDealValue,
  className 
}: ProjectedRevenueCardProps) {
  const projection = useMemo(() => {
    return calculateRevenueProjection(engagementScore, leadQuality, estimatedDealValue);
  }, [engagementScore, leadQuality, estimatedDealValue]);
  
  const tier = useMemo(() => {
    return getRevenueTier(projection.projectedRevenue);
  }, [projection.projectedRevenue]);
  
  const confidenceStyle = CONFIDENCE_STYLES[projection.confidence];
  
  // Progress bar shows probability (max 50% for display purposes)
  const progressValue = Math.min(projection.closeProbability * 100 * 2, 100);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Projected Revenue
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Estimated revenue based on engagement score, lead quality, and industry averages.
                    Used for pre-close ROAS visibility.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Badge variant="outline" className={cn('text-xs', confidenceStyle.color)}>
            {confidenceStyle.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main projection */}
        <div className="flex items-baseline gap-1">
          <DollarSign className={cn('h-5 w-5', tier.color)} />
          <span className={cn('text-2xl font-bold', tier.color)}>
            {projection.projectedRevenue.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">projected</span>
        </div>
        
        {/* Close probability bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Close probability</span>
            <span className="font-medium">
              {Math.round(projection.closeProbability * 100)}%
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
        
        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Base Value</span>
            </div>
            <p className="text-sm font-medium">${projection.baseValue.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Quality Mult.</span>
            </div>
            <p className="text-sm font-medium">{projection.qualityMultiplier}x</p>
          </div>
        </div>
        
        {/* Explanation */}
        <p className="text-xs text-muted-foreground text-center">
          {projection.explanation}
        </p>
      </CardContent>
    </Card>
  );
}
