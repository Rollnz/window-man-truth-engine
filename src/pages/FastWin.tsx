import { useState, useCallback } from "react";
import { ROUTES } from "@/config/navigation";
import { useSessionData } from "@/hooks/useSessionData";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useTrackToolCompletion } from "@/hooks/useTrackToolCompletion";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";

import { fastWinQuestions } from "@/data/fastWinData";
import { calculateFastWin, type FastWinAnswers, type FastWinResult } from "@/lib/fastWinLogic";
import { FastWinHero } from "@/components/fast-win/FastWinHero";
import { SpeedCard } from "@/components/fast-win/SpeedCard";
import { ShuffleAnimation } from "@/components/fast-win/ShuffleAnimation";
import { WinnerCard } from "@/components/fast-win/WinnerCard";
import { LeadCaptureModal } from "@/components/conversion/LeadCaptureModal";
import { ConsultationBookingModal } from "@/components/conversion/ConsultationBookingModal";
import { getSmartRelatedTools, getFrameControl } from "@/config/toolRegistry";
import { RelatedToolsGrid } from "@/components/ui/RelatedToolsGrid";
import { getToolPageSchemas, getBreadcrumbSchema } from "@/lib/seoSchemas/index";
import { PillarBreadcrumb } from "@/components/seo/PillarBreadcrumb";
import type { SourceTool } from "@/types/sourceTool";
import { useLeadIdentity } from "@/hooks/useLeadIdentity";
import { ExitIntentModal } from "@/components/authority";

type Phase = "hero" | "questions" | "calculating" | "result";

export default function FastWin() {
  usePageTracking("fast-win");
  const { sessionData, updateFields, markToolCompleted, hasExistingData } = useSessionData();
  const { hasIdentity } = useLeadIdentity();
  const { trackToolComplete } = useTrackToolCompletion();

  const [phase, setPhase] = useState<Phase>("hero");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<FastWinAnswers>>({});
  const [result, setResult] = useState<FastWinResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Modal states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  const handleStart = () => {
    setPhase("questions");
  };

  const handleSelectAnswer = (value: string) => {
    setIsAnimating(true);
    setDirection("forward");

    const questionId = fastWinQuestions[currentStep].id;
    const answerKey = questionId.replace("-", "") as keyof FastWinAnswers;

    // Map question IDs to answer keys
    const keyMap: Record<string, keyof FastWinAnswers> = {
      "pain-point": "painPoint",
      orientation: "orientation",
      "current-status": "currentStatus",
      "budget-priority": "budgetPriority",
    };

    const newAnswers = {
      ...answers,
      [keyMap[questionId]]: value,
    };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentStep < fastWinQuestions.length - 1) {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      } else {
        // All questions answered, move to calculating
        setPhase("calculating");
        setIsAnimating(false);
      }
    }, 250);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setDirection("back");
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 250);
    } else {
      setPhase("hero");
    }
  };

  const handleCalculationComplete = useCallback(() => {
    // Calculate the result
    const finalResult = calculateFastWin(answers as FastWinAnswers);
    setResult(finalResult);

    // Save to session
    updateFields({
      fastWinCompleted: true,
      fastWinResult: finalResult.product.id,
      fastWinPainPoint: answers.painPoint,
      fastWinOrientation: answers.orientation,
      fastWinBudgetPriority: answers.budgetPriority,
    });

    markToolCompleted("fast-win");

    // Track tool completion with delta value
    trackToolComplete('fast-win', { 
      product_id: finalResult.product.id,
      product_name: finalResult.product.name,
      match_score: finalResult.matchScore,
    });

    setPhase("result");
  }, [answers, updateFields, markToolCompleted, trackToolComplete]);

  const handleSave = () => {
    setShowLeadModal(true);
  };

  const handleGetPrice = () => {
    setShowConsultationModal(true);
  };

  const handleLeadSuccess = () => {
    setShowLeadModal(false);
  };

  const handleConsultationSuccess = () => {
    setShowConsultationModal(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO
        title="Fast Win Product Finder"
        description="Answer 4 quick questions to find the best window product for your specific situation. Get personalized recommendations in under 60 seconds."
        canonicalUrl="https://itswindowman.com/fast-win"
        jsonLd={[...getToolPageSchemas('fast-win'), getBreadcrumbSchema('fast-win')]}
      />
      <Navbar />

      {/* PillarBreadcrumb - links UP to parent pillar */}
      <div className="container px-4 pt-16 pb-2">
        <PillarBreadcrumb toolPath="/fast-win" variant="badge" />
      </div>

      {/* Phases */}
      <div className="pt-2">
        {phase === "hero" && <FastWinHero onStart={handleStart} hasSessionData={hasExistingData} />}

        {phase === "questions" && (
          <SpeedCard
            question={fastWinQuestions[currentStep]}
            currentStep={currentStep}
            totalSteps={fastWinQuestions.length}
            onSelect={handleSelectAnswer}
            onBack={handleBack}
            isAnimating={isAnimating}
            direction={direction}
          />
        )}

        {phase === "calculating" && <ShuffleAnimation onComplete={handleCalculationComplete} />}

        {phase === "result" && result && <WinnerCard result={result} onSave={handleSave} onGetPrice={handleGetPrice} />}
      </div>

      {/* Modals */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={handleLeadSuccess}
        sourceTool={"fast-win" satisfies SourceTool}
        sessionData={sessionData}
      />

      <ConsultationBookingModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        onSuccess={handleConsultationSuccess}
        sessionData={{
          ...sessionData,
          // Pre-fill with the product interest
          notes: result ? `Interested in: ${result.product.name}` : undefined,
        }}
        sourceTool="fast-win"
      />

      {/* Related Tools */}
      <RelatedToolsGrid
        title={getFrameControl("fast-win").title}
        description={getFrameControl("fast-win").description}
        tools={getSmartRelatedTools("fast-win", sessionData.toolsCompleted)}
      />

      <ExitIntentModal
        sourceTool="fast-win"
        hasConverted={hasIdentity}
        resultSummary="Fastest Win Strategy"
      />

    </div>
  );
}
