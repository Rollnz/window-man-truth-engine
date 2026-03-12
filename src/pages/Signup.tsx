import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuoteUploadZone } from "@/components/quote-scanner/QuoteUploadZone";
import { useSessionData } from "@/hooks/useSessionData";
import { useToast } from "@/hooks/use-toast";

import { AuthModal } from "@/components/signup/AuthModal";
import { QuoteAnalysisFlow } from "@/components/signup/QuoteAnalysisFlow";
import { QualificationFlow } from "@/components/signup/QualificationFlow";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Zap } from "lucide-react";
import { formatPhoneDisplay, stripPhone } from "@/lib/phone-mask";

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

// ── localStorage helpers (cross-tab persistent) ────────────────────────
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
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function ssSet(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
function ssDel(key: string) {
  window.localStorage.removeItem(key);
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
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
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

  // Tracks whether we've already triggered SMS in this lifecycle to stay idempotent
  const smsTriggeredRef = useRef(false);

  // Re-enter phone fallback (session active, no phone in storage)
  const [needsReenterPhone, setNeedsReenterPhone] = useState(false);
  const [reenterPhoneValue, setReenterPhoneValue] = useState("");
  const [reenterBusy, setReenterBusy] = useState(false);

  // ── Persist state machine to localStorage ───────────────────────────
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
    setNeedsReenterPhone(false);
    setReenterPhoneValue("");
    smsTriggeredRef.current = false;
    Object.values(SS).forEach(ssDel);
  }, []);

  // ── Scrub auth params from URL after magic-link return ───────────────
  const scrubAuthUrl = useCallback(() => {
    const { href, pathname, search, hash } = window.location;
    if (!search && !hash) return;
    const url = new URL(href);
    const authParamKeys = ["code", "error", "error_description"];
    let modified = false;
    authParamKeys.forEach((key) => {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        modified = true;
      }
    });
    if (hash) {
      url.hash = "";
      modified = true;
    }
    if (!modified) return;
    const qs = url.searchParams.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, []);

  // ── Trigger phone verification SMS (idempotent) ───────────────────────
  const triggerPhoneVerification = useCallback(
    async (storedPhone: string): Promise<boolean> => {
      if (smsTriggeredRef.current) return false;
      smsTriggeredRef.current = true;

      setState(SignupState.VERIFYING_PHONE);
      ssSet(SS.state, SignupState.VERIFYING_PHONE);
      setAuthOpen(true);

      try {
        const { status, errorText } = await callEdgeJson(
          "initiate-lead-verification",
          { phone: storedPhone },
        );

        if (status >= 400) {
          toast({ title: "Verification failed", description: errorText || "Could not send SMS. Please try again.", variant: "destructive" });
          smsTriggeredRef.current = false;
          return false;
        }

        toast({ title: "Code sent", description: "Check your phone for a 6-digit verification code." });
        return true;
      } catch (e: any) {
        toast({ title: "SMS error", description: e?.message || "Please try again.", variant: "destructive" });
        smsTriggeredRef.current = false;
        return false;
      }
    },
    [toast],
  );

  // ── Auth redirect / phone-OTP sequencing ─────────────────────────────
  useEffect(() => {
    // Detect a magic-link return by the presence of auth callback params in the URL
    const hasAuthParams =
      window.location.search.includes("code=") || window.location.hash.length > 1;

    // Check if session already exists on mount (e.g., magic link opened in same/new tab)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      const current = ssGet<SignupState>(SS.state);
      const storedPhone = ssGet<string>(SS.phone);
      scrubAuthUrl();
      if (storedPhone && (current === SignupState.VERIFYING_EMAIL || current === SignupState.AUTH_GATE)) {
        triggerPhoneVerification(storedPhone);
      } else if (!storedPhone && (current === SignupState.VERIFYING_EMAIL || hasAuthParams)) {
        // Session active but no phone stored — device/tab handoff case
        setNeedsReenterPhone(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" && event !== "TOKEN_REFRESHED") return;
      if (!session?.user) return;

      const current = ssGet<SignupState>(SS.state);
      const storedPhone = ssGet<string>(SS.phone);
      scrubAuthUrl();

      if (storedPhone && (current === SignupState.VERIFYING_EMAIL || current === SignupState.AUTH_GATE)) {
        await triggerPhoneVerification(storedPhone);
      } else if (!storedPhone && (current === SignupState.VERIFYING_EMAIL || event === "SIGNED_IN")) {
        // SIGNED_IN from a fresh magic-link with no storage → cross-device handoff
        setNeedsReenterPhone(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [scrubAuthUrl, triggerPhoneVerification]);

  // ── Resend SMS ───────────────────────────────────────────────────────
  const handleResendSms = useCallback(async () => {
    const storedPhone = phone ?? ssGet<string>(SS.phone);
    if (!storedPhone) return;
    smsTriggeredRef.current = false; // allow re-trigger
    const ok = await triggerPhoneVerification(storedPhone);
    if (!ok) throw new Error("SMS send failed");
  }, [phone, triggerPhoneVerification]);

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
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
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
        // TESTING MODE: Send email in background but don't block on it
        supabase.auth.signInWithOtp({ email: payload.email, options: { emailRedirectTo: redirectUrl } });

        // Skip VERIFYING_EMAIL — go straight to phone verification
        await triggerPhoneVerification(payload.phone);
        toast({ title: "TESTING MODE", description: "Email sent in background. Skipping email gate." });
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
      const storedPhone = phone ?? ssGet<string>(SS.phone);
      if (!storedPhone) {
        toast({ title: "Error", description: "Phone number not found. Please start over.", variant: "destructive" });
        return;
      }

      try {
        const { status, data, errorText } = await callEdgeJson<{ valid: boolean; status: string }>(
          "verify-otp",
          { phone: storedPhone, code: token },
        );

        if (status >= 400 || !data?.valid) {
          throw new Error(errorText || "Invalid or expired code. Please try again.");
        }

        // OTP approved — update accounts.phone_verified_at via save-lead or directly
        ssDel(SS.state);
        ssDel(SS.phone);
        ssDel(SS.profile);

        setAuthOpen(false);
        setNeedsReenterPhone(false);
        toast({ title: "Phone verified", description: "Your number has been confirmed." });
        setState(flow === "has_quote" ? SignupState.POLLING_ANALYSIS : SignupState.QUALIFYING);
      } catch (e: any) {
        toast({ title: "Verification failed", description: e?.message || "Please try again.", variant: "destructive" });
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
        onResendSms={handleResendSms}
      />

      {/* Continue Verification CTA — shown when modal was closed during phone step */}
      {state === SignupState.VERIFYING_PHONE && !authOpen && !needsReenterPhone && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            size="lg"
            className="rounded-xl shadow-lg"
            onClick={() => setAuthOpen(true)}
          >
            Continue Verification →
          </Button>
        </div>
      )}

      {/* Re-enter Phone — session active but phone missing (cross-device handoff) */}
      {needsReenterPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold">Re-enter Your Phone Number</h3>
            <p className="text-sm text-muted-foreground">
              We couldn't find your phone number in this browser. Enter it again to receive your verification code.
            </p>
            <div className="space-y-1">
              <Label htmlFor="reenter-phone">Mobile Number</Label>
              <Input
                id="reenter-phone"
                value={reenterPhoneValue}
                onChange={(e) => setReenterPhoneValue(formatPhoneDisplay(e.target.value))}
                placeholder="(555) 123-4567"
                inputMode="tel"
                autoComplete="tel"
                disabled={reenterBusy}
              />
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={reenterBusy || stripPhone(reenterPhoneValue).length < 10}
              onClick={async () => {
                const stripped = stripPhone(reenterPhoneValue);
                setPhone(stripped);
                ssSet(SS.phone, stripped);
                setReenterBusy(true);
                setNeedsReenterPhone(false);
                smsTriggeredRef.current = false;
                await triggerPhoneVerification(stripped);
                setReenterBusy(false);
              }}
            >
              Send Verification Code
            </Button>
          </Card>
        </div>
      )}

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
