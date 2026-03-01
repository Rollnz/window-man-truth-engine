import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuoteUploadZone } from "@/components/quote-scanner/QuoteUploadZone";
import { useSessionData } from "@/hooks/useSessionData";
import { useToast } from "@/hooks/use-toast";

import { AuthModal } from "@/components/signup/AuthModal";
import { QuoteAnalysisFlow } from "@/components/signup/QuoteAnalysisFlow";
import { QualificationFlow } from "@/components/signup/QualificationFlow";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Zap } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────
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

// ── sessionStorage helpers ─────────────────────────────────────────────
const SS = {
  state: "wm.signup.state",
  flow: "wm.signup.flow",
  accountId: "wm.signup.account_id",
  quoteAnalysisId: "wm.signup.quote_analysis_id",
  phone: "wm.signup.phone",
  profile: "wm.signup.profile",
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

// ── Edge-function caller ───────────────────────────────────────────────
async function callEdgeJson<T>(
  fnName: string,
  body: unknown,
  accessToken?: string | null,
): Promise<{ status: number; data?: T; errorText?: string }> {
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
  try { json = await res.json(); } catch { /* noop */ }

  if (!res.ok) return { status, errorText: json?.error || json?.message || res.statusText };
  return { status, data: json as T };
}

type SaveLeadResponse = { leadId: string };
type UploadQuoteResponse = { pending_scan_uuid?: string; quote_analysis_id?: string; file_id?: string; success: boolean };
type OrchestrateResponse = { success: boolean; quote_analysis_id: string; analyzed_at: string | null; analysis_json: any };
type QualifyFlowBResponse = { success: boolean; score: number; qualifies_for_registration_completed: boolean; event_type: "lead" | "registration_completed"; event_value: number; message: string };

// ── Page Component ─────────────────────────────────────────────────────
export default function Signup() {
  const { toast } = useToast();
  const { sessionId, sessionData, updateFields } = useSessionData();

  const [flow, setFlow] = useState<SignupFlow>(() => ssGet<SignupFlow>(SS.flow) ?? "no_quote");
  const [state, setState] = useState<SignupState>(() => ssGet<SignupState>(SS.state) ?? SignupState.IDLE);

  const [authOpen, setAuthOpen] = useState(false);

  const [accountId, setAccountId] = useState<string | null>(() => ssGet<string>(SS.accountId));
  const [quoteAnalysisId, setQuoteAnalysisId] = useState<string | null>(() => ssGet<string>(SS.quoteAnalysisId));

  const [profile, setProfile] = useState<{ first_name: string; last_name: string; email: string } | null>(
    () => ssGet(SS.profile),
  );
  const [phone, setPhone] = useState<string | null>(() => ssGet<string>(SS.phone));

  const [analysis, setAnalysis] = useState<OrchestrateResponse | null>(null);
  const [flowBResult, setFlowBResult] = useState<QualifyFlowBResponse | null>(null);

  // ── Persist state machine to sessionStorage ──────────────────────────
  useEffect(() => { ssSet(SS.state, state); }, [state]);
  useEffect(() => { ssSet(SS.flow, flow); }, [flow]);
  useEffect(() => { if (accountId) ssSet(SS.accountId, accountId); }, [accountId]);
  useEffect(() => { if (quoteAnalysisId) ssSet(SS.quoteAnalysisId, quoteAnalysisId); }, [quoteAnalysisId]);
  useEffect(() => { if (phone) ssSet(SS.phone, phone); }, [phone]);
  useEffect(() => { if (profile) ssSet(SS.profile, profile); }, [profile]);

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
    Object.values(SS).forEach(ssDel);
  }, []);

  // ── Auth redirect / phone-OTP sequencing ─────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return;
      const current = ssGet<SignupState>(SS.state);
      const storedPhone = ssGet<string>(SS.phone);

      if (storedPhone && (current === SignupState.VERIFYING_EMAIL || current === SignupState.AUTH_GATE)) {
        setState(SignupState.VERIFYING_PHONE);
        ssSet(SS.state, SignupState.VERIFYING_PHONE);
        const { error } = await supabase.auth.updateUser({ phone: storedPhone });
        if (error) {
          toast({ title: "Phone verification failed", description: error.message, variant: "destructive" });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [toast]);

  // ── Flow A: upload quote ─────────────────────────────────────────────
  const handleFileSelect = useCallback(
    async (file: File) => {
      setFlow("has_quote");
      setState(SignupState.UPLOADING);
      setAuthOpen(false);

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-quote`;
        const form = new FormData();
        form.append("file", file);
        form.append("session_id", sessionId);
        form.append("source_page", "/signup");
        if (sessionData.leadId) form.append("lead_id", sessionData.leadId);

        const res = await fetch(url, {
          method: "POST",
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: form,
        });

        const json = (await res.json()) as UploadQuoteResponse;
        if (!res.ok || !json?.success) throw new Error((json as any)?.message || "Upload failed");

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
    [sessionId, sessionData.leadId, toast],
  );

  // ── Flow B: no-quote start ──────────────────────────────────────────
  const handleNoQuote = useCallback(() => {
    setFlow("no_quote");
    setAuthOpen(true);
    setState(SignupState.AUTH_GATE);
  }, []);

  // ── Auth submit (save-lead + magic link) ─────────────────────────────
  const handleAuthSubmit = useCallback(
    async (payload: { first_name: string; last_name: string; email: string; phone: string }) => {
      setProfile({ first_name: payload.first_name, last_name: payload.last_name, email: payload.email });
      setPhone(payload.phone);

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
            metadata: { flow, page: "/signup", quote_analysis_id: quoteAnalysisId },
          },
          token,
        );

        if (status >= 400 || !data?.leadId) throw new Error(errorText || "Failed to save lead");

        setAccountId(data.leadId);
        updateFields({ firstName: payload.first_name, lastName: payload.last_name, email: payload.email, phone: payload.phone, leadId: data.leadId });

        const redirectUrl = `${window.location.origin}/signup`;
        const { error } = await supabase.auth.signInWithOtp({ email: payload.email, options: { emailRedirectTo: redirectUrl } });
        if (error) throw new Error(error.message);

        setState(SignupState.VERIFYING_EMAIL);
        setAuthOpen(true);
        toast({ title: "Check your email", description: "We sent a secure login link. Click it to continue." });
      } catch (e: any) {
        toast({ title: "Signup failed", description: e?.message ?? "Please try again.", variant: "destructive" });
        setState(SignupState.AUTH_GATE);
        setAuthOpen(true);
      }
    },
    [flow, quoteAnalysisId, toast, updateFields],
  );

  // ── Verify phone OTP ────────────────────────────────────────────────
  const handleVerifyOtp = useCallback(
    async (token: string) => {
      try {
        const { error } = await supabase.auth.verifyOtp({ type: "phone_change", token, phone: phone ?? "" });
        if (error) throw new Error(error.message);
        setAuthOpen(false);
        setState(flow === "has_quote" ? SignupState.POLLING_ANALYSIS : SignupState.QUALIFYING);
      } catch (e: any) {
        toast({ title: "Invalid code", description: e?.message ?? "Please try again.", variant: "destructive" });
      }
    },
    [flow, phone, toast],
  );

  // ── Flow B: qualification ───────────────────────────────────────────
  const handleQualifySubmit = useCallback(
    async (answers: { is_homeowner: boolean; timeline: string; window_count: string; has_estimate: string }) => {
      try {
        if (!accountId) throw new Error("Missing account_id");
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token ?? null;

        const { status, data, errorText } = await callEdgeJson<QualifyFlowBResponse>(
          "qualify-flow-b",
          { account_id: accountId, ...answers },
          token,
        );

        if (status >= 400 || !data?.success) throw new Error(errorText || "Qualification failed");
        setFlowBResult(data);
        setState(SignupState.REVEAL);
      } catch (e: any) {
        toast({ title: "Could not submit", description: e?.message ?? "Please try again.", variant: "destructive" });
      }
    },
    [accountId, toast],
  );

  // ── Flow A: analysis ready from polling ─────────────────────────────
  const handleAnalysisReady = useCallback((payload: OrchestrateResponse) => {
    setAnalysis(payload);
    setState(SignupState.REVEAL);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2 text-lg font-bold">
            <Shield className="h-5 w-5 text-primary" />
            Window Man
          </a>
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Reset
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Scan Your Quote. Beat Your Contractors.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Get a forensic, 5-pillar breakdown that exposes overpricing, scope gaps, and fine print traps—so you can negotiate from strength.
            </p>

            <div className="flex flex-wrap gap-3" id="signup-split-zone">
              <Button
                size="lg"
                className="rounded-xl"
                onClick={() => {
                  const el = document.getElementById("upload-zone");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Scan My Quote Now
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" onClick={handleNoQuote}>
                No Quote Yet? Create Vault
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              Thousands of Florida homeowners scanned this month
            </div>
          </div>

          <Card className="p-6 space-y-3 border-border/40">
            <h3 className="font-semibold text-lg">What you'll get</h3>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-4">
              <li>Final grade (A− to F) + pillar scores</li>
              <li>Hidden fees, commission traps, and scope omissions</li>
              <li>Negotiation bullets tailored to your quote</li>
            </ul>
            <p className="text-xs text-muted-foreground pt-2">
              Security-first Vault access. Email + phone verification required to unlock results.
            </p>
          </Card>
        </div>
      </section>

      {/* Split Conversion Zone */}
      <section className="py-12 px-4 border-t border-border/40" id="upload-zone">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          {/* Flow A */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">I Have a Quote</h2>
              <p className="text-sm text-muted-foreground">PDF or image</p>
            </div>

            <QuoteUploadZone
              onFileSelect={handleFileSelect}
              isAnalyzing={state === SignupState.UPLOADING}
              hasResult={false}
              imagePreview={null}
            />

            {flow === "has_quote" && state !== SignupState.IDLE && (
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
            )}
          </div>

          {/* Flow B */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Don't Have a Quote Yet?</h2>
            <p className="text-sm text-muted-foreground">
              Create your free Vault now and scan later. Takes ~30 seconds.
            </p>

            <div className="space-y-2">
              <Button className="w-full rounded-xl" onClick={handleNoQuote}>
                Create Account &amp; Scan Later
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You'll verify email + phone to activate Vault access. No credit card.
              </p>
            </div>

            {flow === "no_quote" && state === SignupState.QUALIFYING && (
              <QualificationFlow onSubmit={handleQualifySubmit} />
            )}

            {flow === "no_quote" && state === SignupState.REVEAL && flowBResult && (
              <Card className="p-6 space-y-2 border-primary/30">
                <h3 className="text-lg font-bold text-primary">Vault Activated</h3>
                <p className="text-sm text-muted-foreground">{flowBResult.message}</p>
                <p className="text-xs text-muted-foreground">
                  Score: {flowBResult.score} • Event: {flowBResult.event_type} (${flowBResult.event_value})
                </p>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        state={state}
        flow={flow}
        email={profile?.email ?? ""}
        phone={phone ?? ""}
        onSubmitProfile={handleAuthSubmit}
        onSubmitOtp={handleVerifyOtp}
      />

      {/* Final Reveal (Flow A) */}
      {flow === "has_quote" && state === SignupState.REVEAL && analysis?.analysis_json && (
        <section className="py-12 px-4">
          <Card className="mx-auto max-w-3xl p-8 space-y-6">
            <h2 className="text-2xl font-bold">Your Quote Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Rendered directly from analysis_json (no frontend grading logic).
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Final Grade</p>
                <p className="text-5xl font-black">
                  {String(analysis.analysis_json?.finalGrade ?? "—")}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pillar Scores</p>
                <div className="space-y-1">
                  {Object.entries(analysis.analysis_json?.pillarScores ?? {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/40">
        © {new Date().getFullYear()} Window Man • Terms • Privacy
      </footer>
    </div>
  );
}
