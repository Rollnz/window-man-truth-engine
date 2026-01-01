import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePresentationGenerator } from '@/hooks/usePresentationGenerator';

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
  const { generatePresentation, isGenerating } = usePresentationGenerator();

  const handleGenerate = async () => {
    await generatePresentation('quote-analysis', {
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
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="w-full gap-2"
      variant="outline"
    >
      {isGenerating ? (
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
  );
}
