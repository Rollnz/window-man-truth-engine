// ============================================
// SilentAllyInterceptor — Scroll-Proximity Exit Intent Bar
// ============================================
// Fires when a user scrolls back UP toward the navbar (within ~200px of top)
// after meeting eligibility criteria (time on page, scroll depth, session guards).
// Shows a slim "Silent Ally" bar — NOT a full-screen modal.
//
// GUARDS:
// - Only once per session (sessionStorage: 'silent_ally_shown')
// - Min 15 seconds on page
// - Min 30% scroll depth reached
// - Skip if ExitIntentModal gauntlet already shown
// - Skip if user has already converted

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackEvent, generateEventId } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { scheduleWhenIdle } from '@/lib/deferredInit';
import { calculateInsuranceSavings } from '@/lib/riskCalculations';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';

// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────

const STORAGE_KEY = 'silent_ally_shown';
const MIN_TIME_ON_PAGE_MS = 15_000;
const MIN_SCROLL_DEPTH = 0.3; // 30%
const SCROLL_PROXIMITY_PX = 200; // fire when within 200px of top
const GAUNTLET_KEY_PREFIX = 'gauntlet_exit_intent_';

/** Default introductory message injected into the AI chat for Forensic Ally mode. */
export const FORENSIC_ALLY_INITIAL_MESSAGE =
  "🛡️ Glad you stopped — I'm your Forensic Ally. I work for you, not the contractor.\n\nHere's a freebie: tell me ONE thing about your window project and I'll give you an honest take. Or just ask me anything — I'm not here to sell you.";

type InterceptorStep = 'primary' | 'downsell_1' | 'downsell_2' | 'dismissed';

// ──────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────

function hasGauntletShown(): boolean {
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(GAUNTLET_KEY_PREFIX)) return true;
  }
  return false;
}

function pushDataLayer(obj: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(obj);
}

// ──────────────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────────────

export function SilentAllyInterceptor() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<InterceptorStep>('primary');
  const [quoteLineText, setQuoteLineText] = useState('');
  const [homeSize, setHomeSize] = useState('');
  const [savingsResult, setSavingsResult] = useState<{ annual: number; tenYear: number } | null>(null);

  const { hasIdentity } = useLeadIdentity();
  const pageLoadTimeRef = useRef(Date.now());
  const maxScrollDepthRef = useRef(0);
  const lastScrollYRef = useRef(window.scrollY);
  const hasShownRef = useRef(false);

  // ── Analytics helpers ──────────────────────────

  const fireEvent = useCallback((eventName: string, extra: Record<string, unknown> = {}) => {
    try {
      trackEvent(eventName, {
        source_tool: window.location.pathname,
        ...extra,
      });
      pushDataLayer({
        event: eventName,
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        source_tool: window.location.pathname,
        ...extra,
      });
    } catch {
      // Non-blocking
    }
  }, []);

  // ── Trigger logic ──────────────────────────────

  const showInterceptor = useCallback(() => {
    if (hasShownRef.current) return;
    hasShownRef.current = true;
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(true);
    fireEvent('silent_ally_shown', { trigger_type: 'scroll_proximity' });
  }, [fireEvent]);

  const checkEligibility = useCallback(() => {
    // Already shown this session
    if (sessionStorage.getItem(STORAGE_KEY)) return false;
    // Already converted
    if (hasIdentity) return false;
    // Gauntlet modal already triggered
    if (hasGauntletShown()) return false;
    // Minimum time on page
    if (Date.now() - pageLoadTimeRef.current < MIN_TIME_ON_PAGE_MS) return false;
    // Minimum scroll depth
    if (maxScrollDepthRef.current < MIN_SCROLL_DEPTH) return false;
    return true;
  }, [hasIdentity]);

  // ── Set up scroll listeners ────────────────────

  useEffect(() => {
    let rafId: number | null = null;
    let cleanup: (() => void) | null = null;

    const cancelIdle = scheduleWhenIdle(() => {
      const handleScroll = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentDepth = scrollHeight > 0 ? currentScrollY / scrollHeight : 0;

          // Track max depth
          maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, currentDepth);

          // Detect scroll UP toward the top (within proximity threshold)
          const isScrollingUp = currentScrollY < lastScrollYRef.current;
          const isNearTop = currentScrollY <= SCROLL_PROXIMITY_PX;

          if (isScrollingUp && isNearTop && checkEligibility()) {
            showInterceptor();
          }

          lastScrollYRef.current = currentScrollY;
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
  }, [checkEligibility, showInterceptor]);

  // ── Listen for external open event (for testing/debugging) ──
  useEffect(() => {
    const handleOpen = () => showInterceptor();
    window.addEventListener('open-silent-ally', handleOpen);
    return () => window.removeEventListener('open-silent-ally', handleOpen);
  }, [showInterceptor]);

  // ── Handlers ────────────────────────────────────

  const handlePrimaryCtaClick = useCallback(() => {
    fireEvent('silent_ally_cta_clicked', {
      cta_text: 'Get My Free Forensic Report',
      step: 'primary',
    });
    setIsVisible(false);
    // Open the sidebar with Forensic Ally context
    window.dispatchEvent(
      new CustomEvent('open-estimate-panel', {
        detail: { source: 'exit_intent_ally', mode: 'forensic_ally' },
      })
    );
    fireEvent('silent_ally_sidebar_opened', { source: 'exit_intent_ally' });
  }, [fireEvent]);

  const handleClose = useCallback(() => {
    if (step === 'primary') {
      fireEvent('silent_ally_declined', { step: 'primary' });
      setStep('downsell_1');
    } else if (step === 'downsell_1') {
      fireEvent('silent_ally_declined', { step: 'downsell_1' });
      setStep('downsell_2');
    } else {
      fireEvent('silent_ally_declined', { step: 'downsell_2' });
      setStep('dismissed');
      setIsVisible(false);
    }
  }, [step, fireEvent]);

  const handleQuoteCheck = useCallback(() => {
    if (!quoteLineText.trim()) return;
    fireEvent('silent_ally_downsell_engaged', { downsell_type: 'quote_line_check' });
    setIsVisible(false);
    window.dispatchEvent(
      new CustomEvent('open-estimate-panel', {
        detail: {
          source: 'exit_intent_ally',
          mode: 'savings',
          initialMessage: quoteLineText.trim(),
        },
      })
    );
    fireEvent('silent_ally_sidebar_opened', { source: 'exit_intent_ally' });
  }, [quoteLineText, fireEvent]);

  const handleInsuranceCalc = useCallback(() => {
    const sqft = parseInt(homeSize, 10);
    if (!sqft || sqft <= 0) return;
    fireEvent('silent_ally_downsell_engaged', { downsell_type: 'insurance_calculator' });
    const result = calculateInsuranceSavings(sqft, false);
    setSavingsResult({
      annual: result.potentialAnnualSavings,
      tenYear: result.savingsOver10Years,
    });
  }, [homeSize, fireEvent]);

  const handleSavingsCta = useCallback(() => {
    setIsVisible(false);
    window.dispatchEvent(
      new CustomEvent('open-estimate-panel', {
        detail: { source: 'exit_intent_ally', mode: 'forensic_ally' },
      })
    );
    fireEvent('silent_ally_sidebar_opened', { source: 'exit_intent_ally' });
  }, [fireEvent]);

  // ── Render ──────────────────────────────────────

  if (!isVisible || step === 'dismissed') return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Silent Ally — Independent window buying advice"
      className={[
        'fixed left-1/2 -translate-x-1/2 z-[60]',
        'w-[calc(100%-2rem)] max-w-2xl',
        'rounded-2xl border border-[hsl(200,60%,25%,0.3)]',
        'bg-[hsl(220,25%,7%)]',
        'shadow-[0_20px_60px_rgba(0,0,0,0.4)]',
        'animate-in slide-in-from-top duration-300',
        'px-4 py-4 md:px-6',
      ].join(' ')}
      style={{ top: '68px' }}
    >
      {step === 'primary' && <PrimaryStep onCta={handlePrimaryCtaClick} onClose={handleClose} />}
      {step === 'downsell_1' && (
        <Downsell1Step
          value={quoteLineText}
          onChange={setQuoteLineText}
          onSubmit={handleQuoteCheck}
          onClose={handleClose}
        />
      )}
      {step === 'downsell_2' && (
        <Downsell2Step
          homeSize={homeSize}
          onHomeSizeChange={setHomeSize}
          onCalculate={handleInsuranceCalc}
          savingsResult={savingsResult}
          onSidebarCta={handleSavingsCta}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────
// SUB-COMPONENTS
// ──────────────────────────────────────────────────

interface PrimaryStepProps {
  onCta: () => void;
  onClose: () => void;
}

function PrimaryStep({ onCta, onClose }: PrimaryStepProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      {/* Icon */}
      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20">
        <Shield className="w-5 h-5 text-cyan-400" aria-hidden="true" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span
          role="status"
          aria-label="Intelligence Alert: independent window buying advice"
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold uppercase tracking-wider mb-2"
        >
          Intelligence Alert
        </span>
        <p className="text-white font-bold text-base leading-snug">
          You're About to Make a $15,000 Decision. We're the Only Ones on Your Side.
        </p>
        <p className="text-slate-400 text-sm mt-1 leading-snug">
          Your contractor profits from the sale. Your insurance company profits from denial. We profit from nothing.
        </p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button
          onClick={onCta}
          className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] whitespace-nowrap"
        >
          Get My Free Forensic Report
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Dismiss alert"
        className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors p-1 rounded"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

interface Downsell1StepProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function Downsell1Step({ value, onChange, onSubmit, onClose }: Downsell1StepProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSubmit();
  };

  return (
    <div className="relative pr-8">
      <p className="text-white text-sm font-semibold mb-1">
        No worries. But before you go — paste any single line from your quote below and I'll tell you if it's fair.
      </p>
      <p className="text-slate-400 text-xs mb-3">No signup. No email. Just paste and ask.</p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a line from your quote…"
          className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm flex-1"
          aria-label="Paste a line from your quote"
        />
        <Button
          onClick={onSubmit}
          disabled={!value.trim()}
          className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold text-sm whitespace-nowrap"
        >
          Check It
        </Button>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-0 right-0 text-slate-500 hover:text-white transition-colors p-1 rounded"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

interface Downsell2StepProps {
  homeSize: string;
  onHomeSizeChange: (v: string) => void;
  onCalculate: () => void;
  savingsResult: { annual: number; tenYear: number } | null;
  onSidebarCta: () => void;
  onClose: () => void;
}

function Downsell2Step({
  homeSize,
  onHomeSizeChange,
  onCalculate,
  savingsResult,
  onSidebarCta,
  onClose,
}: Downsell2StepProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onCalculate();
  };

  return (
    <div className="relative pr-8">
      <p className="text-white text-sm font-semibold mb-1">
        Last thing — did you know the right windows can cut your insurance premium by 18–20% every year?
      </p>

      {!savingsResult ? (
        <div className="flex gap-2 mt-3">
          <Input
            type="number"
            value={homeSize}
            onChange={(e) => onHomeSizeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Home size (sq ft)"
            min="100"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm flex-1"
            aria-label="Enter your home size in square feet"
          />
          <Button
            onClick={onCalculate}
            disabled={!homeSize || parseInt(homeSize, 10) <= 0}
            className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold text-sm whitespace-nowrap"
          >
            Show My Savings
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-cyan-400 text-sm font-semibold">
            You could save ~${savingsResult.annual.toLocaleString()}/year — that's ${savingsResult.tenYear.toLocaleString()} over 10 years.
          </p>
          <Button
            onClick={onSidebarCta}
            className="mt-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold text-sm"
          >
            See Which Windows Qualify
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-0 right-0 text-slate-500 hover:text-white transition-colors p-1 rounded"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
