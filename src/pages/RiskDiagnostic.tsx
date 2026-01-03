import { useState, useCallback } from 'react';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { logEvent } from '@/lib/windowTruthClient';
import { getQuestionByIndex, getTotalQuestions } from '@/data/riskDiagnosticData';
import { calculateRiskScores, RiskAnswers } from '@/lib/riskCalculations';
import { RiskHero } from '@/components/risk-diagnostic/RiskHero';
import { RiskQuestion } from '@/components/risk-diagnostic/RiskQuestion';
import { ProtectionReport } from '@/components/risk-diagnostic/ProtectionReport';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';

type Phase = 'hero' | 'questions' | 'results';
type Direction = 'forward' | 'backward';

export default function RiskDiagnostic() {
  usePageTracking('risk-diagnostic');
  const { sessionData, updateField, updateFields, markToolCompleted } = useSessionData();
  const [phase, setPhase] = useState<Phase>('hero');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<RiskAnswers>({});
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<Direction>('forward');

  const totalQuestions = getTotalQuestions();
  const questionData = getQuestionByIndex(currentQuestionIndex);
  const breakdown = calculateRiskScores(answers);

  const handleStart = () => {
    setPhase('questions');
  };

  const handleSelectAnswer = useCallback((value: string) => {
    if (!questionData || isAnimating) return;

    const newAnswers = { ...answers, [questionData.question.id]: value };
    setAnswers(newAnswers);

    // Start exit animation
    setIsAnimating(true);
    setDirection('forward');

    // After animation, advance to next question or complete
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
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
        markToolCompleted('risk-diagnostic');

        // Track tool completion
        logEvent({
          event_name: 'tool_completed',
          tool_name: 'risk-diagnostic',
          params: {
            overall_protection_score: finalBreakdown.protectionScore,
            storm_protection: Math.round(finalBreakdown.storm.protectionPercentage),
            security_protection: Math.round(finalBreakdown.security.protectionPercentage),
            insurance_protection: Math.round(finalBreakdown.insurance.protectionPercentage),
            warranty_protection: Math.round(finalBreakdown.warranty.protectionPercentage),
          },
        });

        setPhase('results');
      }
      setIsAnimating(false);
    }, 250);
  }, [answers, currentQuestionIndex, totalQuestions, questionData, updateFields, markToolCompleted, isAnimating]);

  const handleBack = () => {
    if (currentQuestionIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setDirection('backward');
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setIsAnimating(false);
      }, 250);
    }
  };

  const handleUpdateHomeSize = (size: number) => {
    updateField('homeSize', size);
  };

  return (
    <div className="min-h-screen bg-background">
      {phase === 'hero' && (
        <RiskHero
          sessionData={sessionData}
          onStart={handleStart}
          hasStarted={false}
        />
      )}

      {phase === 'questions' && questionData && (
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

      {phase === 'results' && (
        <ProtectionReport
          breakdown={breakdown}
          answers={answers}
          sessionData={sessionData}
          onEmailReport={() => setShowLeadModal(true)}
          onScheduleConsultation={() => setShowBookingModal(true)}
          onUpdateHomeSize={handleUpdateHomeSize}
        />
      )}

      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={() => setShowLeadModal(false)}
        sourceTool="risk-diagnostic"
        sessionData={sessionData}
      />

      <ConsultationBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={() => setShowBookingModal(false)}
        sessionData={sessionData}
      />
    </div>
  );
}
