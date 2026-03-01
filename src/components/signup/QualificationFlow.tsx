import React, { useMemo, useState } from "react";
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

  const canNext = useMemo(() => {
    if (step === 1) return isHomeowner !== null;
    if (step === 2) return timeline !== null;
    if (step === 3) return windowCount !== null;
    if (step === 4) return hasEstimate !== null;
    return false;
  }, [step, isHomeowner, timeline, windowCount, hasEstimate]);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <Card className="bg-white/5 border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Calibrate Your Vault</div>
          <div className="text-xs text-white/65">Quick questions so we can route you correctly.</div>
        </div>
        <div className="text-xs text-white/55">Step {step}/4</div>
      </div>

      <div className="mt-3">
        <Progress value={progress} />
      </div>

      <div className="mt-5 space-y-3">
        {step === 1 && (
          <>
            <div className="text-sm font-semibold">Are you the homeowner?</div>
            <div className="grid grid-cols-1 gap-2">
              <button
                className={`h-12 rounded-xl border px-4 text-left ${isHomeowner === true ? "border-orange-400 bg-orange-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                onClick={() => setIsHomeowner(true)}
                type="button"
              >
                Yes, I’m the homeowner
              </button>
              <button
                className={`h-12 rounded-xl border px-4 text-left ${isHomeowner === false ? "border-orange-400 bg-orange-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                onClick={() => setIsHomeowner(false)}
                type="button"
              >
                No / Not sure
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-sm font-semibold">What’s your timeline?</div>
            <div className="grid grid-cols-1 gap-2">
              {[
                ["now", "Now (within 2 weeks)"],
                ["within_month", "Within a month"],
                ["several_months", "Several months"],
                ["exploring", "Just exploring"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  className={`h-12 rounded-xl border px-4 text-left ${timeline === v ? "border-orange-400 bg-orange-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  onClick={() => setTimeline(v as Timeline)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-sm font-semibold">How many windows?</div>
            <div className="grid grid-cols-1 gap-2">
              {[
                ["1-5", "1–5 windows"],
                ["6-10", "6–10 windows"],
                ["11+", "11+ windows"],
                ["whole_house", "Whole house"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  className={`h-12 rounded-xl border px-4 text-left ${windowCount === v ? "border-orange-400 bg-orange-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  onClick={() => setWindowCount(v as WindowCount)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="text-sm font-semibold">Do you already have an estimate?</div>
            <div className="grid grid-cols-1 gap-2">
              {[
                ["yes_one", "Yes, one estimate"],
                ["yes_multiple", "Yes, multiple estimates"],
                ["no", "No, not yet"],
                ["not_sure", "Not sure"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  className={`h-12 rounded-xl border px-4 text-left ${hasEstimate === v ? "border-orange-400 bg-orange-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  onClick={() => setHasEstimate(v as HasEstimate)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white" onClick={back} disabled={step === 1 || busy}>
          Back
        </Button>

        {step < 4 ? (
          <Button className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white" onClick={next} disabled={!canNext || busy}>
            Next
          </Button>
        ) : (
          <Button
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
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
