import { useState, useEffect } from "react";
import { ROUTES } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { getToolPageSchemas } from "@/lib/seoSchemas";
import { SessionData, useSessionData } from "@/hooks/useSessionData";
import { usePageTracking } from "@/hooks/usePageTracking";
import { Navbar } from "@/components/home/Navbar";
import { MinimalFooter } from "@/components/navigation/MinimalFooter";
import ProgressBar from "@/components/reality-check/ProgressBar";
import QuestionStep from "@/components/reality-check/QuestionStep";
import RealityReport from "@/components/reality-check/RealityReport";
import { LeadCaptureModal } from "@/components/conversion/LeadCaptureModal";
import { ConsultationBookingModal } from "@/components/conversion/ConsultationBookingModal";
import { trackLeadCapture, trackConsultation, trackToolCompletion } from "@/lib/gtm";
import { getSmartRelatedTools, getFrameControl } from "@/config/toolRegistry";
import { RelatedToolsGrid } from "@/components/ui/RelatedToolsGrid";
import type { SourceTool } from "@/types/sourceTool";
const QUESTIONS = [
  {
    id: 'windowAge',
    question: "How old are your current windows?",
    description: "Even a rough estimate helps us assess efficiency",
    type: 'buttons' as const,
    options: [
      { value: '0-5', label: 'Less than 5 years' },
      { value: '5-10', label: '5-10 years' },
      { value: '10-15', label: '10-15 years' },
      { value: '15-20', label: '15-20 years' },
      { value: '20+', label: 'Over 20 years' },
    ]
  },
  {
    id: 'currentEnergyBill',
    question: "What's your average monthly energy bill?",
    description: "This helps us estimate your potential savings",
    type: 'buttons' as const,
    options: [
      { value: '<$100', label: 'Under $100' },
      { value: '$100-200', label: '$100 - $200' },
      { value: '$200-300', label: '$200 - $300' },
      { value: '$300-400', label: '$300 - $400' },
      { value: '$400+', label: 'Over $400' },
    ]
  },
  {
    id: 'homeSize',
    question: "What's your home's approximate size?",
    description: "Larger homes have more surface area for energy loss",
    type: 'slider' as const,
    sliderConfig: {
      min: 500,
      max: 5000,
      step: 100,
      unit: 'sq ft'
    }
  },
  {
    id: 'draftinessLevel',
    question: "Do you notice drafts near your windows?",
    description: "Drafts indicate seal failures and air infiltration",
    type: 'buttons' as const,
    options: [
      { value: 'none', label: 'No drafts at all' },
      { value: 'slight', label: 'Slight drafts occasionally' },
      { value: 'moderate', label: 'Noticeable drafts regularly' },
      { value: 'severe', label: 'Strong drafts constantly' },
    ]
  },
  {
    id: 'noiseLevel',
    question: "How much outside noise comes through?",
    description: "Sound insulation correlates with thermal insulation",
    type: 'buttons' as const,
    options: [
      { value: 'none', label: 'Very quiet inside' },
      { value: 'slight', label: 'Some noise occasionally' },
      { value: 'moderate', label: 'Regular outside noise' },
      { value: 'severe', label: 'Loud and constant noise' },
    ]
  },
];

const calculateScore = (answers: Record<string, string | number | undefined>) => {
  let score = 0;

  // Window age scoring (max 25)
  const ageScores: Record<string, number> = {
    '0-5': 0, '5-10': 10, '10-15': 18, '15-20': 22, '20+': 25
  };
  score += ageScores[answers.windowAge as string] || 0;

  // Energy bill scoring (max 25)
  const billScores: Record<string, number> = {
    '<$100': 5, '$100-200': 12, '$200-300': 18, '$300-400': 22, '$400+': 25
  };
  score += billScores[answers.currentEnergyBill as string] || 0;

  // Home size scoring (max 15)
  const homeSize = Number(answers.homeSize) || 1500;
  score += Math.min(15, Math.round((homeSize / 5000) * 15));

  // Draftiness scoring (max 20)
  const draftScores: Record<string, number> = {
    'none': 0, 'slight': 8, 'moderate': 14, 'severe': 20
  };
  score += draftScores[answers.draftinessLevel as string] || 0;

  // Noise level scoring (max 15)
  const noiseScores: Record<string, number> = {
    'none': 0, 'slight': 6, 'moderate': 11, 'severe': 15
  };
  score += noiseScores[answers.noiseLevel as string] || 0;

  return Math.min(100, score);
};

const RealityCheck = () => {
  usePageTracking('reality-check');
  const { sessionData, updateField, updateFields, markToolCompleted, getPrefilledValue } = useSessionData();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string | number | undefined>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  
  // Conversion modals
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);

  // Initialize answers from session data
  useEffect(() => {
    const prefilled: Record<string, string | number | undefined> = {};
    QUESTIONS.forEach(q => {
      const value = getPrefilledValue(q.id as keyof typeof sessionData);
      if (value !== undefined && (typeof value === 'string' || typeof value === 'number')) {
        prefilled[q.id] = value;
      }
    });
    if (Object.keys(prefilled).length > 0) {
      setAnswers(prefilled);
    }
  }, [getPrefilledValue]);

  const currentQuestion = QUESTIONS[currentStep - 1];
  const isLastStep = currentStep === QUESTIONS.length;
  const canProceed = answers[currentQuestion?.id] !== undefined;

  const handleAnswer = (value: string | number) => {
    const questionId = currentQuestion.id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Save to session immediately
    updateField(questionId as keyof SessionData, value as SessionData[keyof SessionData]);
  };

  const handleNext = () => {
    if (isLastStep) {
      // Calculate and save score
      const finalScore = calculateScore(answers);
      setScore(finalScore);
      updateFields({
        realityCheckScore: finalScore,
        homeSize: Number(answers.homeSize) || undefined,
        windowAge: answers.windowAge as string | undefined,
        currentEnergyBill: answers.currentEnergyBill as string | undefined,
        draftinessLevel: answers.draftinessLevel as SessionData['draftinessLevel'],
        noiseLevel: answers.noiseLevel as SessionData['noiseLevel'],
      });
      markToolCompleted('reality-check');

      // Track tool completion
      trackToolCompletion({ toolName: 'reality-check', score: finalScore });
      
      setShowResults(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleEmailReport = () => {
    setShowLeadModal(true);
  };
  
  const handleScheduleConsult = () => {
    setShowConsultModal(true);
  };
  
  const handleLeadSuccess = (leadId: string) => {
    updateFields({ leadId });
    setShowLeadModal(false);
    
    // Track lead capture in GTM
    trackLeadCapture({
      sourceTool: 'reality-check' satisfies SourceTool,
      email: sessionData.email || '',
      leadScore: score,
    });
  };
  
  const handleConsultSuccess = () => {
    updateFields({ consultationRequested: true });
    setShowConsultModal(false);
    
    // Track consultation in GTM
    trackConsultation({
      name: sessionData.name || '',
      phone: sessionData.phone || '',
      email: sessionData.email || '',
      leadScore: score,
    });
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Reality Check Quiz"
          description="Answer 5 quick questions about your current windows to get your Reality Score and see if replacement is urgent, recommended, or optional."
          canonicalUrl="https://itswindowman.com/reality-check"
          jsonLd={getToolPageSchemas('reality-check')}
        />
        <Navbar />
        
        <main className="container mx-auto px-4 py-12 max-w-2xl pt-20">
          <RealityReport 
            score={score} 
            sessionData={sessionData}
            onEmailReport={handleEmailReport}
            onScheduleConsult={handleScheduleConsult}
          />
        </main>
        
        {/* Conversion Modals */}
        <LeadCaptureModal
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          onSuccess={handleLeadSuccess}
          sourceTool="reality-check"
          sessionData={sessionData}
        />
        
        <ConsultationBookingModal
          isOpen={showConsultModal}
          onClose={() => setShowConsultModal(false)}
          onSuccess={handleConsultSuccess}
          sessionData={sessionData}
          sourceTool="reality-check"
          leadId={sessionData.leadId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Reality Check Quiz"
        description="Answer 5 quick questions about your current windows to get your Reality Score and see if replacement is urgent, recommended, or optional."
        canonicalUrl="https://itswindowman.com/reality-check"
        jsonLd={getToolPageSchemas('reality-check')}
      />
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-2xl pt-20">
        <ProgressBar currentStep={currentStep} totalSteps={QUESTIONS.length} />

        <div className="min-h-[400px] flex flex-col justify-center">
          <QuestionStep
            key={currentStep}
            question={currentQuestion.question}
            description={currentQuestion.description}
            type={currentQuestion.type}
            options={currentQuestion.options}
            sliderConfig={currentQuestion.sliderConfig}
            value={answers[currentQuestion.id]}
            onChange={handleAnswer}
            isPrefilled={getPrefilledValue(currentQuestion.id as keyof typeof sessionData) !== undefined && answers[currentQuestion.id] === getPrefilledValue(currentQuestion.id as keyof typeof sessionData)}
          />
        </div>

        <div className="flex justify-between items-center mt-8 pt-8 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="gap-2 bg-primary hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          >
            {isLastStep ? 'See My Results' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* Related Tools */}
      <RelatedToolsGrid
        title={getFrameControl('reality-check').title}
        description={getFrameControl('reality-check').description}
        tools={getSmartRelatedTools('reality-check', sessionData.toolsCompleted)}
      />

      {/* Minimal Footer */}
      <MinimalFooter />
    </div>
  );
};

export default RealityCheck;
