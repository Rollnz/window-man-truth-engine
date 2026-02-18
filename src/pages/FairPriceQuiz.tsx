import { useState } from 'react';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/home/Navbar';
import { QuizHero } from '@/components/fair-price-quiz/QuizHero';
import { QuizQuestion } from '@/components/fair-price-quiz/QuizQuestion';
import { AnalysisTheater } from '@/components/fair-price-quiz/AnalysisTheater';
import { BlurGate } from '@/components/fair-price-quiz/BlurGate';
import { QuizResults } from '@/components/fair-price-quiz/QuizResults';
import { quizQuestions } from '@/data/fairPriceQuizData';
import { calculatePriceAnalysis, QuizAnswers, PriceAnalysis, calculateLeadScore } from '@/lib/fairPriceCalculations';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useTrackToolCompletion } from '@/hooks/useTrackToolCompletion';
import { trackEvent, trackLeadCapture, trackToolCompletion } from '@/lib/gtm';
import { wmLead } from '@/lib/wmTracking';
import { supabase } from '@/integrations/supabase/client';
import { getAttributionData, getLastNonDirectAttribution } from '@/lib/attribution';
import { getOrCreateSessionId } from '@/lib/tracking';
import { getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';
import { toast } from 'sonner';

import { ExitIntentModal } from '@/components/authority';
import { getToolPageSchemas, getBreadcrumbSchema } from '@/lib/seoSchemas/index';
import { PillarBreadcrumb } from '@/components/seo/PillarBreadcrumb';
import type { SourceTool } from '@/types/sourceTool';

type Phase = 'hero' | 'quiz' | 'analysis' | 'blur-gate' | 'results';

export default function FairPriceQuiz() {
  usePageTracking('fair-price-quiz');
  const { updateFields, markToolCompleted } = useSessionData();
  const { leadId: hookLeadId, setLeadId } = useLeadIdentity();
  const { trackToolComplete } = useTrackToolCompletion();

  const [phase, setPhase] = useState<Phase>('hero');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number | string[]>>({});
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

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

    trackEvent('quiz_question_completed', {
      tool_name: 'fair-price-quiz',
      question_number: currentStep + 1,
      question_type: currentQuestion.type,
    });

    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const quizAnswers: QuizAnswers = {
        propertyType: newAnswers[0] as string,
        sqft: newAnswers[1] as string,
        windowCount: newAnswers[2] as number,
        contractorFlags: newAnswers[3] as string[],
        quoteAmount: newAnswers[4] as number,
        quoteDate: newAnswers[5] as string,
        otherQuotes: newAnswers[6] as string,
      };

      const priceAnalysis = calculatePriceAnalysis(quizAnswers);
      setAnalysis(priceAnalysis);

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

  const handleBlurGateSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) => {
    const { firstName, lastName, email, phone } = data;

    setUserFirstName(firstName);
    setUserLastName(lastName);
    setUserEmail(email);
    setUserPhone(phone);

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
    const phoneDigits = phone ? phone.replace(/\D/g, '') : '';

    // V2 payload: nested attribution, lastNonDirect, sessionData
    const clientId = getOrCreateAnonId();
    const sessionId = getOrCreateSessionId();
    const attribution = getAttributionData();
    const lastNonDirect = getLastNonDirectAttribution();

    // Persist to session for Vault sync
    updateFields({
      email,
      name: firstName,
      windowCount: quizAnswers.windowCount,
    });

    // Save lead to database with V2 contract
    try {
      const { data: responseData, error } = await supabase.functions.invoke('save-lead', {
        body: {
          email,
          firstName,
          lastName,
          phone: phoneDigits || null,
          leadId: hookLeadId,
          sourceTool: 'fair-price-quiz' satisfies SourceTool,
          flowVersion: 'fair_price_v2',
          sourcePage: window.location.pathname,
          sessionId,
          sessionData: {
            clientId,
            client_id: clientId,
            ctaSource: 'fair-price-result',
            quizAnswers,
            analysis,
            leadScore,
          },
          attribution,
          lastNonDirect,
          window_count: quizAnswers.windowCount,
        },
      });

      if (error) {
        console.error('Failed to save lead:', error);
        toast.error('Something went wrong. Please try again.');
        throw error;
      }

      const newLeadId = responseData?.leadId;

      // Golden Thread: persist leadId for cross-tool tracking
      if (newLeadId) {
        setLeadId(newLeadId);
        updateFields({ leadId: newLeadId });
      }

      // Non-blocking tracking (after successful save)
      Promise.allSettled([
        trackLeadCapture(
          {
            leadId: newLeadId,
            sourceTool: 'fair_price_quiz',
            conversionAction: 'form_submit',
          },
          email,
          phoneDigits || undefined,
          {
            hasName: true,
            hasPhone: !!phoneDigits,
            hasProjectDetails: !!quizAnswers.windowCount,
          }
        ),
        wmLead(
          { leadId: newLeadId, email, phone: phoneDigits || undefined, firstName, lastName: lastName || undefined },
          { source_tool: 'fair-price-quiz' },
        ),
      ]);

      // Track tool completion with delta value for value-based bidding
      trackToolComplete('fair-price-quiz', {
        grade: analysis?.grade,
        quote_amount: analysis?.quoteAmount,
        score: leadScore,
      });

      markToolCompleted('fair-price-quiz');

      // Phase transition ONLY on success
      setPhase('results');
    } catch (error) {
      console.error('Failed to save lead:', error);
      // useFormLock auto-unlocks on error — user can retry
    }
  };

  const handlePhoneSubmit = async (phone: string) => {
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
          phone: phone || userPhone,
          name: userFirstName,
          email: userEmail,
          sourceTool: 'fair-price-quiz',
          context: {
            propertyType: quizAnswers.propertyType,
            sqft: quizAnswers.sqft,
            windowCount: quizAnswers.windowCount,
            contractorFlags: quizAnswers.contractorFlags,
            quoteAmount: quizAnswers.quoteAmount,
            quoteDate: quizAnswers.quoteDate,
            otherQuotes: quizAnswers.otherQuotes,
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

      // Update lead with phone in DB (V2 field names)
      await supabase.functions.invoke('save-lead', {
        body: {
          email: userEmail,
          phone: phone.replace(/\D/g, '') || null,
          sourceTool: 'fair-price-quiz' satisfies SourceTool,
          flowVersion: 'fair_price_v2',
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
      <SEO 
        title="Fair Price Quiz - Is Your Quote Fair?"
        description="Answer 7 quick questions about your window quote to get an instant price analysis. Find out if you're overpaying and get negotiation tips."
        canonicalUrl="https://itswindowman.com/fair-price-quiz"
        jsonLd={[...getToolPageSchemas('fair-price-quiz'), getBreadcrumbSchema('fair-price-quiz')]}
      />
      <Navbar />

      {/* PillarBreadcrumb - links UP to parent pillar */}
      <div className="container px-4 pt-16 pb-2">
        <PillarBreadcrumb toolPath="/fair-price-quiz" variant="badge" />
      </div>

      <div className="pt-2">
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
            userName={userFirstName}
            userEmail={userEmail}
            onPhoneSubmit={handlePhoneSubmit}
            leadId={hookLeadId}
          />
        )}
      </div>

      {/* Related Tools */}
      <RelatedToolsGrid
        title={getFrameControl('fair-price-quiz').title}
        description={getFrameControl('fair-price-quiz').description}
        tools={getSmartRelatedTools('fair-price-quiz')}
      />

      {/* Exit Intent Modal - 3-step re-engagement */}
      {phase === 'results' && analysis && (
        <ExitIntentModal 
          sourceTool="fair-price-quiz"
          hasConverted={!!userEmail}
          resultSummary={`${analysis.grade} grade quote analysis`}
        />
      )}
    </div>
  );
}
