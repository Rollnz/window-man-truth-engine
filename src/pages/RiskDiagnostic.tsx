import { useState, useCallback } from 'react';
import { useSessionData } from '@/hooks/useSessionData';
import { riskCategories, getQuestionByIndex, getTotalQuestions } from '@/data/riskDiagnosticData';
import { calculateRiskScores, RiskAnswers } from '@/lib/riskCalculations';
import { RiskHero } from '@/components/risk-diagnostic/RiskHero';
import { RiskQuestion } from '@/components/risk-diagnostic/RiskQuestion';
import { ProtectionReport } from '@/components/risk-diagnostic/ProtectionReport';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';

type Phase = 'hero' | 'questions' | 'results';

export default function RiskDiagnostic() {
  const { sessionData, updateField, updateFields, markToolCompleted } = useSessionData();
  const [phase, setPhase] = useState<Phase>('hero');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<RiskAnswers>({});
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const totalQuestions = getTotalQuestions();
  const questionData = getQuestionByIndex(currentQuestionIndex);
  const breakdown = calculateRiskScores(answers);

  const handleStart = () => {
    setPhase('questions');
  };

  const handleSelectAnswer = useCallback((value: string) => {
    if (!questionData) return;

    const newAnswers = { ...answers, [questionData.question.id]: value };
    setAnswers(newAnswers);

    // Auto-advance after brief delay
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
        setPhase('results');
      }
    }, 300);
  }, [answers, currentQuestionIndex, totalQuestions, questionData, updateFields, markToolCompleted]);

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
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
          category={questionData.category}
          question={questionData.question}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          selectedValue={answers[questionData.question.id]}
          onSelect={handleSelectAnswer}
          onBack={handleBack}
          canGoBack={currentQuestionIndex > 0}
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
