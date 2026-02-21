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

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ArrowLeft, ShieldCheck, AlertTriangle, FileText } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useFormValidation, commonSchemas, formatPhoneNumber } from "@/hooks/useFormValidation";
import { useLeadFormSubmit } from "@/hooks/useLeadFormSubmit";
import { useSessionData } from "@/hooks/useSessionData";
import { useLeadIdentity } from "@/hooks/useLeadIdentity";
import { trackEvent, generateEventId } from "@/lib/gtm";
import { getOrCreateClientId, getOrCreateSessionId } from "@/lib/tracking";
import { getLeadAnchor } from "@/lib/leadAnchor";
import type { SourceTool } from "@/types/sourceTool";
import { scheduleWhenIdle } from "@/lib/deferredInit";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

type GauntletStep = "insider_price" | "storm_sentinel" | "kitchen_table";

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

const STORAGE_KEY_PREFIX = "gauntlet_exit_intent_";
const MIN_TIME_ON_PAGE = 10000; // 10 seconds
const MIN_SCROLL_DEPTH = 0.3; // 30%

const WINDOW_COUNT_OPTIONS = [
  { label: "1–5", value: "1-5" },
  { label: "6–10", value: "6-10" },
  { label: "11–20", value: "11-20" },
  { label: "20+", value: "20+" },
];

const STEP_CONFIG = {
  insider_price: { number: 1, leadScore: 100 },
  storm_sentinel: { number: 2, leadScore: 60 },
  kitchen_table: { number: 3, leadScore: 30 },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SOURCETOOL-AWARE COPY — Context-Aware Conversion Copy
// ═══════════════════════════════════════════════════════════════════════════

interface StepCopyConfig {
  badge?: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaLoading: string;
  declineText: string;
}

interface SourceToolCopyConfig {
  step1: StepCopyConfig;
  step2: StepCopyConfig;
  step3: StepCopyConfig;
}

// Category-based Step 2 & 3 presets to avoid repetition
const STEP2_COST: StepCopyConfig = {
  headline: "Price Drops Happen Fast.\nDon't Miss the Window.",
  subheadline: "Get instant SMS alerts when local suppliers cut prices or offer flash promotions — before your neighbors find out.",
  ctaLabel: "Activate Price Drop Alerts",
  ctaLoading: "Activating Alerts...",
  declineText: "Skip — I'll pay full price",
};

const STEP2_RISK: StepCopyConfig = {
  headline: "Storm Alerts Have Saved\nHomeowners Thousands.",
  subheadline: "When a named storm enters the cone, lead times triple overnight. Get early-warning SMS so you act before the rush.",
  ctaLabel: "Activate Storm Alerts",
  ctaLoading: "Activating Sentinel...",
  declineText: "Skip — I'll take my chances",
};

const STEP2_SALES: StepCopyConfig = {
  headline: "Flash Deals Expose\nthe Real Markup.",
  subheadline: "Contractors run limited promos that reveal true margins. We'll text you the second one drops in your area.",
  ctaLabel: "Activate Deal Alerts",
  ctaLoading: "Activating Alerts...",
  declineText: "Skip — I trust the sticker price",
};

const STEP2_DEFAULT: StepCopyConfig = {
  headline: "Don't Get Caught in\nSupply Chain Gridlock.",
  subheadline: "When named storms approach, lead times triple overnight. Activate our early-warning SMS system for immediate alerts.",
  ctaLabel: "Activate Instant SMS Alerts",
  ctaLoading: "Activating Sentinel...",
  declineText: "Skip — I'll risk the backorder",
};

const STEP3_COST: StepCopyConfig = {
  headline: "Take the Price\nVerification Checklist.",
  subheadline: "The exact line items to compare across quotes — so you never overpay for materials, labor, or permits.",
  ctaLabel: "Send My Checklist",
  ctaLoading: "Transmitting...",
  declineText: "Skip — I'll wing the negotiation",
};

const STEP3_RISK: StepCopyConfig = {
  headline: "Download the Hurricane\nPrep Blueprint.",
  subheadline: "The step-by-step protocol to protect your home and insurance claim before the next storm season.",
  ctaLabel: "Send My Blueprint",
  ctaLoading: "Transmitting...",
  declineText: "Skip — I'll figure it out later",
};

const STEP3_SALES: StepCopyConfig = {
  headline: "Arm Yourself With\nthe Anti-Sales Playbook.",
  subheadline: "3 questions that instantly disarm high-pressure tactics. Used by homeowners who refuse to be outsold.",
  ctaLabel: "Send The Playbook",
  ctaLoading: "Transmitting...",
  declineText: "Skip — I enjoy sales pitches",
};

const STEP3_DEFAULT: StepCopyConfig = {
  headline: "Arm Yourself With\nThe Defense Protocol.",
  subheadline: "Download the '3-Question Blueprint' engineered to instantly disarm high-pressure sales tactics.",
  ctaLabel: "Send The Blueprint Securely",
  ctaLoading: "Transmitting...",
  declineText: "Skip — I enjoy sales pitches",
};

const SOURCE_TOOL_COPY: Record<string, SourceToolCopyConfig> = {
  // ── High-Intent Tool Pages ──────────────────────────────────────────────
  "quote-scanner": {
    step1: {
      badge: "QUOTE ANALYSIS",
      headline: "Don't Sign That Quote Blind.",
      subheadline: "Our AI flagged potential issues in quotes like yours. Get a full forensic breakdown with verified local pricing before you commit.",
      ctaLabel: "Unlock My Quote Report",
      ctaLoading: "Analyzing Quote Data...",
      declineText: "Skip — I trust the contractor",
    },
    step2: STEP2_COST,
    step3: STEP3_COST,
  },
  "beat-your-quote": {
    step1: {
      badge: "NEGOTIATION INTEL",
      headline: "Leave Now and You Leave Money on the Table.",
      subheadline: "We've identified leverage points in your quote. Get a personalized counter-offer strategy with real local comps.",
      ctaLabel: "Get My Counter-Offer Ammo",
      ctaLoading: "Building Your Strategy...",
      declineText: "Skip — I'll pay what they asked",
    },
    step2: STEP2_COST,
    step3: STEP3_SALES,
  },
  "vulnerability-test": {
    step1: {
      badge: "RISK ASSESSMENT",
      headline: "Storm Season Won't Wait for You to Come Back.",
      subheadline: "Your home's vulnerability profile is partially mapped. Complete your risk score and get a prioritized action plan.",
      ctaLabel: "Complete My Risk Report",
      ctaLoading: "Calculating Risk Score...",
      declineText: "Skip — my windows are fine",
    },
    step2: STEP2_RISK,
    step3: STEP3_RISK,
  },
  "comparison-tool": {
    step1: {
      badge: "COMPARISON DATA",
      headline: "Budget vs. Premium: The 10-Year Truth.",
      subheadline: "See the real cost-per-year breakdown that contractors never show you. The cheapest option rarely wins over a decade.",
      ctaLabel: "Reveal the 10-Year Math",
      ctaLoading: "Crunching Numbers...",
      declineText: "Skip — I'll guess which is better",
    },
    step2: STEP2_COST,
    step3: STEP3_COST,
  },

  // ── Pillar Pages ────────────────────────────────────────────────────────
  "window-cost-truth": {
    step1: {
      badge: "LOCAL PRICING DATA",
      headline: "Stop Guessing. Get Your Exact Local Price.",
      subheadline: "Our database has verified installation costs from your zip code. See what homeowners actually paid — not what salespeople quote.",
      ctaLabel: "Reveal My Local Pricing",
      ctaLoading: "Pulling Local Data...",
      declineText: "Skip — I'll trust the first quote",
    },
    step2: STEP2_COST,
    step3: STEP3_COST,
  },
  "window-sales-truth": {
    step1: {
      badge: "SALES DEFENSE",
      headline: "Every Salesperson Hopes You Don't Know This.",
      subheadline: "The tactics they'll use at your kitchen table are predictable. Get the playbook that levels the field before they arrive.",
      ctaLabel: "Get the Insider Playbook",
      ctaLoading: "Preparing Your Defense...",
      declineText: "Skip — I can handle the pitch",
    },
    step2: STEP2_SALES,
    step3: STEP3_SALES,
  },
  "window-risk-and-code": {
    step1: {
      badge: "CODE COMPLIANCE",
      headline: "One Code Violation Could Void Your Insurance.",
      subheadline: "Florida building codes changed in 2024. Verify your installation meets current HVHZ requirements before a storm tests it.",
      ctaLabel: "Check My Compliance Status",
      ctaLoading: "Scanning Code Database...",
      declineText: "Skip — I'm sure it's up to code",
    },
    step2: STEP2_RISK,
    step3: STEP3_RISK,
  },
  "window-verification-system": {
    step1: {
      badge: "VERIFICATION CHECK",
      headline: "3 Out of 5 Quotes Fail Our Verification Check.",
      subheadline: "NOA numbers, installation specs, permit requirements — our system catches what homeowners miss. Verify before you sign.",
      ctaLabel: "Run My Verification Check",
      ctaLoading: "Running Verification...",
      declineText: "Skip — I trust the paperwork",
    },
    step2: STEP2_SALES,
    step3: STEP3_COST,
  },

  // ── Tier-2 Educational Pages ────────────────────────────────────────────
  "risk-diagnostic": {
    step1: {
      badge: "RISK PROFILE",
      headline: "Your Home's Risk Profile Is Almost Ready.",
      subheadline: "We've started mapping your vulnerabilities. Complete your assessment to get a prioritized protection plan.",
      ctaLabel: "Complete My Risk Profile",
      ctaLoading: "Finalizing Profile...",
      declineText: "Skip — I'll assess it myself",
    },
    step2: STEP2_RISK,
    step3: STEP3_RISK,
  },
  "cost-calculator": {
    step1: {
      badge: "SAVINGS ESTIMATE",
      headline: "Your Custom Savings Estimate Is Waiting.",
      subheadline: "Based on your inputs, we can show you exactly where the savings are hiding. Don't leave without your personalized numbers.",
      ctaLabel: "Unlock My Savings Estimate",
      ctaLoading: "Calculating Savings...",
      declineText: "Skip — I'll do the math myself",
    },
    step2: STEP2_COST,
    step3: STEP3_COST,
  },
  "true-cost-calculator": {
    step1: {
      badge: "TRUE COST ANALYSIS",
      headline: "Your Custom Savings Estimate Is Waiting.",
      subheadline: "The true cost includes what contractors leave out: permits, disposal, trim, and callbacks. See the real number.",
      ctaLabel: "Reveal the True Cost",
      ctaLoading: "Calculating True Cost...",
      declineText: "Skip — I'll trust the estimate",
    },
    step2: STEP2_COST,
    step3: STEP3_COST,
  },
  "fair-price-quiz": {
    step1: {
      badge: "PRICE RANGE",
      headline: "Your Fair Price Range Is Ready — Don't Lose It.",
      subheadline: "We've calibrated a fair market range for your project. Leave now and you'll have to start over.",
      ctaLabel: "Lock In My Price Range",
      ctaLoading: "Saving Your Range...",
      declineText: "Skip — I'll start over later",
    },
    step2: STEP2_COST,
    step3: STEP3_COST,
  },
  "claim-survival-kit": {
    step1: {
      badge: "CLAIM TOOLKIT",
      headline: "Your Insurance Claim Checklist Is Ready to Download.",
      subheadline: "Missing one document can delay your claim by weeks. Get the complete checklist adjusters use internally.",
      ctaLabel: "Download My Claim Kit",
      ctaLoading: "Preparing Kit...",
      declineText: "Skip — I'll figure out the claim",
    },
    step2: STEP2_RISK,
    step3: STEP3_RISK,
  },
  "evidence-locker": {
    step1: {
      badge: "EVIDENCE FILE",
      headline: "The Evidence File Is Compiled. Take It With You.",
      subheadline: "Real case studies, exposed markups, and verified data points — everything you need to negotiate from a position of strength.",
      ctaLabel: "Access the Evidence File",
      ctaLoading: "Compiling Evidence...",
      declineText: "Skip — I don't need proof",
    },
    step2: STEP2_SALES,
    step3: STEP3_SALES,
  },
  "intel-library": {
    step1: {
      badge: "INTELLIGENCE BRIEF",
      headline: "Your Intelligence Briefing Is Standing By.",
      subheadline: "Curated guides, price data, and industry intel — organized for homeowners who do their homework before signing.",
      ctaLabel: "Access My Intel Briefing",
      ctaLoading: "Loading Intel...",
      declineText: "Skip — I'll go in blind",
    },
    step2: STEP2_SALES,
    step3: STEP3_COST,
  },
  "roleplay": {
    step1: {
      badge: "SALES TRAINING",
      headline: "Prepare for the Sales Pitch. Practice Makes Perfect.",
      subheadline: "Salespeople rehearse their pitch hundreds of times. Shouldn't you practice saying no at least once?",
      ctaLabel: "Start My Practice Session",
      ctaLoading: "Loading Simulation...",
      declineText: "Skip — I'll improvise",
    },
    step2: STEP2_SALES,
    step3: STEP3_SALES,
  },
  "fast-win": {
    step1: {
      badge: "QUICK SAVINGS",
      headline: "Your Fastest Path to Savings Is One Click Away.",
      subheadline: "We identified the single highest-impact action you can take today. It takes 5 minutes and could save thousands.",
      ctaLabel: "Show Me My Fast Win",
      ctaLoading: "Finding Your Win...",
      declineText: "Skip — I have plenty of time",
    },
    step2: STEP2_COST,
    step3: STEP3_COST,
  },
  "expert-system": {
    step1: {
      badge: "EXPERT ANALYSIS",
      headline: "Your Expert Analysis Is Almost Complete.",
      subheadline: "Our AI expert has been building your personalized recommendation. Leave now and you'll lose the context.",
      ctaLabel: "Complete My Analysis",
      ctaLoading: "Finalizing Analysis...",
      declineText: "Skip — I know what I need",
    },
    step2: STEP2_COST,
    step3: STEP3_SALES,
  },
  "reality-check": {
    step1: {
      badge: "REALITY CHECK",
      headline: "The Reality Check Results Are In.",
      subheadline: "We've stress-tested your assumptions against real market data. The truth might surprise you — in a good way.",
      ctaLabel: "See My Reality Check",
      ctaLoading: "Loading Results...",
      declineText: "Skip — I trust my gut",
    },
    step2: STEP2_COST,
    step3: STEP3_COST,
  },
  "kitchen-table-guide": {
    step1: {
      badge: "NEGOTIATION GUIDE",
      headline: "The Kitchen Table Playbook — Free Before You Leave.",
      subheadline: "What to say, what to ask, and what to never agree to when the salesperson sits at your table.",
      ctaLabel: "Get My Playbook",
      ctaLoading: "Preparing Playbook...",
      declineText: "Skip — I'll wing it",
    },
    step2: STEP2_SALES,
    step3: STEP3_SALES,
  },
  "sales-tactics-guide": {
    step1: {
      badge: "TACTICS DECODER",
      headline: "The Tactics Decoder Cheat Sheet — Yours Free.",
      subheadline: "Every pressure tactic has a counter-move. Learn the exact responses that stop manipulative closing techniques cold.",
      ctaLabel: "Decode the Tactics",
      ctaLoading: "Preparing Decoder...",
      declineText: "Skip — I can spot a trick",
    },
    step2: STEP2_SALES,
    step3: STEP3_SALES,
  },
  "spec-checklist-guide": {
    step1: {
      badge: "SPEC CHECKLIST",
      headline: "Your Spec Verification Checklist Is Ready.",
      subheadline: "The 17-point inspection that separates a legitimate quote from a bait-and-switch. Don't sign without checking.",
      ctaLabel: "Get My Spec Checklist",
      ctaLoading: "Loading Checklist...",
      declineText: "Skip — I trust the specs",
    },
    step2: STEP2_SALES,
    step3: STEP3_COST,
  },
  "insurance-savings-guide": {
    step1: {
      badge: "INSURANCE SAVINGS",
      headline: "Your Insurance Discount Roadmap — Take It.",
      subheadline: "Impact windows can slash your premiums by up to 45%. This guide shows exactly which upgrades qualify and how to file.",
      ctaLabel: "Get My Savings Roadmap",
      ctaLoading: "Building Roadmap...",
      declineText: "Skip — I'll call my agent",
    },
    step2: STEP2_RISK,
    step3: STEP3_RISK,
  },
  "floating-estimate-form": {
    step1: {
      badge: "ESTIMATE PENDING",
      headline: "Your Personalized Estimate Is Almost Ready.",
      subheadline: "We've started building your custom estimate. Complete it now to lock in today's pricing data.",
      ctaLabel: "Complete My Estimate",
      ctaLoading: "Finalizing Estimate...",
      declineText: "Skip — I'll get quotes the hard way",
    },
    step2: STEP2_COST,
    step3: STEP3_COST,
  },
  "slide-over-ai-qa": {
    step1: {
      badge: "EXPERT ANSWERS",
      headline: "Your Expert Answered — Don't Lose the Thread.",
      subheadline: "The Q&A session has valuable context. Get a summary of the key insights emailed to you before you leave.",
      ctaLabel: "Email My Q&A Summary",
      ctaLoading: "Packaging Summary...",
      declineText: "Skip — I'll remember it",
    },
    step2: STEP2_SALES,
    step3: STEP3_DEFAULT,
  },

  // ── Default Fallback ────────────────────────────────────────────────────
  DEFAULT: {
    step1: {
      badge: "INTELLIGENCE DATABASE",
      headline: "Wait — Your Custom Report Is Almost Ready.",
      subheadline: "Get verified local pricing data and insider analysis before you go. No spam, no obligation — just the truth.",
      ctaLabel: "Unlock My Free Report",
      ctaLoading: "Accessing Secure Database...",
      declineText: "Skip — I don't care about pricing",
    },
    step2: STEP2_DEFAULT,
    step3: STEP3_DEFAULT,
  },
};

/**
 * Resolves the correct copy for a given sourceTool and step.
 * Falls back to DEFAULT if the sourceTool is not mapped.
 */
function getStepCopy(sourceTool: string, step: "step1" | "step2" | "step3"): StepCopyConfig {
  return SOURCE_TOOL_COPY[sourceTool]?.[step] ?? SOURCE_TOOL_COPY.DEFAULT[step];
}

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
      case "ArrowRight":
        newIndex = (index + 1) % WINDOW_COUNT_OPTIONS.length;
        break;
      case "ArrowLeft":
        newIndex = (index - 1 + WINDOW_COUNT_OPTIONS.length) % WINDOW_COUNT_OPTIONS.length;
        break;
      case "ArrowDown":
        newIndex = (index + cols) % WINDOW_COUNT_OPTIONS.length;
        break;
      case "ArrowUp":
        newIndex = (index - cols + WINDOW_COUNT_OPTIONS.length) % WINDOW_COUNT_OPTIONS.length;
        break;
      case "Enter":
      case " ":
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
      <label id="window-count-label" className="text-sm font-semibold text-slate-300">
        Scope of Project (Window Count)
      </label>
      <div role="radiogroup" aria-labelledby="window-count-label" className="grid grid-cols-2 gap-2">
        {WINDOW_COUNT_OPTIONS.map((opt, index) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                flex-1 py-3 px-4 rounded-lg border text-sm font-bold transition-all
                min-h-[48px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[hsl(220,20%,11%)]
                ${
                  isSelected
                    ? "bg-cyan-900/40 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(8,145,178,0.2)]"
                    : "bg-[hsl(220,25%,8%)] text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
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

export function ExitIntentModal({ sourceTool, hasConverted = false, onSuccess }: ExitIntentModalProps) {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<GauntletStep>("insider_price");
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
      name: sessionData.name || "",
      email: sessionData.email || "",
      phone: sessionData.phone || "",
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
      name: prefillSnapshotRef.current?.name || "",
      email: prefillSnapshotRef.current?.email || "",
      phone: prefillSnapshotRef.current?.phone || "",
      windowCount: "",
    },
    schemas: {
      name: commonSchemas.name,
      email: commonSchemas.email,
      phone: commonSchemas.phone,
      windowCount: z.string().min(1, "Please select window count"),
    },
    formatters: { phone: formatPhoneNumber },
  });

  const step2Form = useFormValidation({
    initialValues: {
      phone: prefillSnapshotRef.current?.phone || "",
    },
    schemas: {
      phone: commonSchemas.phone,
    },
    formatters: { phone: formatPhoneNumber },
  });

  const step3Form = useFormValidation({
    initialValues: {
      email: prefillSnapshotRef.current?.email || "",
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
    formLocation: "exit_gauntlet_insider",
    leadScore: 100,
    successTitle: "Success!",
    successDescription: "Your local pricing data is on the way.",
    aiContext: {
      offer_step: 1,
      source: "exit_intent_modal",
    },
    onSuccess: () => {
      setHasSubmitted((prev) => ({ ...prev, insider_price: true }));
      try {
        trackEvent("lead_submitted", {
          step: "insider_price",
          lead_score: 100,
          sessionId: sessionIdRef.current,
        });
      } catch (e) {
        console.error("Analytics error:", e);
      }
      handleCloseAfterSubmit();
    },
  });

  const step2Submit = useLeadFormSubmit({
    sourceTool,
    formLocation: "exit_gauntlet_storm",
    leadScore: 60,
    successTitle: "You're on the list!",
    successDescription: "We'll text you when storms or deals hit.",
    aiContext: {
      offer_step: 2,
      source: "exit_intent_modal",
    },
    onSuccess: () => {
      setHasSubmitted((prev) => ({ ...prev, storm_sentinel: true }));
      try {
        trackEvent("lead_submitted", {
          step: "storm_sentinel",
          lead_score: 60,
          sessionId: sessionIdRef.current,
        });
      } catch (e) {
        console.error("Analytics error:", e);
      }
      handleCloseAfterSubmit();
    },
  });

  const step3Submit = useLeadFormSubmit({
    sourceTool,
    formLocation: "exit_gauntlet_kitchen",
    leadScore: 30,
    successTitle: "Check your inbox!",
    successDescription: "Your cheat sheet is on the way.",
    aiContext: {
      offer_step: 3,
      source: "exit_intent_modal",
    },
    onSuccess: () => {
      setHasSubmitted((prev) => ({ ...prev, kitchen_table: true }));
      try {
        trackEvent("lead_submitted", {
          step: "kitchen_table",
          lead_score: 30,
          sessionId: sessionIdRef.current,
        });
      } catch (e) {
        console.error("Analytics error:", e);
      }
      handleCloseAfterSubmit();
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────
  const canShowModal = useCallback(() => {
    if (hasConverted) return false;
    if (typeof window === "undefined") return false;

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

    const startingStep: GauntletStep = fullIdentity ? "storm_sentinel" : "insider_price";

    // Initialize forms with snapshot values
    if (prefillSnapshotRef.current) {
      step1Form.setValues({
        name: prefillSnapshotRef.current.name,
        email: prefillSnapshotRef.current.email,
        phone: prefillSnapshotRef.current.phone,
        windowCount: "",
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
    sessionStorage.setItem(storageKey, "true");
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
        trackEvent("modal_opened", { sessionId: sessionIdRef.current });

        // Enriched dataLayer push for exit intent modal
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "exit_intent_modal_opened",
          event_id: generateEventId(),
          client_id: getOrCreateClientId(),
          session_id: getOrCreateSessionId(),
          external_id: externalId,
          source_tool: sourceTool,
          source_system: "web",
          modal_name: "exit_intent_gauntlet",
          starting_step: currentStep,
        });
      } catch (e) {
        console.error("Analytics error:", e);
      }

      // If we skipped Step 1, fire step_skipped
      const fullIdentity = !!(
        prefillSnapshotRef.current?.name &&
        prefillSnapshotRef.current?.email &&
        prefillSnapshotRef.current?.phone
      );

      if (fullIdentity) {
        try {
          trackEvent("step_skipped", {
            step: "insider_price",
            reason: "identity_complete",
            sessionId: sessionIdRef.current,
          });
        } catch (e) {
          console.error("Analytics error:", e);
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
        trackEvent("step_viewed", {
          step: currentStep,
          sessionId: sessionIdRef.current,
        });

        // Enriched dataLayer push for step views
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "exit_intent_step_viewed",
          event_id: generateEventId(),
          client_id: getOrCreateClientId(),
          session_id: getOrCreateSessionId(),
          external_id: externalId,
          source_tool: sourceTool,
          source_system: "web",
          form_name: "exit_intent_gauntlet",
          step_name: currentStep,
          step_index: STEP_CONFIG[currentStep].number,
        });
      } catch (e) {
        console.error("Analytics error:", e);
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
    const cancelIdle = scheduleWhenIdle(
      () => {
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

        window.addEventListener("scroll", handleScroll, { passive: true });
        cleanup = () => window.removeEventListener("scroll", handleScroll);
      },
      { minDelay: 2000 },
    );

    return () => {
      cancelIdle();
      if (rafId !== null) cancelAnimationFrame(rafId);
      cleanup?.();
    };
  }, []);

  // Desktop: Mouse leave detection - deferred
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const cancelIdle = scheduleWhenIdle(
      () => {
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            showModal();
          }
        };

        document.addEventListener("mouseleave", handleMouseLeave);
        cleanup = () => document.removeEventListener("mouseleave", handleMouseLeave);
      },
      { minDelay: 2000 },
    );

    return () => {
      cancelIdle();
      cleanup?.();
    };
  }, [showModal]);

  // Mobile: Scroll up detection - deferred
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const cancelIdle = scheduleWhenIdle(
      () => {
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

        window.addEventListener("scroll", handleScrollUp, { passive: true });
        cleanup = () => window.removeEventListener("scroll", handleScrollUp);
      },
      { minDelay: 2000 },
    );

    return () => {
      cancelIdle();
      cleanup?.();
    };
  }, [showModal]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose("escape");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleClose = useCallback((reason: "user_closed" | "backdrop" | "escape") => {
    try {
      trackEvent("modal_closed", {
        reason,
        sessionId: sessionIdRef.current,
      });
    } catch (e) {
      console.error("Analytics error:", e);
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
      handleClose("backdrop");
    }
  };

  const handleDecline = useCallback(() => {
    try {
      trackEvent("offer_declined", {
        step: currentStep,
        sessionId: sessionIdRef.current,
      });
    } catch (e) {
      console.error("Analytics error:", e);
    }

    setHasDeclined((prev) => ({ ...prev, [currentStep]: true }));

    if (currentStep === "insider_price") {
      setCurrentStep("storm_sentinel");
    } else if (currentStep === "storm_sentinel") {
      setCurrentStep("kitchen_table");
    } else {
      handleClose("user_closed");
    }
  }, [currentStep, handleClose]);

  const handleBack = useCallback(() => {
    // Back does NOT clear declined/submitted flags
    if (currentStep === "storm_sentinel") {
      setCurrentStep("insider_price");
    } else if (currentStep === "kitchen_table") {
      setCurrentStep("storm_sentinel");
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
      name: prefillSnapshotRef.current?.name || "Storm Alert Subscriber",
    });
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step3Form.validateAll()) return;

    await step3Submit.submit({
      email: step3Form.values.email,
      name: prefillSnapshotRef.current?.name || "Cheat Sheet Requester",
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
  // STEP TRACKER DATA
  // ─────────────────────────────────────────────────────────────────────────
  const stepTrackerItems = [
    {
      number: 1,
      title: "Pricing Intelligence",
      desc: "Access verified local installation data.",
      key: "insider_price" as GauntletStep,
    },
    {
      number: 2,
      title: "Storm Sentinel",
      desc: "Real-time alerts on supply chain delays.",
      key: "storm_sentinel" as GauntletStep,
    },
    {
      number: 3,
      title: "Defense Protocol",
      desc: "The 3-question cheat sheet against high-pressure sales.",
      key: "kitchen_table" as GauntletStep,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const stepNumber = STEP_CONFIG[currentStep].number;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gauntlet-title"
    >
      {/* MODAL CONTAINER — Split Pane */}
      <div
        className={`
          relative w-full max-w-4xl rounded-2xl overflow-hidden
          bg-[hsl(220,25%,7%)] border border-[hsl(200,60%,25%/0.3)]
          shadow-[0_30px_80px_rgba(0,0,0,0.6)]
          animate-in fade-in slide-in-from-right-4 duration-300
          max-h-[90vh] flex flex-col md:flex-row
        `}
      >
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* LEFT PANE: BRANDING — Desktop Only                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="hidden md:flex w-[42%] bg-[hsl(220,22%,9%)] relative flex-col justify-between p-8 overflow-hidden">
          {/* Blueprint Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `
                linear-gradient(hsl(200,60%,50%) 1px, transparent 1px),
                linear-gradient(90deg, hsl(200,60%,50%) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Decorative corner accents */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-500/5 to-transparent" />

          <div className="relative z-10 flex flex-col h-full">
            {/* Logo / Title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-lg font-bold">
                    <span className="text-cyan-400">Forensic</span> <span className="text-white">Ally</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-500 text-xs tracking-wider uppercase">For Impact Window Decisions</p>
            </div>

            {/* Character / Visual Area */}
            <div className="flex-1 flex items-center justify-center my-4">
              <div className="relative w-40 h-40">
                {/* Cyan ambient glow */}
                <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-2xl" />
                {/* Placeholder silhouette */}
                <div className="relative w-full h-full rounded-full bg-[hsl(220,25%,12%)] border border-slate-700/50 flex items-center justify-center">
                  <ShieldCheck className="w-16 h-16 text-cyan-500/30" />
                </div>
              </div>
            </div>

            {/* Step Tracker */}
            <div className="space-y-4">
              {stepTrackerItems.map((item) => {
                const isActive = item.key === currentStep;
                return (
                  <div key={item.key} className="flex items-start gap-3">
                    <div
                      className={`
                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border
                        ${
                          isActive
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                            : "bg-slate-800 border-slate-700 text-slate-500"
                        }
                      `}
                    >
                      {item.number}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-500"}`}>{item.title}</p>
                      <p className={`text-xs ${isActive ? "text-slate-400" : "text-slate-600"}`}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* RIGHT PANE: FORM SURFACE                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 bg-[hsl(220,20%,11%)] p-6 sm:p-8 overflow-y-auto max-h-[90vh] md:max-h-none relative">
          {/* Close Button */}
          <button
            onClick={() => handleClose("user_closed")}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step Header */}
          <div className="flex items-center justify-between mb-6">
            {currentStep !== "insider_price" ? (
              <button
                type="button"
                onClick={handleBack}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 uppercase tracking-wider"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
            ) : (
              <div className="flex items-center gap-2 md:hidden">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">Forensic Ally</span>
              </div>
            )}
            <span className="text-cyan-400 text-xs tracking-wider uppercase ml-auto" aria-live="polite">
              Step {stepNumber} of 3
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 1: INSIDER PRICE (Lead Score: 100)                   */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {currentStep === "insider_price" && (() => {
            const copy = getStepCopy(sourceTool, "step1");
            return (
            <div className="space-y-5">
              <div>
                <Badge className="mb-3 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20">
                  {copy.badge || "INTELLIGENCE DATABASE"}
                </Badge>

                <h2
                  id="gauntlet-title"
                  className="text-xl sm:text-2xl font-bold text-white mb-2 uppercase tracking-tight"
                >
                  {copy.headline}
                </h2>
                <p className="text-sm text-slate-400">
                  {copy.subheadline}
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4">
                {/* Name + Phone side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Full Name</label>
                    <Input
                      ref={firstInputRef}
                      type="text"
                      {...step1Form.getFieldProps("name")}
                      onChange={handleInputChange("name", step1Form.getFieldProps("name").onChange)}
                      placeholder="Your name"
                      className={`bg-[hsl(220,25%,8%)] text-slate-200 border-slate-700 placeholder:text-slate-500 focus-visible:ring-cyan-500 ${step1Form.hasError("name") ? "border-destructive" : ""}`}
                      disabled={step1Submit.isSubmitting}
                    />
                    {step1Form.hasError("name") && (
                      <p className="text-xs text-destructive">{step1Form.getError("name")}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Phone Number</label>
                    <Input
                      type="tel"
                      {...step1Form.getFieldProps("phone")}
                      onChange={handleInputChange("phone", step1Form.getFieldProps("phone").onChange)}
                      placeholder="(555) 555-5555"
                      className={`bg-[hsl(220,25%,8%)] text-slate-200 border-slate-700 placeholder:text-slate-500 focus-visible:ring-cyan-500 ${step1Form.hasError("phone") ? "border-destructive" : ""}`}
                      disabled={step1Submit.isSubmitting}
                    />
                    {step1Form.hasError("phone") && (
                      <p className="text-xs text-destructive">{step1Form.getError("phone")}</p>
                    )}
                  </div>
                </div>

                {/* Email full width */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Email Address</label>
                  <Input
                    type="email"
                    {...step1Form.getFieldProps("email")}
                    onChange={handleInputChange("email", step1Form.getFieldProps("email").onChange)}
                    placeholder="your@email.com"
                    className={`bg-[hsl(220,25%,8%)] text-slate-200 border-slate-700 placeholder:text-slate-500 focus-visible:ring-cyan-500 ${step1Form.hasError("email") ? "border-destructive" : ""}`}
                    disabled={step1Submit.isSubmitting}
                  />
                  {step1Form.hasError("email") && (
                    <p className="text-xs text-destructive">{step1Form.getError("email")}</p>
                  )}
                </div>

                <WindowCountSelector
                  value={step1Form.values.windowCount}
                  onChange={(val) => step1Form.setValue("windowCount", val)}
                  error={step1Form.getError("windowCount")}
                />

                {/* CTA Button */}
                <button
                  type="submit"
                  className="w-full min-h-[48px] inline-flex items-center justify-center rounded-lg font-bold text-white transition-all bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_25px_rgba(8,145,178,0.5)] border border-cyan-400/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  disabled={step1Submit.isSubmitting}
                >
                  {step1Submit.isSubmitting ? copy.ctaLoading : copy.ctaLabel}
                </button>

                {/* Decline — fat-finger safety */}
                <div className="mt-6 border-t border-slate-800 pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleDecline}
                    className="text-slate-500 hover:text-slate-300 underline underline-offset-4 uppercase text-xs tracking-wider"
                  >
                    {copy.declineText}
                  </button>
                </div>
              </form>
            </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 2: STORM SENTINEL (Lead Score: 60)                   */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {currentStep === "storm_sentinel" && (() => {
            const copy = getStepCopy(sourceTool, "step2");
            return (
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center justify-center w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>

                <h2
                  id="gauntlet-title"
                  className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-tight whitespace-pre-line"
                >
                  {copy.headline}
                </h2>
                <p className="text-sm text-slate-400">
                  {copy.subheadline}
                </p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Direct Alert Number</label>
                  <Input
                    ref={firstInputRef}
                    type="tel"
                    {...step2Form.getFieldProps("phone")}
                    onChange={handleInputChange("phone", step2Form.getFieldProps("phone").onChange)}
                    placeholder="(555) 555-5555"
                    className={`bg-[hsl(220,25%,8%)] text-slate-200 border-slate-700 placeholder:text-slate-500 focus-visible:ring-cyan-500 ${step2Form.hasError("phone") ? "border-destructive" : ""}`}
                    disabled={step2Submit.isSubmitting}
                  />
                  {step2Form.hasError("phone") && (
                    <p className="text-xs text-destructive">{step2Form.getError("phone")}</p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  type="submit"
                  className="w-full min-h-[48px] inline-flex items-center justify-center rounded-lg font-bold text-white transition-all bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_25px_rgba(8,145,178,0.5)] border border-cyan-400/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  disabled={step2Submit.isSubmitting}
                >
                  {step2Submit.isSubmitting ? copy.ctaLoading : copy.ctaLabel}
                </button>

                {/* Decline — fat-finger safety */}
                <div className="mt-6 border-t border-slate-800 pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleDecline}
                    className="text-slate-500 hover:text-slate-300 underline underline-offset-4 uppercase text-xs tracking-wider"
                  >
                    {copy.declineText}
                  </button>
                </div>
              </form>
            </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 3: KITCHEN TABLE DEFENSE (Lead Score: 30)            */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {currentStep === "kitchen_table" && (() => {
            const copy = getStepCopy(sourceTool, "step3");
            return (
            <div className="space-y-4">
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>

                <h2 id="gauntlet-title" className="text-lg font-bold text-white mb-2 uppercase tracking-tight whitespace-pre-line">
                  {copy.headline}
                </h2>
                <p className="text-sm text-slate-400">
                  {copy.subheadline}
                </p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Delivery Address</label>
                  <Input
                    ref={firstInputRef}
                    type="email"
                    {...step3Form.getFieldProps("email")}
                    onChange={handleInputChange("email", step3Form.getFieldProps("email").onChange)}
                    placeholder="your@email.com"
                    className={`bg-[hsl(220,25%,8%)] text-slate-200 border-slate-700 placeholder:text-slate-500 focus-visible:ring-cyan-500 ${step3Form.hasError("email") ? "border-destructive" : ""}`}
                    disabled={step3Submit.isSubmitting}
                  />
                  {step3Form.hasError("email") && (
                    <p className="text-xs text-destructive">{step3Form.getError("email")}</p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  type="submit"
                  className="w-full min-h-[48px] inline-flex items-center justify-center rounded-lg font-bold text-white transition-all bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_25px_rgba(8,145,178,0.5)] border border-cyan-400/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  disabled={step3Submit.isSubmitting}
                >
                  {step3Submit.isSubmitting ? copy.ctaLoading : copy.ctaLabel}
                </button>

                {/* Decline — fat-finger safety */}
                <div className="mt-6 border-t border-slate-800 pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleDecline}
                    className="text-slate-500 hover:text-slate-300 underline underline-offset-4 uppercase text-xs tracking-wider"
                  >
                    {copy.declineText}
                  </button>
                </div>
              </form>
            </div>
            );
          })()}

          {/* Trust Footer */}
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-600 text-xs uppercase tracking-wider">
              Secure 256-bit Encrypted Transmission
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExitIntentModal;
