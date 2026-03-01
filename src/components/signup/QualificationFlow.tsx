import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Timeline = "now" | "within_month" | "several_months" | "exploring";
type WindowCount = "1-5" | "6-10" | "11+" | "whole_house";
type HasEstimate = "yes_one" | "yes_multiple" | "no" | "not_sure";

export function QualificationFlow(props: {
  onSubmit: (answers: { is_homeowner: boolean; timeline: Timeline; window_count: WindowCount; has_estimate: HasEstimate }) => Promise<void>;
}) {
  const { onSubmit } = props;
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const [isHomeowner, setIsHomeowner] = useState<boolean | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [windowCount, setWindowCount] = useState<WindowCount | null>(null);
  const [hasEstimate, setHasEstimate] = useState<HasEstimate | null>(null);

  const progress = useMemo(() => (step / 4) * 100, [step]);
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  // Auto-focus first option when step changes
  useEffect(() => {
    setTimeout(() => firstOptionRef.current?.focus(), 50);
  }, [step]);

  const canNext = useMemo(() => {
    if (step === 1) return isHomeowner !== null;
    if (step === 2) return timeline !== null;
    if (step === 3) return windowCount !== null;
    if (step === 4) return hasEstimate !== null;
    return false;
  }, [step, isHomeowner, timeline, windowCount, hasEstimate]);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const optionClass = (selected: boolean) =>
    `h-12 rounded-xl border px-4 text-left transition-colors ${
      selected
        ? "border-primary bg-primary/15 text-foreground"
        : "border-border bg-muted/30 hover:bg-muted/60 text-foreground"
    }`;

  return (
    <Card className="bg-card border-border rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">Calibrate Your Vault</div>
          <div className="text-xs text-muted-foreground">Quick questions so we can route you correctly.</div>
        </div>
        <div className="text-xs text-muted-foreground" aria-live="polite">Step {step}/4</div>
      </div>

      <div className="mt-3">
        <Progress value={progress} />
      </div>

      <div className="mt-5 space-y-3">
        {step === 1 && (
          <fieldset>
            <legend className="text-sm font-semibold text-foreground mb-2">Are you the homeowner?</legend>
            <div role="radiogroup" aria-label="Homeowner status" className="grid grid-cols-1 gap-2">
              <button
                ref={firstOptionRef}
                className={optionClass(isHomeowner === true)}
                onClick={() => setIsHomeowner(true)}
                type="button"
                role="radio"
                aria-checked={isHomeowner === true}
              >
                Yes, I'm the homeowner
              </button>
              <button
                className={optionClass(isHomeowner === false)}
                onClick={() => setIsHomeowner(false)}
                type="button"
                role="radio"
                aria-checked={isHomeowner === false}
              >
                No / Not sure
              </button>
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset>
            <legend className="text-sm font-semibold text-foreground mb-2">What's your timeline?</legend>
            <div role="radiogroup" aria-label="Project timeline" className="grid grid-cols-1 gap-2">
              {([
                ["now", "Now (within 2 weeks)"],
                ["within_month", "Within a month"],
                ["several_months", "Several months"],
                ["exploring", "Just exploring"],
              ] as const).map(([v, label], i) => (
                <button
                  key={v}
                  ref={i === 0 ? firstOptionRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={timeline === v}
                  className={optionClass(timeline === v)}
                  onClick={() => setTimeline(v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend className="text-sm font-semibold text-foreground mb-2">How many windows?</legend>
            <div role="radiogroup" aria-label="Window count" className="grid grid-cols-1 gap-2">
              {([
                ["1-5", "1–5 windows"],
                ["6-10", "6–10 windows"],
                ["11+", "11+ windows"],
                ["whole_house", "Whole house"],
              ] as const).map(([v, label], i) => (
                <button
                  key={v}
                  ref={i === 0 ? firstOptionRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={windowCount === v}
                  className={optionClass(windowCount === v)}
                  onClick={() => setWindowCount(v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 4 && (
          <fieldset>
            <legend className="text-sm font-semibold text-foreground mb-2">Do you already have an estimate?</legend>
            <div role="radiogroup" aria-label="Estimate status" className="grid grid-cols-1 gap-2">
              {([
                ["yes_one", "Yes, one estimate"],
                ["yes_multiple", "Yes, multiple estimates"],
                ["no", "No, not yet"],
                ["not_sure", "Not sure"],
              ] as const).map(([v, label], i) => (
                <button
                  key={v}
                  ref={i === 0 ? firstOptionRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={hasEstimate === v}
                  className={optionClass(hasEstimate === v)}
                  onClick={() => setHasEstimate(v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="outline" className="rounded-xl h-11" onClick={back} disabled={step === 1 || busy}>
          Back
        </Button>

        {step < 4 ? (
          <Button className="rounded-xl h-11" onClick={next} disabled={!canNext || busy}>
            Next
          </Button>
        ) : (
          <Button
            className="rounded-xl h-11"
            disabled={!canNext || busy}
            onClick={async () => {
              if (isHomeowner === null || !timeline || !windowCount || !hasEstimate) return;
              setBusy(true);
              try {
                await onSubmit({
                  is_homeowner: isHomeowner,
                  timeline,
                  window_count: windowCount,
                  has_estimate: hasEstimate,
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Submitting…" : "Complete Profile"}
          </Button>
        )}
      </div>
    </Card>
  );
}
