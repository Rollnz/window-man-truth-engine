import { useState } from 'react';
import { Phone, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StampBadge } from '@/components/beat-your-quote/StampBadge';
import { PANEL_VARIANT_CONFIG } from '@/lib/panelVariants';
import { CtaCard } from './shared/CtaCard';
import { MiniTrustBar } from './shared/MiniTrustBar';
import { trackEvent } from '@/lib/gtm';
import { cn } from '@/lib/utils';
import { useTickerStats } from '@/hooks/useTickerStats';
import type { ChoiceVariantProps } from './types';

type QuizStep = 0 | 1 | 2 | 'done';

interface QuizAnswers {
  windowAge: string | null;
  concern: string | null;
  timeline: string | null;
}

function getRiskLevel(answers: QuizAnswers): 'HIGH' | 'MEDIUM' | 'LOW' {
  let score = 0;
  if (answers.windowAge === '15+' || answers.windowAge === 'unknown') score += 2;
  else if (answers.windowAge === '5-15') score += 1;
  if (answers.concern === 'storm') score += 2;
  else if (answers.concern === 'energy') score += 1;
  if (answers.timeline === 'asap') score += 2;
  else if (answers.timeline === '1-3mo') score += 1;
  if (score >= 4) return 'HIGH';
  if (score >= 2) return 'MEDIUM';
  return 'LOW';
}

const riskColors = {
  HIGH: 'text-destructive border-destructive/30 bg-destructive/10',
  MEDIUM: 'text-secondary border-secondary/30 bg-secondary/10',
  LOW: 'text-success border-success/30 bg-success/10',
};

/**
 * Variant B: "The 30-Second Diagnostic" (Diagnostic/Quiz)
 *
 * Inline 3-question micro-quiz → risk level → route to form or call.
 * 3rd CTA category: Diagnostic/Quiz
 */
export function VariantB_DiagnosticQuiz({
  onCallClick,
  onStartForm,
  onStartAiQa,
}: ChoiceVariantProps) {
  const config = PANEL_VARIANT_CONFIG.B;
  const { total } = useTickerStats();
  const [quizStep, setQuizStep] = useState<QuizStep>(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>({
    windowAge: null,
    concern: null,
    timeline: null,
  });

  const startQuiz = () => {
    setQuizStarted(true);
    trackEvent('inline_quiz_started', { panel_variant: 'B' });
  };

  const selectAnswer = (field: keyof QuizAnswers, value: string) => {
    const updated = { ...answers, [field]: value };
    setAnswers(updated);

    if (quizStep === 0) setQuizStep(1);
    else if (quizStep === 1) setQuizStep(2);
    else if (quizStep === 2) {
      setQuizStep('done');
      const risk = getRiskLevel(updated);
      trackEvent('inline_quiz_completed', {
        panel_variant: 'B',
        risk_level: risk,
        quiz_answers: updated,
      });
    }
  };

  const riskLevel = quizStep === 'done' ? getRiskLevel(answers) : null;

  const QuizOption = ({
    value,
    label,
    selected,
    onClick,
  }: {
    value: string;
    label: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-md text-xs font-medium transition-all min-h-[44px]',
        'border',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4 ">
      {/* Header stamp */}
      <div className="flex justify-center">
        <StampBadge variant="red">CASE FILE</StampBadge>
      </div>

      {/* Headline */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-foreground">
          {config.headline}
        </h3>
        <p className="text-sm text-muted-foreground">{config.subheadline}</p>
      </div>

      {/* Quiz or start button */}
      {!quizStarted ? (
        <div>
          <Button
            onClick={startQuiz}
            variant="cta"
            size="lg"
            className="w-full"
          >
            {config.thirdCtaLabel}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Q1: Window Age */}
          <div className={cn('space-y-2', (quizStep as number) >= 0 ? 'opacity-100' : 'opacity-40')}>
            <div className="flex items-center gap-2">
              {answers.windowAge ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
                  1
                </span>
              )}
              <span className="text-sm font-medium text-foreground">
                How old are your windows?
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pl-6">
              {[
                { value: '<5', label: '< 5 years' },
                { value: '5-15', label: '5-15 years' },
                { value: '15+', label: '15+ years' },
              ].map((opt) => (
                <QuizOption
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  selected={answers.windowAge === opt.value}
                  onClick={() => selectAnswer('windowAge', opt.value)}
                />
              ))}
            </div>
          </div>

          {/* Q2: Concern */}
          {(quizStep as number) >= 1 && (
            <div className="space-y-2 ">
              <div className="flex items-center gap-2">
                {answers.concern ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
                    2
                  </span>
                )}
                <span className="text-sm font-medium text-foreground">
                  Biggest concern?
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pl-6">
                {[
                  { value: 'storm', label: 'Storms' },
                  { value: 'energy', label: 'Energy' },
                  { value: 'noise', label: 'Noise' },
                ].map((opt) => (
                  <QuizOption
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    selected={answers.concern === opt.value}
                    onClick={() => selectAnswer('concern', opt.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Q3: Timeline */}
          {(quizStep as number) >= 2 && (
            <div className="space-y-2 ">
              <div className="flex items-center gap-2">
                {answers.timeline ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
                    3
                  </span>
                )}
                <span className="text-sm font-medium text-foreground">
                  Timeline?
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pl-6">
                {[
                  { value: 'asap', label: 'ASAP' },
                  { value: '1-3mo', label: '1-3 months' },
                  { value: 'later', label: 'Later' },
                ].map((opt) => (
                  <QuizOption
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    selected={answers.timeline === opt.value}
                    onClick={() => selectAnswer('timeline', opt.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {riskLevel && (
            <div className="space-y-3 ">
              <div
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-semibold text-sm',
                  riskColors[riskLevel]
                )}
              >
                Your Assessment Level: {riskLevel}
              </div>

              <Button
                onClick={() => {
                  trackEvent('choice_step_cta_clicked', {
                    panel_variant: 'B',
                    cta_type: 'form',
                    quiz_risk_level: riskLevel,
                  });
                  onStartForm();
                }}
                variant="cta"
                size="lg"
                className="w-full"
              >
                Get Your Full Assessment
              </Button>

              <button
                onClick={() => {
                  onStartAiQa('diagnostic', `My windows are ${answers.windowAge} years old, my biggest concern is ${answers.concern}, and my timeline is ${answers.timeline}.`);
                }}
                className="w-full text-center text-xs text-primary hover:underline"
              >
                Or ask Window Man for a detailed analysis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Always-visible CTAs */}
      <div className="space-y-3 pt-2">
        <CtaCard
          icon={<Phone className="h-5 w-5 text-muted-foreground" />}
          label={config.callCtaLabel}
          onClick={onCallClick}
          variant="ghost"
        />
        {!quizStarted && (
          <CtaCard
            icon={<FileText className="h-5 w-5 text-muted-foreground" />}
            label={config.estimateCtaLabel}
            onClick={onStartForm}
            variant="outline"
          />
        )}
      </div>

      <MiniTrustBar
        stat={`${total.toLocaleString()}+ Quotes Analyzed`}
        riskReversal="Florida Building Code Certified Analysis"
      />
    </div>
  );
}
