import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackLeadCapture, trackLeadSubmissionSuccess, trackEvent } from '@/lib/gtm';
import { getOrCreateClientId } from '@/lib/tracking';
import { getOrCreateSessionId } from '@/lib/tracking';
import { getAttributionData } from '@/lib/attribution';
import { getLastNonDirectAttribution } from '@/lib/attribution';
import { normalizeToE164 } from '@/lib/phoneFormat';
import { calculateLeadScore } from './useLeadScoring';
import { LeadStep1Capture } from './LeadStep1Capture';
import { LeadStepTimeline } from './LeadStepTimeline';
import { LeadStepQuote } from './LeadStepQuote';
import { LeadStepHomeowner } from './LeadStepHomeowner';
import { LeadStepWindowCount } from './LeadStepWindowCount';
import { LeadResultScreen } from './LeadResultScreen';
import type {
  PreQuoteLeadModalV2Props,
  StepType,
  ContactData,
  QualificationData,
  Timeline,
  HasQuote,
  WindowScope,
  LeadSegment,
  ScoringResult,
} from './types';
import { STEP_ORDER, QUALIFICATION_STEPS, getV2PhoneSourceTool } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Session storage key for lead ID persistence
// ═══════════════════════════════════════════════════════════════════════════

const SESSION_KEY = 'wm_prequote_v2_lead_id';

function getStoredLeadId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function storeLeadId(id: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, id);
  } catch {
    // Non-critical
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Progress indicator
// ═══════════════════════════════════════════════════════════════════════════

function StepProgress({ currentStep }: { currentStep: StepType }) {
  const stepIndex = QUALIFICATION_STEPS.indexOf(currentStep);
  const isResult = currentStep === 'result';
  const total = QUALIFICATION_STEPS.length;
  const current = isResult ? total : stepIndex + 1;

  return (
    <div className="px-6 pt-4 pb-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {isResult ? 'Done' : `Step ${current} of ${total}`}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function PreQuoteLeadModalV2({
  isOpen,
  onClose,
  onSuccess,
  ctaSource = 'unknown',
  sourcePage,
}: PreQuoteLeadModalV2Props) {
  const { toast } = useToast();

  // UI-only test mode: ?v2ui=1 skips all backend calls
  const [searchParams] = useSearchParams();
  const uiOnly = searchParams.get('v2ui') === '1';

  // Step machine
  const [step, setStep] = useState<StepType>('capture');

  // Lead identity (persisted after Step 1)
  const [leadId, setLeadId] = useState<string | null>(getStoredLeadId);
  const [contactData, setContactData] = useState<ContactData | null>(null);

  // Qualification data (in-memory until Step 5)
  const [qualification, setQualification] = useState<QualificationData>({
    timeline: null,
    hasQuote: null,
    homeowner: null,
    windowScope: null,
  });

  // Result
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);

  // Loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // Reset on close
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isOpen) {
      // Don't clear leadId (persists in sessionStorage)
      // But reset to capture step if qualification not completed
      setTimeout(() => {
        if (step !== 'result') {
          // If they haven't completed, reset to step 1 on re-open
          // Lead already exists from Step 1, but modal resets
          if (!leadId) {
            setStep('capture');
          }
        }
        setQualification({
          timeline: null,
          hasQuote: null,
          homeowner: null,
          windowScope: null,
        });
        setScoringResult(null);
      }, 300);
    }
  }, [isOpen]);

  // ═══════════════════════════════════════════════════════════════════════
  // Step 1: Create lead via save-lead
  // ═══════════════════════════════════════════════════════════════════════
  const handleStep1Submit = useCallback(
    async (data: ContactData) => {
      setIsSubmitting(true);

      // UI_ONLY mode: skip save-lead, generate fake leadId
      if (uiOnly) {
        const fakeId = crypto.randomUUID();
        console.info('[V2 UI_ONLY] Skipping save-lead, using fake leadId:', fakeId);
        setLeadId(fakeId);
        storeLeadId(fakeId);
        setContactData(data);
        setIsSubmitting(false);
        setStep('timeline');
        return;
      }

      try {
        const clientId = getOrCreateClientId();
        const sessionId = getOrCreateSessionId();
        const attribution = getAttributionData();
        const lastNonDirect = getLastNonDirectAttribution();
        const resolvedSourcePage =
          sourcePage ||
          (typeof window !== 'undefined' ? window.location.pathname : '');

        const { data: result, error } = await supabase.functions.invoke(
          'save-lead',
          {
            body: {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone.replace(/\D/g, ''),
              sourceTool: 'sample-report',
              flowVersion: 'prequote_v2',
              sourcePage: resolvedSourcePage,
              sessionData: {
                clientId,
                client_id: clientId,
                ctaSource,
              },
              attribution,
              lastNonDirect: {
                utm_source: lastNonDirect.utm_source,
                utm_medium: lastNonDirect.utm_medium,
                gclid: lastNonDirect.gclid,
                fbclid: (lastNonDirect as Record<string, unknown>).fbc as string || undefined,
                channel: lastNonDirect.channel,
                landing_page: lastNonDirect.landing_page,
              },
              sessionId,
            },
          }
        );

        if (error) throw error;

        if (result?.leadId) {
          const newLeadId = result.leadId;
          setLeadId(newLeadId);
          storeLeadId(newLeadId);
          setContactData(data);

          // Fire GTM events (non-blocking)
          Promise.allSettled([
            trackLeadCapture(
              {
                leadId: newLeadId,
                sourceTool: 'sample_report',
                conversionAction: 'prequote_v2_signup',
              },
              data.email,
              data.phone,
              { hasName: true, hasPhone: true }
            ),
            trackLeadSubmissionSuccess({
              leadId: newLeadId,
              email: data.email,
              phone: data.phone.replace(/\D/g, ''),
              firstName: data.firstName,
              lastName: data.lastName,
              sourceTool: 'sample-report',
              eventId: `prequote_v2_lead:${newLeadId}`,
              value: 75,
            }),
          ]).catch((err) =>
            console.warn('[V2] Non-fatal tracking error:', err)
          );

          onSuccess?.(newLeadId);
          setStep('timeline');
        }
      } catch (err) {
        console.error('[V2] Step 1 submit error:', err);
        toast({
          title: 'Something went wrong',
          description: 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [ctaSource, sourcePage, onSuccess, toast, uiOnly]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Steps 2-5: Qualification selection handlers
  // ═══════════════════════════════════════════════════════════════════════
  const handleTimelineSelect = useCallback((value: Timeline) => {
    setQualification((prev) => ({ ...prev, timeline: value }));
    setStep('quote');
  }, []);

  const handleQuoteSelect = useCallback((value: HasQuote) => {
    setQualification((prev) => ({ ...prev, hasQuote: value }));
    setStep('homeowner');
  }, []);

  const handleHomeownerSelect = useCallback((value: boolean) => {
    setQualification((prev) => ({ ...prev, homeowner: value }));
    setStep('windowCount');
  }, []);

  // Step 5 is special: after selection, compute score, PATCH, then show result
  const handleWindowScopeSelect = useCallback(
    async (value: WindowScope) => {
      const finalQualification: QualificationData = {
        ...qualification,
        windowScope: value,
      };
      setQualification(finalQualification);

      // Compute score
      const result = calculateLeadScore(finalQualification);
      setScoringResult(result);

      // UI_ONLY mode: skip all backend calls, show result directly
      if (uiOnly) {
        console.info('[V2 UI_ONLY] Skipping PATCH + enqueue, score:', result.score, 'segment:', result.segment);
        setStep('result');
        return;
      }

      // PATCH lead with qualification data (non-blocking for UI)
      if (leadId) {
        const clientId = getOrCreateClientId();
        const sessionId = getOrCreateSessionId();

        // PATCH lead via update-lead-qualification
        try {
          const { error: patchError } = await supabase.functions.invoke(
            'update-lead-qualification',
            {
              body: {
                leadId,
                timeline: finalQualification.timeline,
                hasQuote: finalQualification.hasQuote,
                homeowner: finalQualification.homeowner,
                windowScope: value,
                leadScore: result.score,
                leadSegment: result.segment,
                sessionId,
                clientId,
                sourceTool: 'sample-report',
              },
            }
          );

          if (patchError) {
            console.error('[V2] Qualification PATCH failed:', patchError);
            // Non-fatal: show result anyway
          }
        } catch (err) {
          console.error('[V2] Qualification PATCH exception:', err);
        }

        // Fire segment-specific GTM events (ONLY after PATCH)
        fireSegmentEvents(result.segment, result.score, leadId);

        // Enqueue phone call for HOT leads (fire-and-forget)
        enqueuePhoneCallIfEligible(
          result.segment,
          finalQualification,
          leadId,
          ctaSource
        );
      }

      // Transition to result screen
      setStep('result');
    },
    [qualification, leadId, ctaSource, uiOnly]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // GTM segment events (CRITICAL: only fire after PATCH and segment known)
  // ═══════════════════════════════════════════════════════════════════════
  const fireSegmentEvents = (
    segment: LeadSegment,
    score: number,
    currentLeadId: string
  ) => {
    if (segment === 'HOT') {
      trackEvent('Lead_HighIntent', {
        lead_id: currentLeadId,
        lead_score: score,
        lead_segment: segment,
        source: 'prequote-v2',
        value: 150,
        currency: 'USD',
      });
    } else if (segment === 'WARM') {
      trackEvent('Lead_MidIntent', {
        lead_id: currentLeadId,
        lead_score: score,
        lead_segment: segment,
        source: 'prequote-v2',
        value: 50,
        currency: 'USD',
      });
    } else {
      trackEvent(`Lead_${segment}`, {
        lead_id: currentLeadId,
        lead_score: score,
        lead_segment: segment,
        source: 'prequote-v2',
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Phone call enqueue (fire-and-forget, non-blocking)
  // ═══════════════════════════════════════════════════════════════════════
  const enqueuePhoneCallIfEligible = (
    segment: LeadSegment,
    qual: QualificationData,
    currentLeadId: string,
    source: string
  ) => {
    const shouldEnqueue =
      segment === 'HOT' &&
      qual.homeowner === true &&
      (qual.timeline === '30days' || qual.timeline === '90days') &&
      contactData?.phone;

    if (!shouldEnqueue || !contactData) return;

    const phoneE164 = normalizeToE164(contactData.phone);
    if (!phoneE164) return;

    const phoneSourceTool = getV2PhoneSourceTool(source);

    // Fire-and-forget: never block UI
    supabase.functions
      .invoke('enqueue-phonecall', {
        body: {
          leadId: currentLeadId,
          sourceTool: phoneSourceTool,
          phoneE164,
          payload: {
            email: contactData.email,
            first_name: contactData.firstName,
            timeline: qual.timeline,
            has_quote: qual.hasQuote,
            window_scope: qual.windowScope,
            lead_score: scoringResult?.score,
            lead_segment: segment,
            source_page:
              typeof window !== 'undefined'
                ? window.location.pathname
                : '',
          },
        },
      })
      .catch((err) =>
        console.warn('[V2] Phone enqueue failed (non-blocking):', err)
      );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Back navigation
  // ═══════════════════════════════════════════════════════════════════════
  const handleBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 1) {
      // Go back (but never back to Step 1 capture)
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [step]);

  const canGoBack =
    step !== 'capture' && step !== 'timeline' && step !== 'result';
  // Allow back from timeline to capture only if leadId not yet set
  const showBack = step !== 'capture' && step !== 'result';

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[480px] p-0 overflow-hidden"
        aria-labelledby="v2-modal-title"
      >
        {/* Progress bar */}
        <StepProgress currentStep={step} />

        {/* Back button */}
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="absolute top-4 left-4 p-1 rounded-full hover:bg-muted text-muted-foreground z-10"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* Step content */}
        {step === 'capture' && (
          <LeadStep1Capture
            onSubmit={handleStep1Submit}
            isSubmitting={isSubmitting}
          />
        )}

        {step === 'timeline' && (
          <LeadStepTimeline
            onSelect={handleTimelineSelect}
            selected={qualification.timeline}
          />
        )}

        {step === 'quote' && (
          <LeadStepQuote
            onSelect={handleQuoteSelect}
            selected={qualification.hasQuote}
          />
        )}

        {step === 'homeowner' && (
          <LeadStepHomeowner
            onSelect={handleHomeownerSelect}
            selected={qualification.homeowner}
          />
        )}

        {step === 'windowCount' && (
          <LeadStepWindowCount
            onSelect={handleWindowScopeSelect}
            selected={qualification.windowScope}
          />
        )}

        {step === 'result' && scoringResult && leadId && (
          <LeadResultScreen
            segment={scoringResult.segment}
            leadId={leadId}
            firstName={contactData?.firstName || ''}
            leadScore={scoringResult.score}
            onClose={onClose}
            ctaSource={ctaSource}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
