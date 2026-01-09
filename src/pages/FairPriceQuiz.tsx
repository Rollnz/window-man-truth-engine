import { useState } from 'react';
import { QuizHero } from '@/components/fair-price-quiz/QuizHero';
import { QuizQuestion } from '@/components/fair-price-quiz/QuizQuestion';
import { AnalysisTheater } from '@/components/fair-price-quiz/AnalysisTheater';
import { BlurGate } from '@/components/fair-price-quiz/BlurGate';
import { QuizResults } from '@/components/fair-price-quiz/QuizResults';
import { quizQuestions } from '@/data/fairPriceQuizData';
import { calculatePriceAnalysis, QuizAnswers, PriceAnalysis, calculateLeadScore } from '@/lib/fairPriceCalculations';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { trackEvent, trackLeadCapture, trackToolCompletion } from '@/lib/gtm';
import { supabase } from '@/integrations/supabase/client';
import { getAttributionData } from '@/lib/attribution';

type Phase = 'hero' | 'quiz' | 'analysis' | 'blur-gate' | 'results';

export default function FairPriceQuiz() {
  usePageTracking('fair-price-quiz');
  const { updateFields, markToolCompleted } = useSessionData();

  const [phase, setPhase] = useState<Phase>('hero');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number | string[]>>({});
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const totalQuestions = quizQuestions.length;
  const currentQuestion = quizQuestions[currentStep];

  const handleStart = () => {
    setPhase('quiz');
    trackEvent('quiz_started', {
      tool_name: 'fair-price-quiz',
    });
  };

  const handleAnswer = (value: string | number | string[]) => {
    const newAnswers = { ...answers, [currentStep]: value };
    setAnswers(newAnswers);

    // Track question completion
    trackEvent('quiz_question_completed', {
      tool_name: 'fair-price-quiz',
      question_number: currentStep + 1,
      question_type: currentQuestion.type,
    });

    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Quiz complete, build answers object and show analysis theater
      const quizAnswers: QuizAnswers = {
        propertyType: newAnswers[0] as string,
        sqft: newAnswers[1] as string,
        windowCount: newAnswers[2] as number,
        contractorFlags: newAnswers[3] as string[],
        quoteAmount: newAnswers[4] as number,
        quoteDate: newAnswers[5] as string,
        otherQuotes: newAnswers[6] as string,
      };

      // Calculate analysis
      const priceAnalysis = calculatePriceAnalysis(quizAnswers);
      setAnalysis(priceAnalysis);

      // Save to session
      updateFields({
        windowCount: quizAnswers.windowCount,
      });

      setPhase('analysis');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnalysisComplete = () => {
    setPhase('blur-gate');
  };

  const handleBlurGateSubmit = async (name: string, email: string) => {
    setUserName(name);
    setUserEmail(email);

    // Build quiz answers object
    const quizAnswers: QuizAnswers = {
      propertyType: answers[0] as string,
      sqft: answers[1] as string,
      windowCount: answers[2] as number,
      contractorFlags: answers[3] as string[],
      quoteAmount: answers[4] as number,
      quoteDate: answers[5] as string,
      otherQuotes: answers[6] as string,
    };

    const leadScore = calculateLeadScore(quizAnswers, false);
    const attribution = getAttributionData();

    // Persist to session for Vault sync
    updateFields({
      email,
      name,
      windowCount: quizAnswers.windowCount,
    });

    // Save lead to database
    try {
      await supabase.functions.invoke('save-lead', {
        body: {
          email,
          name,
          source_tool: 'fair-price-quiz',
          source_form: 'blur-gate',
          session_data: {
            quizAnswers,
            analysis,
            leadScore,
          },
          window_count: quizAnswers.windowCount,
          ...attribution,
        },
      });

      // Track lead capture via GTM
      trackLeadCapture({
        sourceTool: 'fair-price-quiz',
        email,
        leadScore,
        hasPhone: false,
      });
    } catch (error) {
      console.error('Failed to save lead:', error);
    }

    markToolCompleted('fair-price-quiz');
    setPhase('results');
  };

  const handlePhoneSubmit = async (phone: string) => {
    // Build quiz answers object for webhook
    const quizAnswers: QuizAnswers = {
      propertyType: answers[0] as string,
      sqft: answers[1] as string,
      windowCount: answers[2] as number,
      contractorFlags: answers[3] as string[],
      quoteAmount: answers[4] as number,
      quoteDate: answers[5] as string,
      otherQuotes: answers[6] as string,
    };

    const leadScore = calculateLeadScore(quizAnswers, true);

    // Trigger PhoneCall.bot via secure edge function
    try {
      await supabase.functions.invoke('trigger-phone-call', {
        body: {
          phone,
          name: userName,
          email: userEmail,
          quizContext: {
            // All quiz answers included
            propertyType: quizAnswers.propertyType,
            sqft: quizAnswers.sqft,
            windowCount: quizAnswers.windowCount,
            contractorFlags: quizAnswers.contractorFlags,
            quoteAmount: quizAnswers.quoteAmount,
            quoteDate: quizAnswers.quoteDate,
            otherQuotes: quizAnswers.otherQuotes,
            // Analysis results
            grade: analysis?.grade,
            verdict: analysis?.verdict,
            fairMarketValueLow: analysis?.fairMarketValue.low,
            fairMarketValueHigh: analysis?.fairMarketValue.high,
            potentialOverpay: analysis?.potentialOverpay,
            redFlagCount: analysis?.redFlagCount,
            redFlags: analysis?.redFlags,
            leadScore,
          },
        },
      });

      // Update lead with phone in DB
      await supabase.functions.invoke('save-lead', {
        body: {
          email: userEmail,
          phone,
          source_tool: 'fair-price-quiz',
          source_form: 'phone-capture',
        },
      });

      // Track tool completion
      trackToolCompletion({
        toolName: 'fair-price-quiz',
        score: leadScore,
      });
    } catch (error) {
      console.error('Failed to trigger phone call:', error);
    }
  };

  // Build answers object for results page
  const getQuizAnswers = (): QuizAnswers => ({
    propertyType: answers[0] as string,
    sqft: answers[1] as string,
    windowCount: answers[2] as number,
    contractorFlags: answers[3] as string[],
    quoteAmount: answers[4] as number,
    quoteDate: answers[5] as string,
    otherQuotes: answers[6] as string,
  });

  return (
    <div className="min-h-screen bg-background">
      {phase === 'hero' && <QuizHero onStart={handleStart} />}

      {phase === 'quiz' && currentQuestion && (
        <QuizQuestion
          question={currentQuestion}
          currentStep={currentStep}
          totalSteps={totalQuestions}
          value={answers[currentStep] ?? (currentQuestion.type === 'multiselect' ? [] : '')}
          onAnswer={handleAnswer}
          onBack={handleBack}
          canGoBack={currentStep > 0}
        />
      )}

      {phase === 'analysis' && (
        <AnalysisTheater onComplete={handleAnalysisComplete} />
      )}

      {phase === 'blur-gate' && analysis && (
        <BlurGate analysis={analysis} onSubmit={handleBlurGateSubmit} />
      )}

      {phase === 'results' && analysis && (
        <QuizResults
          analysis={analysis}
          answers={getQuizAnswers()}
          userName={userName}
          userEmail={userEmail}
          onPhoneSubmit={handlePhoneSubmit}
        />
      )}
    </div>
  );
}
