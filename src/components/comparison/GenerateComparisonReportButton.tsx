import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePresentationGenerator } from '@/hooks/usePresentationGenerator';
import { windowTiers } from '@/data/windowData';
import { TrueCostBreakdown } from '@/lib/comparisonCalculations';
import { ViewMode } from './ViewModeToggle';

interface GenerateComparisonReportButtonProps {
  windowCount: number;
  trueCosts: Record<string, TrueCostBreakdown>;
  viewMode: ViewMode;
  homeownerName?: string;
}

export function GenerateComparisonReportButton({ 
  windowCount, 
  trueCosts, 
  viewMode,
  homeownerName 
}: GenerateComparisonReportButtonProps) {
  const { generatePresentation, isGenerating } = usePresentationGenerator();

  const handleGenerate = async () => {
    // Package tier data for the presentation
    const tiers = windowTiers.map((tier) => ({
      name: tier.name,
      subtitle: tier.subtitle,
      pricePerWindow: tier.upfrontCostPerWindow,
      trueCost10Year: trueCosts[tier.id]?.trueCost10Year || 0,
      uFactor: tier.uFactor,
      shgc: tier.shgc,
      warrantyParts: tier.warrantyParts,
      warrantyLabor: tier.warrantyLabor,
      securityRating: tier.securityRating,
      estimatedLifespan: tier.estimatedLifespan,
      features: tier.features,
      cons: tier.cons,
      isRecommended: tier.isRecommended,
    }));

    await generatePresentation('comparison-report', {
      tiers,
      windowCount,
      viewMode,
      homeownerName,
    });
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="gap-2"
      variant="cta"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating Report...
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-4 h-4" />
          Download Comparison Report
        </>
      )}
    </Button>
  );
}
