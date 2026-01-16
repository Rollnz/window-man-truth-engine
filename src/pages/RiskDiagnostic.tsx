import { useState, useCallback } from "react";
import { useSessionData } from "@/hooks/useSessionData";
import { usePageTracking } from "@/hooks/usePageTracking";
import { trackToolCompletion } from "@/lib/gtm";
import { getQuestionByIndex, getTotalQuestions } from "@/data/riskDiagnosticData";
import { calculateRiskScores, RiskAnswers } from "@/lib/riskCalculations";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { RiskHero } from "@/components/risk-diagnostic/RiskHero";
import { RiskQuestion } from "@/components/risk-diagnostic/RiskQuestion";
import { ProtectionReport } from "@/components/risk-diagnostic/ProtectionReport";
import { LeadCaptureModal } from "@/components/conversion/LeadCaptureModal";
import { ConsultationBookingModal } from "@/components/conversion/ConsultationBookingModal";
import { MinimalFooter } from "@/components/navigation/MinimalFooter";
import { getSmartRelatedTools, getFrameControl } from "@/config/toolRegistry";
import { RelatedToolsGrid } from "@/components/ui/RelatedToolsGrid";
import type { SourceTool } from "@/types/sourceTool";

const riskDiagnosticSchema = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Home Protection Risk Diagnostic",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Free diagnostic tool to assess your home's protection level against storms, security threats, and insurance gaps. Get personalized recommendations.",
    "url": "https://itswindowman.com/risk-diagnostic"
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What does the risk diagnostic measure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The diagnostic evaluates four key areas: storm protection, home security, insurance coverage, and warranty status. You'll receive a protection score and personalized action plan."
        }
      },
      {
        "@type": "Question",
        "name": "How long does the diagnostic take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The diagnostic takes about 2-3 minutes to complete. Answer simple questions about your home and receive instant results with actionable recommendations."
        }
      },
      {
        "@type": "Question",
        "name": "Is my information kept private?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, your diagnostic results are private. We only collect the information you choose to share when requesting a consultation or saving your report."
        }
      }
    ]
  }
];

type Phase = "hero" | "questions" | "results";
type Direction = "forward" | "backward";

export default function RiskDiagnostic() {
  usePageTracking("risk-diagnostic");
  const { sessionData, updateField, updateFields, markToolCompleted } = useSessionData();
  const [phase, setPhase] = useState<Phase>("hero");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<RiskAnswers>({});
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<Direction>("forward");

  const totalQuestions = getTotalQuestions();
  const questionData = getQuestionByIndex(currentQuestionIndex);
  const breakdown = calculateRiskScores(answers);

  const handleStart = () => {
    setPhase("questions");
  };

  const handleSelectAnswer = useCallback(
    (value: string) => {
      if (!questionData || isAnimating) return;

      const newAnswers = { ...answers, [questionData.question.id]: value };
      setAnswers(newAnswers);

      // Start exit animation
      setIsAnimating(true);
      setDirection("forward");

      // After animation, advance to next question or complete
      setTimeout(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          // Complete - calculate and save results
          const finalBreakdown = calculateRiskScores(newAnswers);
          updateFields({
            riskDiagnosticCompleted: true,
            stormRiskScore: Math.round(finalBreakdown.storm.protectionPercentage),
            securityRiskScore: Math.round(finalBreakdown.security.protectionPercentage),
            insuranceRiskScore: Math.round(finalBreakdown.insurance.protectionPercentage),
            warrantyRiskScore: Math.round(finalBreakdown.warranty.protectionPercentage),
            overallProtectionScore: finalBreakdown.protectionScore,
          });
          markToolCompleted("risk-diagnostic");

          // Track tool completion
          trackToolCompletion({ toolName: "risk-diagnostic", score: finalBreakdown.protectionScore });

          setPhase("results");
        }
        setIsAnimating(false);
      }, 250);
    },
    [answers, currentQuestionIndex, totalQuestions, questionData, updateFields, markToolCompleted, isAnimating],
  );

  const handleBack = () => {
    if (currentQuestionIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setDirection("backward");
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev - 1);
        setIsAnimating(false);
      }, 250);
    }
  };

  const handleUpdateHomeSize = (size: number) => {
    updateField("homeSize", size);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Home Protection Risk Diagnostic"
        description="Free diagnostic tool to assess your home's protection against storms, security threats, and insurance gaps. Get your personalized protection score in minutes."
        canonicalUrl="https://itswindowman.com/risk-diagnostic"
        jsonLd={riskDiagnosticSchema}
      />
      <Navbar />

      <div className="pt-14">
        {phase === "hero" && <RiskHero sessionData={sessionData} onStart={handleStart} hasStarted={false} />}

        {phase === "questions" && questionData && (
          <RiskQuestion
            key={currentQuestionIndex}
            category={questionData.category}
            question={questionData.question}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            selectedValue={answers[questionData.question.id]}
            onSelect={handleSelectAnswer}
            onBack={handleBack}
            canGoBack={currentQuestionIndex > 0}
            isAnimating={isAnimating}
            direction={direction}
          />
        )}

        {phase === "results" && (
          <ProtectionReport
            breakdown={breakdown}
            answers={answers}
            sessionData={sessionData}
            onEmailReport={() => setShowLeadModal(true)}
            onScheduleConsultation={() => setShowBookingModal(true)}
            onUpdateHomeSize={handleUpdateHomeSize}
          />
        )}
      </div>

      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={() => setShowLeadModal(false)}
        sourceTool={"risk-diagnostic" satisfies SourceTool}
        sessionData={sessionData}
      />

      <ConsultationBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={() => setShowBookingModal(false)}
        sessionData={sessionData}
        sourceTool="risk-diagnostic"
      />

      {/* Related Tools */}
      <RelatedToolsGrid
        title={getFrameControl("risk-diagnostic").title}
        description={getFrameControl("risk-diagnostic").description}
        tools={getSmartRelatedTools("risk-diagnostic", sessionData.toolsCompleted)}
      />

      {/* Minimal Footer */}
      <MinimalFooter />
    </div>
  );
}
