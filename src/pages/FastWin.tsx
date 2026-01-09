import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { trackToolCompletion } from '@/lib/gtm';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';
import { fastWinQuestions } from '@/data/fastWinData';
import { calculateFastWin, type FastWinAnswers, type FastWinResult } from '@/lib/fastWinLogic';
import { FastWinHero } from '@/components/fast-win/FastWinHero';
import { SpeedCard } from '@/components/fast-win/SpeedCard';
import { ShuffleAnimation } from '@/components/fast-win/ShuffleAnimation';
import { WinnerCard } from '@/components/fast-win/WinnerCard';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import type { SourceTool } from '@/types/sourceTool';

type Phase = 'hero' | 'questions' | 'calculating' | 'result';

export default function FastWin() {
  usePageTracking('fast-win');
  const { sessionData, updateFields, markToolCompleted, hasExistingData } = useSessionData();
  
  const [phase, setPhase] = useState<Phase>('hero');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<FastWinAnswers>>({});
  const [result, setResult] = useState<FastWinResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  
  // Modal states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  const handleStart = () => {
    setPhase('questions');
  };

  const handleSelectAnswer = (value: string) => {
    setIsAnimating(true);
    setDirection('forward');

    const questionId = fastWinQuestions[currentStep].id;
    const answerKey = questionId.replace('-', '') as keyof FastWinAnswers;
    
    // Map question IDs to answer keys
    const keyMap: Record<string, keyof FastWinAnswers> = {
      'pain-point': 'painPoint',
      'orientation': 'orientation',
      'current-status': 'currentStatus',
      'budget-priority': 'budgetPriority',
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
        setPhase('calculating');
        setIsAnimating(false);
      }
    }, 250);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setDirection('back');
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 250);
    } else {
      setPhase('hero');
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

    markToolCompleted('fast-win');

    // Track tool completion
    trackToolCompletion({ toolName: 'fast-win' });

    setPhase('result');
  }, [answers, updateFields, markToolCompleted]);

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
      {/* Header - only show on hero and result */}
      {(phase === 'hero' || phase === 'result') && (
        <header className="absolute top-0 left-0 right-0 z-20 p-4">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Link>
        </header>
      )}

      {/* Phases */}
      {phase === 'hero' && (
        <FastWinHero onStart={handleStart} hasSessionData={hasExistingData} />
      )}

      {phase === 'questions' && (
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

      {phase === 'calculating' && (
        <ShuffleAnimation onComplete={handleCalculationComplete} />
      )}

      {phase === 'result' && result && (
        <WinnerCard
          result={result}
          onSave={handleSave}
          onGetPrice={handleGetPrice}
        />
      )}

      {/* Modals */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={handleLeadSuccess}
        sourceTool={'fast-win' satisfies SourceTool}
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
      />

      {/* Minimal Footer */}
      <MinimalFooter />
    </div>
  );
}
