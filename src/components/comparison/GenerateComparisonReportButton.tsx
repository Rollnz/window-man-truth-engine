import { useState, useCallback } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePresentationGenerator } from '@/hooks/usePresentationGenerator';
import { WindowTriviaLoader } from '@/components/ui/WindowTriviaLoader';
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
  const { generatePresentation, isGenerating, generationPhase } = usePresentationGenerator();
  const [showLoader, setShowLoader] = useState(false);

  const handleGenerate = useCallback(async () => {
    setShowLoader(true);
    
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

    const result = await generatePresentation('comparison-report', {
      tiers,
      windowCount,
      viewMode,
      homeownerName,
    });
    
    // If error, close loader immediately
    if (!result.success) {
      setShowLoader(false);
    }
  }, [windowCount, trueCosts, viewMode, homeownerName, generatePresentation]);

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
  }, []);

  const isComplete = generationPhase === 'complete';

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || showLoader}
        className="gap-2"
        variant="cta"
      >
        {isGenerating && !showLoader ? (
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

      <WindowTriviaLoader 
        isActive={showLoader}
        isComplete={isComplete}
        onComplete={handleLoaderComplete}
      />
    </>
  );
}
