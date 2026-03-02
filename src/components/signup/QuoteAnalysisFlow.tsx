import React, { useEffect, useMemo, useRef, useState } from "react";
import { SignupState } from "@/pages/Signup";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type OrchestrateResponse = { success: boolean; quote_analysis_id: string; analyzed_at: string | null; analysis_json: any };

async function callOrchestrateQuoteAnalysis(payload: { account_id: string; quote_analysis_id: string }) {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token ?? null;

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrate-quote-analysis`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const status = res.status;
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // noop
  }

  return { status, json: json as OrchestrateResponse | any };
}

function useAnalysisPolling(params: {
  enabled: boolean;
  accountId: string | null;
  quoteAnalysisId: string | null;
  intervalMs?: number;
  onReady: (data: OrchestrateResponse) => void;
  onError?: (message: string) => void;
}) {
  const { enabled, accountId, quoteAnalysisId, intervalMs = 3000, onReady, onError } = params;
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !accountId || !quoteAnalysisId) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      try {
        const { status, json } = await callOrchestrateQuoteAnalysis({
          account_id: accountId,
          quote_analysis_id: quoteAnalysisId,
        });

        if (status === 409) {
          // Not ready. keep polling.
          timer.current = window.setTimeout(tick, intervalMs);
          return;
        }

        if (status >= 400) {
          const msg = json?.error || json?.message || "Failed to fetch analysis";
          onError?.(msg);
          return;
        }

        // 200 OK
        onReady(json as OrchestrateResponse);
      } catch (e: any) {
        onError?.(e?.message ?? "Polling error");
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [enabled, accountId, quoteAnalysisId, intervalMs, onReady, onError]);
}

export function QuoteAnalysisFlow(props: {
  state: SignupState;
  accountId: string | null;
  quoteAnalysisId: string | null;
  onNeedAuth: () => void;
  onAnalysisReady: (data: OrchestrateResponse) => void;
}) {
  const { state, accountId, quoteAnalysisId, onNeedAuth, onAnalysisReady } = props;

  const [scanProgress, setScanProgress] = useState(0);
  const [pollError, setPollError] = useState<string | null>(null);

  // UPLOADING theatrics: ramp to 99%
  useEffect(() => {
    if (state !== SignupState.UPLOADING) return;

    setScanProgress(0);
    setPollError(null);

    let p = 0;
    const id = window.setInterval(() => {
      p += Math.random() * 12;
      if (p >= 99) p = 99;
      setScanProgress(p);
      if (p >= 99) window.clearInterval(id);
    }, 250);

    return () => window.clearInterval(id);
  }, [state]);

  // POLLING loop (409 -> retry)
  useAnalysisPolling({
    enabled: state === SignupState.POLLING_ANALYSIS,
    accountId,
    quoteAnalysisId,
    intervalMs: 3000,
    onReady: onAnalysisReady,
    onError: (m) => setPollError(m),
  });

  const mode = useMemo(() => {
    if (state === SignupState.UPLOADING) return "EXTRACTING";
    if (state === SignupState.AUTH_GATE || state === SignupState.VERIFYING_EMAIL || state === SignupState.VERIFYING_PHONE) return "LOCKED";
    if (state === SignupState.POLLING_ANALYSIS) return "POLLING";
    return "IDLE";
  }, [state]);

  if (mode === "IDLE") return null;

  return (
    <div className="space-y-3">
      {mode === "EXTRACTING" && (
        <Card className="bg-white/5 border-white/10 rounded-2xl p-4">
          <div className="text-sm font-semibold">Data Extraction</div>
          <div className="mt-2 text-xs text-white/65 space-y-1">
            <div className="animate-pulse">Scanning document…</div>
            <div className="animate-pulse [animation-delay:200ms]">Identifying window brands…</div>
            <div className="animate-pulse [animation-delay:400ms]">Extracting line-item pricing…</div>
          </div>
          <div className="mt-3">
            <Progress value={scanProgress} />
            <div className="mt-1 text-[11px] text-white/55">{Math.round(scanProgress)}%</div>
          </div>
        </Card>
      )}

      {mode === "LOCKED" && (
        <Card className="bg-white/5 border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Analysis Complete</div>
              <div className="text-xs text-white/65">Verify to unlock your final grade.</div>
            </div>
            <Button
              className="h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
              onClick={onNeedAuth}
            >
              Unlock
            </Button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 relative overflow-hidden">
            {/* frosted blur overlay */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />
            <div className="relative">
              <div className="text-xs text-white/70">Final Grade</div>
              <div className="mt-2 text-4xl font-black text-white/90 select-none">B+</div>
              <div className="mt-3 text-xs text-white/60">
                (Locked) Enter your SMS code to decrypt.
              </div>
            </div>
          </div>
        </Card>
      )}

      {mode === "POLLING" && (
        <Card className="bg-white/5 border-white/10 rounded-2xl p-4">
          <div className="text-sm font-semibold">Compiling your report…</div>
          <div className="mt-2 text-xs text-white/65">Checking 5 pillars against Florida contractor standards.</div>

          <div className="mt-4 space-y-2">
            {["Safety & Code Match", "Install & Scope Clarity", "Price Fairness", "Fine Print Transparency", "Warranty Value"].map((label, idx) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-white/70">{label}</span>
                <span className="text-white/55 animate-pulse">{idx % 2 === 0 ? "Checking…" : "Evaluating…"}</span>
              </div>
            ))}
          </div>

          {pollError && (
            <div className="mt-3 text-xs text-red-300">
              {pollError}
            </div>
          )}

          <div className="mt-4 text-[11px] text-white/55">
            If this takes longer than expected, keep this tab open—results will auto-reveal.
          </div>
        </Card>
      )}
    </div>
  );
}
