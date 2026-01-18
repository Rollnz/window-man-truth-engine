import { useState, useCallback } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePresentationGenerator } from '@/hooks/usePresentationGenerator';
import { WindowTriviaLoader } from '@/components/ui/WindowTriviaLoader';

interface QuoteAnalysisResult {
  overallScore: number;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  summary: string;
  warnings: string[];
  missingItems: string[];
  estimatedPrice?: number;
  priceAssessment?: string;
}

interface GenerateProposalButtonProps {
  analysisResult: QuoteAnalysisResult;
  homeownerName?: string;
  areaName?: string;
}

export function GenerateProposalButton({ 
  analysisResult, 
  homeownerName,
  areaName 
}: GenerateProposalButtonProps) {
  const { generatePresentation, isGenerating, generationPhase } = usePresentationGenerator();
  const [showLoader, setShowLoader] = useState(false);

  const handleGenerate = useCallback(async () => {
    setShowLoader(true);
    const result = await generatePresentation('quote-analysis', {
      overallScore: analysisResult.overallScore,
      safetyScore: analysisResult.safetyScore,
      scopeScore: analysisResult.scopeScore,
      priceScore: analysisResult.priceScore,
      finePrintScore: analysisResult.finePrintScore,
      warrantyScore: analysisResult.warrantyScore,
      summary: analysisResult.summary,
      warnings: analysisResult.warnings,
      missingItems: analysisResult.missingItems,
      estimatedPrice: analysisResult.estimatedPrice,
      priceAssessment: analysisResult.priceAssessment,
      homeownerName,
      areaName,
    });
    
    // If error, close loader immediately
    if (!result.success) {
      setShowLoader(false);
    }
  }, [analysisResult, homeownerName, areaName, generatePresentation]);

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
  }, []);

  const isComplete = generationPhase === 'complete';

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || showLoader}
        className="w-full gap-2"
        variant="cta"
      >
        {isGenerating && !showLoader ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Proposal...
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4" />
            Generate Homeowner Proposal
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
