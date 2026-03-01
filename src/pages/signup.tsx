import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/config/navigation";
import { QuoteUploadZone } from "@/components/quote-scanner/QuoteUploadZone";
import { useSessionData } from "@/hooks/useSessionData";
import { useToast } from "@/hooks/use-toast";

import { AuthModal } from "@/components/signup/AuthModal";
import { QuoteAnalysisFlow } from "@/components/signup/QuoteAnalysisFlow";
import { QualificationFlow } from "@/components/signup/QualificationFlow";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type SignupFlow = "has_quote" | "no_quote";

export enum SignupState {
  IDLE = "IDLE",
  UPLOADING = "UPLOADING",
  AUTH_GATE = "AUTH_GATE",
  VERIFYING_EMAIL = "VERIFYING_EMAIL",
  VERIFYING_PHONE = "VERIFYING_PHONE",
  POLLING_ANALYSIS = "POLLING_ANALYSIS",
  QUALIFYING = "QUALIFYING",
  REVEAL = "REVEAL",
}

// ---------- sessionStorage keys ----------
const SS = {
  state: "wm.signup.state",
  flow: "wm.signup.flow",
  accountId: "wm.signup.account_id",
  quoteAnalysisId: "wm.signup.quote_analysis_id", // aka pending_scan_uuid in your doc
  phone: "wm.signup.phone",
  profile: "wm.signup.profile", // { first_name,last_name,email }
} as const;

function ssGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function ssSet(key: string, value: unknown) {
  sessionStorage.setItem(key, JSON.stringify(value));
}
function ssDel(key: string) {
  sessionStorage.removeItem(key);
}

// ---------- edge function helpers ----------
async function callEdgeJson<T>(fnName: string, body: unknown, accessToken?: string | null): Promise<{ status: number; data?: T; errorText?: string }> {
  // supabase.functions.invoke() does not reliably expose raw HTTP status for 409 control,
  // so we hit the functions endpoint directly to preserve status codes.
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const status = res.status;
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // noop
  }

  if (!res.ok) {
    return { status, errorText: json?.error || json?.message || res.statusText };
  }
  return { status, data: json as T };
}

type SaveLeadResponse = { leadId: string };
type UploadQuoteResponse = { pending_scan_uuid?: string; quote_analysis_id?: string; file_id?: string; success: boolean };
type OrchestrateResponse = { success: boolean; quote_analysis_id: string; analyzed_at: string | null; analysis_json: any };
type QualifyFlowBResponse = { success: boolean; score: number; qualifies_for_registration_completed: boolean; event_type: "lead" | "registration_completed"; event_value: number; message: string };

export default function Signup() {
  const { toast } = useToast();
  const { sessionId, sessionData, updateFields } = useSessionData();

  const [flow, setFlow] = useState<SignupFlow>(() => ssGet<SignupFlow>(SS.flow) ?? "no_quote");
  const [state, setState] = useState<SignupState>(() => ssGet<SignupState>(SS.state) ?? SignupState.IDLE);

  const [authOpen, setAuthOpen] = useState(false);

  const [accountId, setAccountId] = useState<string | null>(() => ssGet<string>(SS.accountId));
  const [quoteAnalysisId, setQuoteAnalysisId] = useState<string | null>(() => ssGet<string>(SS.quoteAnalysisId));

  const [profile, setProfile] = useState<{ first_name: string; last_name: string; email: string } | null>(
    () => ssGet(SS.profile)
  );
  const [phone, setPhone] = useState<string | null>(() => ssGet<string>(SS.phone));

  const [analysis, setAnalysis] = useState<OrchestrateResponse | null>(null);
  const [flowBResult, setFlowBResult] = useState<QualifyFlowBResponse | null>(null);

  // persist state machine
  useEffect(() => {
    ssSet(SS.state, state);
  }, [state]);
  useEffect(() => {
    ssSet(SS.flow, flow);
  }, [flow]);
  useEffect(() => {
    if (accountId) ssSet(SS.accountId, accountId);
  }, [accountId]);
  useEffect(() => {
    if (quoteAnalysisId) ssSet(SS.quoteAnalysisId, quoteAnalysisId);
  }, [quoteAnalysisId]);
  useEffect(() => {
    if (phone) ssSet(SS.phone, phone);
  }, [phone]);
  useEffect(() => {
    if (profile) ssSet(SS.profile, profile);
  }, [profile]);

  const resetAll = useCallback(() => {
    setFlow("no_quote");
    setState(SignupState.IDLE);
    setAuthOpen(false);
    setAccountId(null);
    setQuoteAnalysisId(null);
    setProfile(null);
    setPhone(null);
    setAnalysis(null);
    setFlowBResult(null);

    ssDel(SS.state);
    ssDel(SS.flow);
    ssDel(SS.accountId);
    ssDel(SS.quoteAnalysisId);
    ssDel(SS.phone);
    ssDel(SS.profile);
  }, []);

  // ---------- auth redirect loop / sequencing ----------
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return;

      // If we returned via magic link and we have a phone to verify, trigger SMS
      const current = ssGet<SignupState>(SS.state);
      const storedPhone = ssGet<string>(SS.phone);

      if (storedPhone && (current === SignupState.VERIFYING_EMAIL || current === SignupState.AUTH_GATE)) {
        // Immediately trigger phone OTP via native phone-change flow
        setState(SignupState.VERIFYING_PHONE);
        ssSet(SS.state, SignupState.VERIFYING_PHONE);

        const { error } = await supabase.auth.updateUser({ phone: storedPhone });
        if (error) {
          toast({ title: "Phone verification failed", description: error.message, variant: "destructive" });
        }
      }
    });

    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, [toast]);

  // ---------- Flow A: upload quote ----------
  const handleFileSelect = useCallback(
    async (file: File) => {
      setFlow("has_quote");
      setState(SignupState.UPLOADING);
      setAuthOpen(false);

      // Real upload-quote call (multipart form)
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-quote`;
        const form = new FormData();
        form.append("file", file);
        form.append("session_id", sessionId);
        form.append("source_page", "/signup");

        // Optional identity hints if you want: (safe even if backend ignores)
        if (sessionData.leadId) form.append("lead_id", sessionData.leadId);
        form.append("session_uuid", sessionId);

        const res = await fetch(url, {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: form,
        });

        const json = (await res.json()) as UploadQuoteResponse;

        if (!res.ok || !json?.success) {
          throw new Error((json as any)?.message || "Upload failed");
        }

        // Prefer canonical pending_scan_uuid per your architecture
        const scanId = json.pending_scan_uuid || json.quote_analysis_id || json.file_id || null;
        if (!scanId) throw new Error("Upload succeeded but no scan id returned");

        setQuoteAnalysisId(scanId);
        setAuthOpen(true);
        setState(SignupState.AUTH_GATE);

        toast({ title: "Quote received", description: "We extracted your document. Create your Vault to unlock the grade." });
      } catch (e: any) {
        toast({ title: "Upload error", description: e?.message ?? "Please try again.", variant: "destructive" });
        setState(SignupState.IDLE);
      }
    },
    [sessionId, sessionData.leadId, toast]
  );

  // ---------- Flow B: start ----------
  const handleNoQuote = useCallback(() => {
    setFlow("no_quote");
    setAuthOpen(true);
    setState(SignupState.AUTH_GATE);
  }, []);

  // ---------- save-lead + magic link ----------
  const handleAuthSubmit = useCallback(
    async (payload: { first_name: string; last_name: string; email: string; phone: string }) => {
      setProfile({ first_name: payload.first_name, last_name: payload.last_name, email: payload.email });
      setPhone(payload.phone);

      // 1) Traffic Cop: save-lead -> accounts (vault)
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token ?? null;

        const { status, data, errorText } = await callEdgeJson<SaveLeadResponse>(
          "save-lead",
          {
            sourceTool: "vault",
            firstName: payload.first_name,
            lastName: payload.last_name,
            email: payload.email,
            phone: payload.phone,
            metadata: {
              flow,
              page: "/signup",
              quote_analysis_id: quoteAnalysisId,
            },
          },
          token
        );

        if (status >= 400 || !data?.leadId) {
          throw new Error(errorText || "Failed to save lead");
        }

        setAccountId(data.leadId);
        updateFields({ firstName: payload.first_name, lastName: payload.last_name, email: payload.email, phone: payload.phone, leadId: data.leadId });

        // 2) Magic link (redirect back to /signup, not /auth)
        const redirectUrl = `${window.location.origin}/signup`;
        const { error } = await supabase.auth.signInWithOtp({
          email: payload.email,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw new Error(error.message);

        // state: check your email
        setState(SignupState.VERIFYING_EMAIL);
        setAuthOpen(true);
        toast({ title: "Check your email", description: "We sent a secure login link. Click it to continue." });
      } catch (e: any) {
        toast({ title: "Signup failed", description: e?.message ?? "Please try again.", variant: "destructive" });
        setState(SignupState.AUTH_GATE);
        setAuthOpen(true);
      }
    },
    [flow, quoteAnalysisId, toast, updateFields]
  );

  // ---------- verify phone OTP ----------
  const handleVerifyOtp = useCallback(
    async (token: string) => {
      try {
        const { error } = await supabase.auth.verifyOtp({ type: "phone_change", token });
        if (error) throw new Error(error.message);

        setAuthOpen(false);

        // After phone verification:
        if (flow === "has_quote") {
          setState(SignupState.POLLING_ANALYSIS);
        } else {
          setState(SignupState.QUALIFYING);
        }
      } catch (e: any) {
        toast({ title: "Invalid code", description: e?.message ?? "Please try again.", variant: "destructive" });
      }
    },
    [flow, toast]
  );

  // ---------- Flow B qualify ----------
  const handleQualifySubmit = useCallback(
    async (answers: { is_homeowner: boolean; timeline: string; window_count: string; has_estimate: string }) => {
      try {
        if (!accountId) throw new Error("Missing account_id");

        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token ?? null;

        const { status, data, errorText } = await callEdgeJson<QualifyFlowBResponse>(
          "qualify-flow-b",
          {
            account_id: accountId,
            ...answers,
          },
          token
        );

        if (status >= 400 || !data?.success) {
          throw new Error(errorText || "Qualification failed");
        }

        setFlowBResult(data);
        setState(SignupState.REVEAL);
      } catch (e: any) {
        toast({ title: "Could not submit", description: e?.message ?? "Please try again.", variant: "destructive" });
      }
    },
    [accountId, toast]
  );

  // ---------- Flow A: receive analysis from QuoteAnalysisFlow polling ----------
  const handleAnalysisReady = useCallback((payload: OrchestrateResponse) => {
    setAnalysis(payload);
    setState(SignupState.REVEAL);
  }, []);

  const heroCta = useMemo(() => {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="h-11 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => {
            const el = document.getElementById("signup-split-zone");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          Scan My Quote Now
        </Button>
        <Button
          variant="outline"
          className="h-11 px-6 rounded-xl border-blue-200/20 bg-white/5 hover:bg-white/10 text-white"
          onClick={handleNoQuote}
        >
          No Quote Yet? Create Vault
        </Button>
      </div>
    );
  }, [handleNoQuote]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Minimal header */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href={ROUTES.HOME} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 border border-blue-300/20" />
            <span className="font-semibold tracking-tight">Window Man</span>
          </a>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-white/80 hover:text-white" onClick={resetAll}>
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Scan Your Quote. <span className="text-blue-300">Beat Your Contractors.</span>
            </h1>
            <p className="mt-4 text-white/70 text-lg max-w-xl">
              Get a forensic, 5-pillar breakdown that exposes overpricing, scope gaps, and fine print traps—so you can negotiate from strength.
            </p>

            <div className="mt-6">{heroCta}</div>

            {/* urgency pill */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-200/15 bg-blue-500/10 px-4 py-2 text-sm text-white/80">
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              <span>
                <span className="font-semibold text-white">Thousands</span> of Florida homeowners scanned this month
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="bg-white/5 border-white/10 rounded-2xl p-5">
              <div className="text-sm text-white/70">What you’ll get</div>
              <ul className="mt-3 space-y-2 text-white/85 text-sm">
                <li>• Final grade (A- to F) + pillar scores</li>
                <li>• Hidden fees, commission traps, and scope omissions</li>
                <li>• Negotiation bullets tailored to your quote</li>
              </ul>
              <div className="mt-4 text-xs text-white/55">
                Security-first Vault access. Email + phone verification required to unlock results.
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* SPLIT CONVERSION ZONE */}
      <section id="signup-split-zone" className="max-w-6xl mx-auto px-4 pb-14">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Flow A */}
          <Card className="bg-white/5 border-white/10 rounded-2xl p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">I Have a Quote</h2>
              <span className="text-xs text-white/60">PDF or image</span>
            </div>

            <div className="mt-4">
              <QuoteUploadZone
                onFileSelect={handleFileSelect}
                isAnalyzing={state === SignupState.UPLOADING || state === SignupState.POLLING_ANALYSIS}
                hasResult={!!analysis}
                imagePreview={null}
                mimeType={null}
                analysisResult={null}
                onNoQuoteClick={handleNoQuote}
              />
            </div>

            {/* Flow A theatrical + polling area */}
            {(flow === "has_quote" && state !== SignupState.IDLE) && (
              <div className="mt-5">
                <QuoteAnalysisFlow
                  state={state}
                  accountId={accountId}
                  quoteAnalysisId={quoteAnalysisId}
                  onNeedAuth={() => {
                    setAuthOpen(true);
                    setState(SignupState.AUTH_GATE);
                  }}
                  onAnalysisReady={handleAnalysisReady}
                />
              </div>
            )}
          </Card>

          {/* Flow B */}
          <Card className="bg-white/5 border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Don’t Have a Quote Yet?</h2>
            <p className="mt-2 text-white/70 text-sm">
              Create your free Vault now and scan later. Takes ~30 seconds.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Button
                className="h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleNoQuote}
              >
                Create Account & Scan Later
              </Button>

              <div className="text-xs text-white/55">
                You’ll verify email + phone to activate Vault access. No credit card.
              </div>
            </div>

            {(flow === "no_quote" && state === SignupState.QUALIFYING) && (
              <div className="mt-6">
                <QualificationFlow onSubmit={handleQualifySubmit} />
              </div>
            )}

            {(flow === "no_quote" && state === SignupState.REVEAL && flowBResult) && (
              <div className="mt-6 rounded-2xl border border-blue-200/15 bg-blue-500/10 p-4">
                <div className="text-sm font-semibold">Vault Activated</div>
                <div className="mt-1 text-sm text-white/75">{flowBResult.message}</div>
                <div className="mt-3 text-xs text-white/60">
                  Score: <span className="text-white">{flowBResult.score}</span> • Event:{" "}
                  <span className="text-white">{flowBResult.event_type}</span> (${flowBResult.event_value})
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* AUTH MODAL */}
      <AuthModal
        open={authOpen}
        state={state}
        flow={flow}
        email={profile?.email ?? ""}
        phone={phone ?? ""}
        onOpenChange={setAuthOpen}
        onSubmitProfile={handleAuthSubmit}
        onSubmitOtp={handleVerifyOtp}
      />

      {/* FINAL REVEAL SECTION (Flow A) */}
      {flow === "has_quote" && state === SignupState.REVEAL && analysis?.analysis_json && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <Card className="bg-white/5 border-white/10 rounded-2xl p-6">
            <div className="text-2xl font-bold">Your Quote Analysis</div>
            <p className="mt-2 text-white/70 text-sm">
              This is rendered **directly** from `analysis_json` (no frontend grading logic).
            </p>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-blue-200/15 bg-blue-500/10 p-5">
                <div className="text-sm text-white/70">Final Grade</div>
                <div className="mt-2 text-5xl font-black text-blue-200">
                  {String(analysis.analysis_json?.finalGrade ?? "—")}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-white/70">Pillar Scores</div>
                <div className="mt-3 space-y-2 text-sm">
                  {Object.entries(analysis.analysis_json?.pillarScores ?? {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-white/75">{k}</span>
                      <span className="font-semibold text-white">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 text-xs text-white/45">
          © {new Date().getFullYear()} Window Man • Terms • Privacy
        </div>
      </footer>
    </div>
  );
}
