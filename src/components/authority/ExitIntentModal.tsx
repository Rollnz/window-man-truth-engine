// ============================================
// ExitIntentModal — Smart Conversion Gauntlet
// ============================================
// A 3-tier progressive negotiation ladder that maximizes lead capture
// through value-descending offers: Insider Price → Storm Sentinel → Kitchen Table.
//
// BINDING RULES:
// 1. modal_opened fires ONLY on isOpen transition false→true
// 2. Prefill uses "open snapshot" - captured once, never updated while open
// 3. step_viewed fires exactly once per step entry (prevStepRef guard)
// 4. All analytics wrapped in try/catch
// 5. Back navigation does NOT clear hasDeclined/hasSubmitted
// 6. Segmented control supports Arrow keys for 2x2 grid
// 7. Fat-finger safety: min-h-[48px] buttons, mt-6 + border-t + pt-4 for decline

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, DollarSign, Bell, FileText, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { trackEvent, generateEventId } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getLeadAnchor } from '@/lib/leadAnchor';
import type { SourceTool } from '@/types/sourceTool';
import { FormSurfaceProvider } from '@/components/forms/FormSurfaceProvider';
import { scheduleWhenIdle } from '@/lib/deferredInit';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

type GauntletStep = 'insider_price' | 'storm_sentinel' | 'kitchen_table';

interface ExitIntentModalProps {
  sourceTool: SourceTool;
  hasConverted?: boolean;
  resultSummary?: string;
  onSuccess?: () => void;
}

interface PrefillSnapshot {
  name: string;
  email: string;
  phone: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY_PREFIX = 'gauntlet_exit_intent_';
const MIN_TIME_ON_PAGE = 10000; // 10 seconds
const MIN_SCROLL_DEPTH = 0.3; // 30%

const WINDOW_COUNT_OPTIONS = [
  { label: '1–5', value: '1-5' },
  { label: '6–10', value: '6-10' },
  { label: '11–20', value: '11-20' },
  { label: '20+', value: '20+' },
];

const STEP_CONFIG = {
  insider_price: { number: 1, leadScore: 100 },
  storm_sentinel: { number: 2, leadScore: 60 },
  kitchen_table: { number: 3, leadScore: 30 },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// WINDOW COUNT SELECTOR (Segmented Control)
// ═══════════════════════════════════════════════════════════════════════════

interface WindowCountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function WindowCountSelector({ value, onChange, error }: WindowCountSelectorProps) {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const cols = 2; // 2x2 grid
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % WINDOW_COUNT_OPTIONS.length;
        break;
      case 'ArrowLeft':
        newIndex = (index - 1 + WINDOW_COUNT_OPTIONS.length) % WINDOW_COUNT_OPTIONS.length;
        break;
      case 'ArrowDown':
        newIndex = (index + cols) % WINDOW_COUNT_OPTIONS.length;
        break;
      case 'ArrowUp':
        newIndex = (index - cols + WINDOW_COUNT_OPTIONS.length) % WINDOW_COUNT_OPTIONS.length;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onChange(WINDOW_COUNT_OPTIONS[index].value);
        return;
      default:
        return;
    }

    e.preventDefault();
    optionRefs.current[newIndex]?.focus();
    onChange(WINDOW_COUNT_OPTIONS[newIndex].value);
  };

  return (
    <div className="space-y-2">
      <label id="window-count-label" className="text-sm font-semibold text-slate-900">
        How many windows?
      </label>
      <div
        role="radiogroup"
        aria-labelledby="window-count-label"
        className="grid grid-cols-2 gap-2 md:flex md:gap-2"
      >
        {WINDOW_COUNT_OPTIONS.map((opt, index) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              ref={(el) => { optionRefs.current[index] = el; }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors
                min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${isSelected
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-700 border-gray-300 hover:border-primary'
                }
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ExitIntentModal({
  sourceTool,
  hasConverted = false,
  onSuccess,
}: ExitIntentModalProps) {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<GauntletStep>('insider_price');
  const [hasDeclined, setHasDeclined] = useState<Record<GauntletStep, boolean>>({
    insider_price: false,
    storm_sentinel: false,
    kitchen_table: false,
  });
  const [hasSubmitted, setHasSubmitted] = useState<Record<GauntletStep, boolean>>({
    insider_price: false,
    storm_sentinel: false,
    kitchen_table: false,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // REFS (for deterministic lifecycle)
  // ─────────────────────────────────────────────────────────────────────────
  const sessionIdRef = useRef<string | null>(null);
  const prefillSnapshotRef = useRef<PrefillSnapshot | null>(null);
  const prevIsOpenRef = useRef<boolean>(false);
  const prevStepRef = useRef<GauntletStep | null>(null);
  const hasUserEditedRef = useRef<boolean>(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Trigger detection refs
  const pageLoadTime = useRef(Date.now());
  const maxScrollDepthRef = useRef(0);
  const lastScrollYRef = useRef(0);

  const storageKey = `${STORAGE_KEY_PREFIX}${sourceTool}`;

  // ─────────────────────────────────────────────────────────────────────────
  // HOOKS
  // ─────────────────────────────────────────────────────────────────────────
  const { sessionData, sessionId: persistentSessionId } = useSessionData();
  const { leadId: existingLeadId } = useLeadIdentity();

  // ─────────────────────────────────────────────────────────────────────────
  // PREFILL SNAPSHOT (captured once on open)
  // ─────────────────────────────────────────────────────────────────────────
  const captureSnapshot = useCallback(() => {
    prefillSnapshotRef.current = {
      name: sessionData.name || '',
      email: sessionData.email || '',
      phone: sessionData.phone || '',
    };
  }, [sessionData.name, sessionData.email, sessionData.phone]);

  // Determine if we have full identity (for step skip logic)
  const hasFullIdentity = useMemo(() => {
    const snap = prefillSnapshotRef.current;
    if (!snap) return false;
    return !!(snap.name && snap.email && snap.phone);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FORM CONFIGURATIONS
  // ─────────────────────────────────────────────────────────────────────────
  const step1Form = useFormValidation({
    initialValues: {
      name: prefillSnapshotRef.current?.name || '',
      email: prefillSnapshotRef.current?.email || '',
      phone: prefillSnapshotRef.current?.phone || '',
      windowCount: '',
    },
    schemas: {
      name: commonSchemas.name,
      email: commonSchemas.email,
      phone: commonSchemas.phone,
      windowCount: z.string().min(1, 'Please select window count'),
    },
    formatters: { phone: formatPhoneNumber },
  });

  const step2Form = useFormValidation({
    initialValues: {
      phone: prefillSnapshotRef.current?.phone || '',
    },
    schemas: {
      phone: commonSchemas.phone,
    },
    formatters: { phone: formatPhoneNumber },
  });

  const step3Form = useFormValidation({
    initialValues: {
      email: prefillSnapshotRef.current?.email || '',
    },
    schemas: {
      email: commonSchemas.email,
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // LEAD SUBMISSION HOOKS
  // ─────────────────────────────────────────────────────────────────────────
  const step1Submit = useLeadFormSubmit({
    sourceTool,
    formLocation: 'exit_gauntlet_insider',
    leadScore: 100,
    successTitle: 'Success!',
    successDescription: 'Your local pricing data is on the way.',
    aiContext: {
      offer_step: 1,
      source: 'exit_intent_modal',
    },
    onSuccess: () => {
      setHasSubmitted((prev) => ({ ...prev, insider_price: true }));
      try {
        trackEvent('lead_submitted', {
          step: 'insider_price',
          lead_score: 100,
          sessionId: sessionIdRef.current,
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
      handleCloseAfterSubmit();
    },
  });

  const step2Submit = useLeadFormSubmit({
    sourceTool,
    formLocation: 'exit_gauntlet_storm',
    leadScore: 60,
    successTitle: 'You\'re on the list!',
    successDescription: 'We\'ll text you when storms or deals hit.',
    aiContext: {
      offer_step: 2,
      source: 'exit_intent_modal',
    },
    onSuccess: () => {
      setHasSubmitted((prev) => ({ ...prev, storm_sentinel: true }));
      try {
        trackEvent('lead_submitted', {
          step: 'storm_sentinel',
          lead_score: 60,
          sessionId: sessionIdRef.current,
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
      handleCloseAfterSubmit();
    },
  });

  const step3Submit = useLeadFormSubmit({
    sourceTool,
    formLocation: 'exit_gauntlet_kitchen',
    leadScore: 30,
    successTitle: 'Check your inbox!',
    successDescription: 'Your cheat sheet is on the way.',
    aiContext: {
      offer_step: 3,
      source: 'exit_intent_modal',
    },
    onSuccess: () => {
      setHasSubmitted((prev) => ({ ...prev, kitchen_table: true }));
      try {
        trackEvent('lead_submitted', {
          step: 'kitchen_table',
          lead_score: 30,
          sessionId: sessionIdRef.current,
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
      handleCloseAfterSubmit();
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────
  const canShowModal = useCallback(() => {
    if (hasConverted) return false;
    if (typeof window === 'undefined') return false;

    const alreadyShown = sessionStorage.getItem(storageKey);
    if (alreadyShown) return false;

    const timeOnPage = Date.now() - pageLoadTime.current;
    if (timeOnPage < MIN_TIME_ON_PAGE) return false;

    if (maxScrollDepthRef.current < MIN_SCROLL_DEPTH) return false;

    return true;
  }, [hasConverted, storageKey]);

  const showModal = useCallback(() => {
    if (!canShowModal()) return;

    // Take prefill snapshot BEFORE opening
    captureSnapshot();

    // Determine starting step based on identity
    const fullIdentity = !!(
      prefillSnapshotRef.current?.name &&
      prefillSnapshotRef.current?.email &&
      prefillSnapshotRef.current?.phone
    );

    const startingStep: GauntletStep = fullIdentity ? 'storm_sentinel' : 'insider_price';

    // Initialize forms with snapshot values
    if (prefillSnapshotRef.current) {
      step1Form.setValues({
        name: prefillSnapshotRef.current.name,
        email: prefillSnapshotRef.current.email,
        phone: prefillSnapshotRef.current.phone,
        windowCount: '',
      });
      step2Form.setValues({
        phone: prefillSnapshotRef.current.phone,
      });
      step3Form.setValues({
        email: prefillSnapshotRef.current.email,
      });
    }

    setCurrentStep(startingStep);
    setIsOpen(true);
    sessionStorage.setItem(storageKey, 'true');
    hasUserEditedRef.current = false;

    // Skip analytics will be fired in the useEffect below
  }, [canShowModal, captureSnapshot, storageKey, step1Form, step2Form, step3Form]);

  // Track isOpen transitions for modal_opened event
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Transition false → true: modal just opened
      sessionIdRef.current = crypto.randomUUID();
      const externalId = existingLeadId || getLeadAnchor() || null;

      try {
        trackEvent('modal_opened', { sessionId: sessionIdRef.current });
        
        // Enriched dataLayer push for exit intent modal
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'exit_intent_modal_opened',
          event_id: generateEventId(),
          client_id: getOrCreateClientId(),
          session_id: getOrCreateSessionId(),
          external_id: externalId,
          source_tool: sourceTool,
          source_system: 'web',
          modal_name: 'exit_intent_gauntlet',
          starting_step: currentStep,
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }

      // If we skipped Step 1, fire step_skipped
      const fullIdentity = !!(
        prefillSnapshotRef.current?.name &&
        prefillSnapshotRef.current?.email &&
        prefillSnapshotRef.current?.phone
      );

      if (fullIdentity) {
        try {
          trackEvent('step_skipped', {
            step: 'insider_price',
            reason: 'identity_complete',
            sessionId: sessionIdRef.current,
          });
        } catch (e) {
          console.error('Analytics error:', e);
        }
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, sourceTool, currentStep, existingLeadId]);

  // Track step_viewed (once per step entry)
  useEffect(() => {
    if (isOpen && currentStep !== prevStepRef.current) {
      const externalId = existingLeadId || getLeadAnchor() || null;
      
      try {
        trackEvent('step_viewed', {
          step: currentStep,
          sessionId: sessionIdRef.current,
        });
        
        // Enriched dataLayer push for step views
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'exit_intent_step_viewed',
          event_id: generateEventId(),
          client_id: getOrCreateClientId(),
          session_id: getOrCreateSessionId(),
          external_id: externalId,
          source_tool: sourceTool,
          source_system: 'web',
          form_name: 'exit_intent_gauntlet',
          step_name: currentStep,
          step_index: STEP_CONFIG[currentStep].number,
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
      prevStepRef.current = currentStep;
    }
  }, [isOpen, currentStep, sourceTool, existingLeadId]);

  // Auto-focus first input on step change
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, currentStep]);

  // ─────────────────────────────────────────────────────────────────────────
  // SCROLL TRACKING (Trigger Detection) - Deferred & RAF-throttled for performance
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let rafId: number | null = null;
    let cleanup: (() => void) | null = null;
    
    // Defer scroll listener setup by 2 seconds to avoid blocking initial render
    const cancelIdle = scheduleWhenIdle(() => {
      const handleScroll = () => {
        // RAF-throttle to avoid excessive calculations
        if (rafId !== null) return;
        
        rafId = requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentScrollDepth = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;

          maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, currentScrollDepth);
          lastScrollYRef.current = window.scrollY;
          rafId = null;
        });
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      cleanup = () => window.removeEventListener('scroll', handleScroll);
    }, { minDelay: 2000 });

    return () => {
      cancelIdle();
      if (rafId !== null) cancelAnimationFrame(rafId);
      cleanup?.();
    };
  }, []);

  // Desktop: Mouse leave detection - deferred
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    
    const cancelIdle = scheduleWhenIdle(() => {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          showModal();
        }
      };

      document.addEventListener('mouseleave', handleMouseLeave);
      cleanup = () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, { minDelay: 2000 });

    return () => {
      cancelIdle();
      cleanup?.();
    };
  }, [showModal]);

  // Mobile: Scroll up detection - deferred
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    
    const cancelIdle = scheduleWhenIdle(() => {
      let lastY = lastScrollYRef.current;

      const handleScrollUp = () => {
        if (window.innerWidth > 768) return;
        if (maxScrollDepthRef.current < 0.5) return;

        const currentY = window.scrollY;
        if (currentY < lastY - 80) {
          showModal();
        }
        lastY = currentY;
      };

      window.addEventListener('scroll', handleScrollUp, { passive: true });
      cleanup = () => window.removeEventListener('scroll', handleScrollUp);
    }, { minDelay: 2000 });

    return () => {
      cancelIdle();
      cleanup?.();
    };
  }, [showModal]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose('escape');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleClose = useCallback((reason: 'user_closed' | 'backdrop' | 'escape') => {
    try {
      trackEvent('modal_closed', {
        reason,
        sessionId: sessionIdRef.current,
      });
    } catch (e) {
      console.error('Analytics error:', e);
    }

    sessionIdRef.current = null;
    prefillSnapshotRef.current = null;
    prevStepRef.current = null;
    setIsOpen(false);
  }, []);

  const handleCloseAfterSubmit = useCallback(() => {
    sessionIdRef.current = null;
    prefillSnapshotRef.current = null;
    prevStepRef.current = null;
    setIsOpen(false);
    onSuccess?.();
  }, [onSuccess]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose('backdrop');
    }
  };

  const handleDecline = useCallback(() => {
    try {
      trackEvent('offer_declined', {
        step: currentStep,
        sessionId: sessionIdRef.current,
      });
    } catch (e) {
      console.error('Analytics error:', e);
    }

    setHasDeclined((prev) => ({ ...prev, [currentStep]: true }));

    if (currentStep === 'insider_price') {
      setCurrentStep('storm_sentinel');
    } else if (currentStep === 'storm_sentinel') {
      setCurrentStep('kitchen_table');
    } else {
      handleClose('user_closed');
    }
  }, [currentStep, handleClose]);

  const handleBack = useCallback(() => {
    // Back does NOT clear declined/submitted flags
    if (currentStep === 'storm_sentinel') {
      setCurrentStep('insider_price');
    } else if (currentStep === 'kitchen_table') {
      setCurrentStep('storm_sentinel');
    }
  }, [currentStep]);

  // Form submissions
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step1Form.validateAll()) return;

    await step1Submit.submit({
      email: step1Form.values.email,
      name: step1Form.values.name,
      phone: step1Form.values.phone,
    });
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2Form.validateAll()) return;

    // Phone-only submission - use prefilled email if available
    const emailToUse = prefillSnapshotRef.current?.email || `storm-alert-${Date.now()}@placeholder.local`;

    await step2Submit.submit({
      email: emailToUse,
      phone: step2Form.values.phone,
      name: prefillSnapshotRef.current?.name || 'Storm Alert Subscriber',
    });
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step3Form.validateAll()) return;

    await step3Submit.submit({
      email: step3Form.values.email,
      name: prefillSnapshotRef.current?.name || 'Cheat Sheet Requester',
    });
  };

  // Track user edits
  const handleInputChange = (field: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      hasUserEditedRef.current = true;
      onChange(e);
    };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const stepNumber = STEP_CONFIG[currentStep].number;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gauntlet-title"
    >
      <div
        className={`
          relative w-full max-w-md bg-white dark:bg-white rounded-xl border-t-4 border-primary shadow-2xl
          animate-in fade-in slide-in-from-right-4 duration-300
          max-h-[90vh] overflow-y-auto
          ${currentStep === 'insider_price' ? 'p-6 sm:p-8' : ''}
          ${currentStep === 'storm_sentinel' ? 'p-5 sm:p-7' : ''}
          ${currentStep === 'kitchen_table' ? 'p-4 sm:p-6' : ''}
        `}
      >
      {/* FormSurfaceProvider wraps all form content for trust styling */}
      <FormSurfaceProvider surface="trust">
        {/* Close button */}
        <button
          onClick={() => handleClose('user_closed')}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          {currentStep !== 'insider_price' && (
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-muted-foreground hover:underline underline-offset-4 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
          )}
          <span
            className="text-xs text-slate-500 ml-auto"
            aria-live="polite"
          >
            Step {stepNumber} of 3
          </span>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: INSIDER PRICE (Lead Score: 100) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {currentStep === 'insider_price' && (
          <div className="space-y-5">
            <div className="text-center">
              {/* Best Value Badge */}
              <Badge variant="secondary" className="mb-3 text-xs">
                BEST VALUE
              </Badge>

              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>

              <h2 id="gauntlet-title" className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Wait! See What Your Neighbors Paid.
              </h2>
              <p className="text-sm text-slate-600">
                Unlock our database of recent window project costs in your area. Stop guessing.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Name</label>
                <Input
                  ref={firstInputRef}
                  type="text"
                  {...step1Form.getFieldProps('name')}
                  onChange={handleInputChange('name', step1Form.getFieldProps('name').onChange)}
                  placeholder="Your name"
                  className={step1Form.hasError('name') ? 'border-destructive' : ''}
                  disabled={step1Submit.isSubmitting}
                />
                {step1Form.hasError('name') && (
                  <p className="text-xs text-destructive">{step1Form.getError('name')}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Email</label>
                <Input
                  type="email"
                  {...step1Form.getFieldProps('email')}
                  onChange={handleInputChange('email', step1Form.getFieldProps('email').onChange)}
                  placeholder="your@email.com"
                  className={step1Form.hasError('email') ? 'border-destructive' : ''}
                  disabled={step1Submit.isSubmitting}
                />
                {step1Form.hasError('email') && (
                  <p className="text-xs text-destructive">{step1Form.getError('email')}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Phone</label>
                <Input
                  type="tel"
                  {...step1Form.getFieldProps('phone')}
                  onChange={handleInputChange('phone', step1Form.getFieldProps('phone').onChange)}
                  placeholder="(555) 555-5555"
                  className={step1Form.hasError('phone') ? 'border-destructive' : ''}
                  disabled={step1Submit.isSubmitting}
                />
                {step1Form.hasError('phone') && (
                  <p className="text-xs text-destructive">{step1Form.getError('phone')}</p>
                )}
              </div>

              <WindowCountSelector
                value={step1Form.values.windowCount}
                onChange={(val) => step1Form.setValue('windowCount', val)}
                error={step1Form.getError('windowCount')}
              />

              {/* CTA Button */}
              <Button
                type="submit"
                variant="cta"
                className="w-full min-h-[48px]"
                disabled={step1Submit.isSubmitting}
              >
                {step1Submit.isSubmitting ? 'Processing...' : 'Show Me Local Prices'}
              </Button>

              {/* Decline - separated for fat-finger safety */}
              <div className="mt-6 border-t border-gray-200 pt-4 text-center">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="text-sm text-muted-foreground hover:underline underline-offset-4"
                >
                  I don't care about pricing
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: STORM SENTINEL (Lead Score: 60) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {currentStep === 'storm_sentinel' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-11 h-11 bg-amber-500/10 rounded-full mb-3">
                <Bell className="w-7 h-7 text-amber-500" />
              </div>

              <h2 id="gauntlet-title" className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                Don't Get Stuck in a Backorder.
              </h2>
              <p className="text-sm text-slate-600">
                When storms hit, lead times triple. Get instant text alerts for manufacturing delays and flash price drops.
              </p>
            </div>

            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Phone Number</label>
                <Input
                  ref={firstInputRef}
                  type="tel"
                  {...step2Form.getFieldProps('phone')}
                  onChange={handleInputChange('phone', step2Form.getFieldProps('phone').onChange)}
                  placeholder="(555) 555-5555"
                  className={step2Form.hasError('phone') ? 'border-destructive' : ''}
                  disabled={step2Submit.isSubmitting}
                />
                {step2Form.hasError('phone') && (
                  <p className="text-xs text-destructive">{step2Form.getError('phone')}</p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                type="submit"
                variant="cta"
                className="w-full min-h-[48px]"
                disabled={step2Submit.isSubmitting}
              >
                {step2Submit.isSubmitting ? 'Signing up...' : 'Alert Me Instantly'}
              </Button>

              {/* Decline - separated for fat-finger safety */}
              <div className="mt-6 border-t border-gray-200 pt-4 text-center">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="text-sm text-muted-foreground hover:underline underline-offset-4"
                >
                  I'll take my chances
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: KITCHEN TABLE DEFENSE (Lead Score: 30) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {currentStep === 'kitchen_table' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 rounded-full mb-3">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>

              <h2 id="gauntlet-title" className="text-lg font-bold text-slate-900 mb-2">
                At Least Take This With You.
              </h2>
              <p className="text-sm text-slate-600">
                Going to get quotes? Download our '3-Question Cheat Sheet' to stop high-pressure salesmen in their tracks.
              </p>
            </div>

            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Email</label>
                <Input
                  ref={firstInputRef}
                  type="email"
                  {...step3Form.getFieldProps('email')}
                  onChange={handleInputChange('email', step3Form.getFieldProps('email').onChange)}
                  placeholder="your@email.com"
                  className={step3Form.hasError('email') ? 'border-destructive' : ''}
                  disabled={step3Submit.isSubmitting}
                />
                {step3Form.hasError('email') && (
                  <p className="text-xs text-destructive">{step3Form.getError('email')}</p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                type="submit"
                variant="cta"
                className="w-full min-h-[48px]"
                disabled={step3Submit.isSubmitting}
              >
                {step3Submit.isSubmitting ? 'Sending...' : 'Send My Cheat Sheet'}
              </Button>

              {/* Decline - separated for fat-finger safety */}
              <div className="mt-6 border-t border-gray-200 pt-4 text-center">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="text-sm text-muted-foreground hover:underline underline-offset-4"
                >
                  No thanks, I like sales pitches
                </button>
              </div>
            </form>
          </div>
        )}
        </FormSurfaceProvider>
      </div>
    </div>
  );
}

export default ExitIntentModal;
