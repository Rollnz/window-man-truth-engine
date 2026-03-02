import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFocusTrap } from "@/lib/formAccessibility";

type Timeline = "now" | "within_month" | "several_months" | "exploring";
type WindowCount = "1-5" | "6-10" | "11+" | "whole_house";
type HasEstimate = "yes_one" | "yes_multiple" | "no" | "not_sure";

interface Answers {
  is_homeowner: boolean;
  timeline: Timeline;
  window_count: WindowCount;
  has_estimate: HasEstimate;
}

const QUESTIONS = [
  {
    key: "is_homeowner",
    question: "Are you the homeowner?",
    options: [
      { value: true, label: "Yes, I'm the homeowner" },
      { value: false, label: "No / Not sure" },
    ],
  },
  {
    key: "timeline",
    question: "What's your timeline?",
    options: [
      { value: "now", label: "Now (within 2 weeks)" },
      { value: "within_month", label: "Within a month" },
      { value: "several_months", label: "Several months" },
      { value: "exploring", label: "Just exploring" },
    ],
  },
  {
    key: "window_count",
    question: "How many windows?",
    options: [
      { value: "1-5", label: "1–5 windows" },
      { value: "6-10", label: "6–10 windows" },
      { value: "11+", label: "11+ windows" },
      { value: "whole_house", label: "Whole house" },
    ],
  },
  {
    key: "has_estimate",
    question: "Do you already have an estimate?",
    options: [
      { value: "yes_one", label: "Yes, one estimate" },
      { value: "yes_multiple", label: "Yes, multiple estimates" },
      { value: "no", label: "No, not yet" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
] as const;

export function QualificationFlow(props: {
  onSubmit: (answers: Answers) => Promise<void>;
}) {
  const { onSubmit } = props;
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<(string | boolean | null)[]>([null, null, null, null]);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");
  const [animKey, setAnimKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (!panelRef.current) return;
    return createFocusTrap(panelRef.current);
  }, []);

  const handleSelect = useCallback(
    async (optionValue: string | boolean, optionIdx: number) => {
      if (busy) return;
      setHighlightIdx(optionIdx);
      const next = [...selected];
      next[step] = optionValue;
      setSelected(next);

      // Brief highlight then advance
      await new Promise((r) => setTimeout(r, 300));
      setHighlightIdx(null);

      if (step < 3) {
        setSlideDir("right");
        setStep((s) => s + 1);
        setAnimKey((k) => k + 1);
      } else {
        // Final step — auto-submit
        setBusy(true);
        try {
          await onSubmit({
            is_homeowner: next[0] as boolean,
            timeline: next[1] as Timeline,
            window_count: next[2] as WindowCount,
            has_estimate: next[3] as HasEstimate,
          });
        } finally {
          setBusy(false);
        }
      }
    },
    [step, selected, busy, onSubmit]
  );

  const goBack = () => {
    if (step === 0 || busy) return;
    setSlideDir("left");
    setStep((s) => s - 1);
    setAnimKey((k) => k + 1);
  };

  const currentQ = QUESTIONS[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Calibrate Your Vault"
    >
      <div
        ref={panelRef}
        className="relative max-w-md w-full mx-4 rounded-2xl bg-card p-6 shadow-2xl"
      >
        {/* Header row: back arrow + dots + step label */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || busy}
            className={cn(
              "rounded-full p-1.5 transition-colors",
              step === 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of 4`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-200",
                  i <= step ? "bg-primary" : "bg-muted-foreground/25"
                )}
              />
            ))}
          </div>

          <span className="text-xs text-muted-foreground">{step + 1} of 4</span>
        </div>

        {/* Question + options with slide animation */}
        <div
          key={animKey}
          className={cn(
            "animate-in duration-200",
            slideDir === "right" ? "slide-in-from-right-8 fade-in" : "slide-in-from-left-8 fade-in"
          )}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">{currentQ.question}</h2>

          <div className="space-y-2.5" role="radiogroup" aria-label={currentQ.question}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = selected[step] === opt.value;
              const isHighlighted = highlightIdx === idx;

              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={busy}
                  onClick={() => handleSelect(opt.value, idx)}
                  className={cn(
                    "w-full h-12 rounded-xl border px-4 text-left text-sm font-medium transition-all duration-150",
                    isHighlighted
                      ? "border-primary bg-primary/20 text-foreground scale-[1.02]"
                      : isSelected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/30 text-foreground hover:bg-muted/60"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {busy && (
          <p className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
            Submitting…
          </p>
        )}
      </div>
    </div>
  );
}
