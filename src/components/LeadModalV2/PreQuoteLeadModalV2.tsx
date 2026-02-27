import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ArrowLeft } from 'lucide-react';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useToast } from '@/hooks/use-toast';
import { useLeadSuppression } from '@/hooks/forms/useLeadSuppression';
import { trackLeadCapture, trackEvent } from '@/lib/gtm';
import { wmLead, wmRetarget, wmInternal, wmQualifiedLead, qualifiesForQualifiedLead } from '@/lib/wmTracking';
import { getOrCreateClientId } from '@/lib/tracking';
import { getOrCreateSessionId } from '@/lib/tracking';
import { getAttributionData } from '@/lib/attribution';
import { getLastNonDirectAttribution } from '@/lib/attribution';
import { useLeadIdentity, type ContactField } from '@/hooks/useLeadIdentity';
import { useSessionData } from '@/hooks/useSessionData';
import { normalizeToE164 } from '@/lib/phoneFormat';
import { calculateLeadScore } from './useLeadScoring';
import { LeadStep1Capture } from './LeadStep1Capture';
import { PartialLeadCapture } from './PartialLeadCapture';
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
  PreQuoteLeadModalContextConfig,
} from './types';
import {
  STEP_ORDER,
  QUALIFICATION_STEPS,
  getV2PhoneSourceTool,
  DEFAULT_PREQUOTE_CONTEXT,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Session storage key for lead ID persistence
// ═══════════════════════════════════════════════════════════════════════════

const SESSION_KEY = 'wm_prequote_v2_lead_id';

function storeLeadId(id: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, id);
  } catch {
    // Non-critical
  }
}


function buildContextConfig(
  overrides?: Partial<PreQuoteLeadModalContextConfig>
): PreQuoteLeadModalContextConfig {
  return {
    ...DEFAULT_PREQUOTE_CONTEXT,
    ...overrides,
  };
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
  contextKey = 'default',
  contextConfig,
  hideAfterCompletion = true,
}: PreQuoteLeadModalV2Props) {
  const { toast } = useToast();
  const resolvedContextConfig = useMemo(
    () => buildContextConfig(contextConfig),
    [contextConfig]
  );

  // ─── Session data for partial lead merging ─────────────────────────────
  const { sessionData, updateFields } = useSessionData();

  // ─── Smart lead suppression ────────────────────────────────────────────
  const {
    hasGlobalLead,
    hasCompletedCta,
    storedLeadId,
    markCompleted,
  } = useLeadSuppression(ctaSource);

  // Cross-flow identity check: verified leads from ANY flow skip capture
  const { isVerifiedLead, isPartialLead, missingFields, leadId: globalLeadId } = useLeadIdentity();

  // Merge global identity with flow-specific suppression
  const resolvedLeadId = storedLeadId || globalLeadId || null;
  const hasKnownLead = !!resolvedLeadId || hasGlobalLead || isVerifiedLead;

  const suppressOpen = hideAfterCompletion && hasCompletedCta;

  // Step machine
  const [step, setStep] = useState<StepType>('capture');

  // Lead identity (persisted after Step 1)
  const [leadId, setLeadId] = useState<string | null>(storedLeadId ?? null);
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const closeResetTimerRef = useRef<number | null>(null);
  const reengagedRef = useRef(false);

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
  const [isQualificationSubmitting, setIsQualificationSubmitting] = useState(false);

  // ─── Sync leadId from storage if state missed initialization ─────────
  useEffect(() => {
    if (hasKnownLead && !leadId && resolvedLeadId) {
      setLeadId(resolvedLeadId);
    }
  }, [hasKnownLead, resolvedLeadId, leadId]);

  // ─── Deterministic step on every open (not just mount) ───────────────
  // If user is a verified lead (from ANY flow via leadAnchor + PII), skip capture
  useEffect(() => {
    if (!isOpen) return;
    if (hasKnownLead && resolvedLeadId) {
      setStep('timeline');
    } else {
      setStep('capture');
    }
  }, [isOpen, hasKnownLead, resolvedLeadId]);

  // ─── Re-engagement tracking (once per open, ref-guarded) ─────────────
  useEffect(() => {
    if (!isOpen) {
      reengagedRef.current = false;
      return;
    }
    if (reengagedRef.current) return;

    const didSkip = hasKnownLead && !!resolvedLeadId && step === 'timeline';
    if (!didSkip) return;

    reengagedRef.current = true;
    trackEvent('prequote_modal_reengaged', {
      cta_source: ctaSource,
      lead_id: resolvedLeadId,
      skip_capture: true,
      identity_source: isVerifiedLead ? 'lead_anchor' : 'session_storage',
    });
  }, [isOpen, hasKnownLead, resolvedLeadId, isVerifiedLead, step, ctaSource]);

  // ═══════════════════════════════════════════════════════════════════════
  // Reset on close
  // ═══════════════════════════════════════════════════════════════════════
  // Reset qualification data on close (step is owned by the "on open" effect above)
  useEffect(() => {
    if (!isOpen) {
      if (closeResetTimerRef.current) {
        window.clearTimeout(closeResetTimerRef.current);
      }

      closeResetTimerRef.current = window.setTimeout(() => {
        setQualification({
          timeline: null,
          hasQuote: null,
          homeowner: null,
          windowScope: null,
        });
        setScoringResult(null);
      }, 300);
    }

    return () => {
      if (closeResetTimerRef.current) {
        window.clearTimeout(closeResetTimerRef.current);
      }
    };
  }, [isOpen]);

  // ═══════════════════════════════════════════════════════════════════════
  // Step 1: Create lead via save-lead
  // ═══════════════════════════════════════════════════════════════════════
  const handleStep1Submit = useCallback(
    async (data: ContactData) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const clientId = getOrCreateClientId();
        const sessionId = getOrCreateSessionId();
        const attribution = getAttributionData();
        const lastNonDirect = getLastNonDirectAttribution();
        const resolvedSourcePage =
          sourcePage ||
          (typeof window !== 'undefined' ? window.location.pathname : '');

        const { data: result, error } = await invokeEdgeFunction(
          'save-lead',
          {
            body: {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone.replace(/\D/g, ''),
              sourceTool: resolvedContextConfig.sourceTool,
              flowVersion: 'prequote_v2',
              sourcePage: resolvedSourcePage,
              sessionData: {
                clientId,
                ctaSource,
                contextKey,
              },
              attribution,
              lastNonDirect,
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
                sourceTool: resolvedContextConfig.trackingSourceTool,
                conversionAction: resolvedContextConfig.conversionAction,
              },
              data.email,
              data.phone,
              { hasName: true, hasPhone: true }
            ),
            wmLead(
              { leadId: newLeadId, email: data.email, phone: data.phone.replace(/\D/g, ''), firstName: data.firstName, lastName: data.lastName },
              { source_tool: resolvedContextConfig.sourceTool },
            ),
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
    [
      ctaSource,
      sourcePage,
      onSuccess,
      toast,
      isSubmitting,
      contextKey,
      resolvedContextConfig,
    ]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Partial lead: submit only missing fields, then advance
  // ═══════════════════════════════════════════════════════════════════════
  const handlePartialSubmit = useCallback(
    async (data: Partial<Record<ContactField, string>>) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const currentLeadId = resolvedLeadId;
        const clientId = getOrCreateClientId();
        const sessionId = getOrCreateSessionId();
        const resolvedSourcePage =
          sourcePage ||
          (typeof window !== 'undefined' ? window.location.pathname : '');

        const mergedEmail = data.email || sessionData.email || '';
        const mergedFirstName = data.firstName || sessionData.firstName || '';
        const mergedPhone = (data.phone || sessionData.phone || '').replace(/\D/g, '');

        const { data: result, error } = await invokeEdgeFunction(
          'save-lead',
          {
            body: {
              email: mergedEmail,
              firstName: mergedFirstName,
              phone: mergedPhone,
              sourceTool: resolvedContextConfig.sourceTool,
              flowVersion: 'prequote_v2_partial',
              sourcePage: resolvedSourcePage,
              sessionData: {
                clientId,
                ctaSource,
                contextKey,
              },
              sessionId,
              leadId: currentLeadId || undefined,
            },
          }
        );

        if (error) throw error;

        if (result?.leadId) {
          const newLeadId = result.leadId;
          setLeadId(newLeadId);
          storeLeadId(newLeadId);

          // Sync updated fields into shared session state
          updateFields({
            leadId: newLeadId,
            ...(data.email && { email: data.email }),
            ...(data.firstName && { firstName: data.firstName }),
            ...(data.phone && { phone: data.phone }),
          });

          trackEvent('partial_lead_completed', {
            lead_id: newLeadId,
            fields_completed: Object.keys(data),
            cta_source: ctaSource,
            identity_source: isVerifiedLead ? 'lead_anchor' : 'session_storage',
          });

          onSuccess?.(newLeadId);
          setStep('timeline');
        }
      } catch (err) {
        console.error('[V2] Partial lead submit error:', err);
        toast({
          title: 'Something went wrong',
          description: 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      ctaSource,
      sourcePage,
      onSuccess,
      toast,
      isSubmitting,
      isVerifiedLead,
      contextKey,
      resolvedContextConfig,
      resolvedLeadId,
      updateFields,
      sessionData.email,
      sessionData.firstName,
      sessionData.phone,
    ]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Steps 2-5: Qualification selection handlers
  // ═══════════════════════════════════════════════════════════════════════
  const handleTimelineSelect = useCallback((value: Timeline) => {
    setQualification((prev) => ({ ...prev, timeline: value }));
    wmInternal('prequote_step_timeline', {
      lead_id: leadId,
      source_tool: 'prequote-v2',
      timeline: value,
    });
    setStep('quote');
  }, [leadId]);

  const handleQuoteSelect = useCallback((value: HasQuote) => {
    setQualification((prev) => ({ ...prev, hasQuote: value }));
    wmInternal('prequote_step_quote', {
      lead_id: leadId,
      source_tool: 'prequote-v2',
      has_quote: value,
    });
    setStep('homeowner');
  }, [leadId]);

  const handleHomeownerSelect = useCallback((value: boolean) => {
    setQualification((prev) => ({ ...prev, homeowner: value }));
    wmInternal('prequote_step_homeowner', {
      lead_id: leadId,
      source_tool: 'prequote-v2',
      homeowner: value,
    });
    setStep('windowCount');
  }, [leadId]);

  // ═══════════════════════════════════════════════════════════════════════
  // GTM segment events (CRITICAL: only fire after PATCH and segment known)
  // ═══════════════════════════════════════════════════════════════════════
  const fireSegmentEvents = useCallback((
    segment: LeadSegment,
    score: number,
    currentLeadId: string
  ) => {
    if (segment === 'HOT') {
      wmRetarget('wm_lead_highintent_rt', {
        lead_id: currentLeadId,
        lead_score: score,
        lead_segment: segment,
        source: `prequote-v2:${contextKey}`,
      });
    } else if (segment === 'WARM') {
      wmRetarget('wm_lead_midintent_rt', {
        lead_id: currentLeadId,
        lead_score: score,
        lead_segment: segment,
        source: `prequote-v2:${contextKey}`,
      });
    } else {
      wmInternal(`Lead_${segment}`, {
        lead_id: currentLeadId,
        lead_score: score,
        lead_segment: segment,
        source: `prequote-v2:${contextKey}`,
      });
    }
  }, [contextKey]);

  // ═══════════════════════════════════════════════════════════════════════
  // Phone call enqueue (fire-and-forget, non-blocking)
  // ═══════════════════════════════════════════════════════════════════════
  const enqueuePhoneCallIfEligible = useCallback((
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
    invokeEdgeFunction('enqueue-phonecall', {
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
      }).then(({ error }) => {
        if (error) console.warn('[V2] Phone enqueue failed (non-blocking):', error);
      });
  }, [contactData, scoringResult?.score]);

  // Step 5 is special: after selection, compute score, PATCH, then show result
  const handleWindowScopeSelect = useCallback(
    async (value: WindowScope) => {
      // Guard against rapid repeat clicks causing duplicate PATCH/tracking side-effects.
      if (isQualificationSubmitting) return;
      setIsQualificationSubmitting(true);

      try {
        const finalQualification: QualificationData = {
          ...qualification,
          windowScope: value,
        };
        setQualification(finalQualification);

        // Compute score
        const result = calculateLeadScore(finalQualification);
        setScoringResult(result);

        // PATCH lead with qualification data (non-blocking for UI)
        if (leadId) {
          const clientId = getOrCreateClientId();
          const sessionId = getOrCreateSessionId();

          // PATCH lead via update-lead-qualification
          try {
            const { error: patchError } = await invokeEdgeFunction(
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
                  sourceTool: resolvedContextConfig.sourceTool,
                },
              }
            );

            if (patchError) {
              console.error('[V2] Qualification PATCH failed:', patchError);
            }
          } catch (err) {
            console.error('[V2] Qualification PATCH exception:', err);
          }

          // Fire segment-specific GTM events (ONLY after PATCH)
          fireSegmentEvents(result.segment, result.score, leadId);

          // Check if lead qualifies for wmQualifiedLead
          if (qualifiesForQualifiedLead(finalQualification)) {
            wmQualifiedLead(
              { leadId, email: contactData?.email, phone: contactData?.phone, firstName: contactData?.firstName, lastName: contactData?.lastName },
              { source_tool: 'prequote-v2' },
            ).catch((err) => console.warn('[V2] wmQualifiedLead non-fatal error:', err));
          }

          // Enqueue phone call for HOT leads (fire-and-forget)
          enqueuePhoneCallIfEligible(
            result.segment,
            finalQualification,
            leadId,
            ctaSource
          );

          wmRetarget('wm_qualified_funnel_complete', {
            lead_id: leadId,
            lead_score: result.score,
            lead_segment: result.segment,
            timeline: finalQualification.timeline,
            has_quote: finalQualification.hasQuote,
            homeowner: finalQualification.homeowner,
            window_scope: finalQualification.windowScope,
            source_tool: 'prequote-v2',
            source: `prequote-v2:${contextKey}`,
          });

          // Mark completed AFTER result screen is shown (deferred to onClose)
          // — moved to result screen dismiss handler below
        }

        // Transition to result screen
        setStep('result');
      } finally {
        setIsQualificationSubmitting(false);
      }
    },
    [
      qualification,
      leadId,
      ctaSource,
      hideAfterCompletion,
      resolvedContextConfig,
      fireSegmentEvents,
      enqueuePhoneCallIfEligible,
      isQualificationSubmitting,
    ]
  );

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

  const handleResultClose = useCallback(() => {
    if (hideAfterCompletion) {
      markCompleted();
    }
    onClose();
  }, [hideAfterCompletion, onClose, markCompleted]);

  const showBack =
    step !== 'capture' && step !== 'timeline' && step !== 'result';

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <Dialog open={isOpen && !suppressOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[480px] p-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Lead Qualification</DialogTitle>
        </VisuallyHidden>

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
        {step === 'capture' && !suppressOpen && isPartialLead && missingFields.length > 0 && (
          <PartialLeadCapture
            missingFields={missingFields}
            onSubmit={handlePartialSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {step === 'capture' && !suppressOpen && !isPartialLead && (
          <LeadStep1Capture
            onSubmit={handleStep1Submit}
            isSubmitting={isSubmitting}
          />
        )}

        {step === 'timeline' && (
          <LeadStepTimeline
            onSelect={handleTimelineSelect}
            selected={qualification.timeline}
            isReturning={hasKnownLead && !!resolvedLeadId}
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
            onClose={handleResultClose}
            ctaSource={ctaSource}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
