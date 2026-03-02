import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionData } from '@/hooks/useSessionData';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';
import { stripPhone } from '@/lib/phone-mask';
import { NOIR, EASE_EXPO_OUT, DURATION } from '@/lib/motion-tokens';

import { Signup2Form } from '@/components/signup2/Signup2Form';
import { ExtractionTheater } from '@/components/signup2/ExtractionTheater';
import { OtpGate } from '@/components/signup2/OtpGate';
import { AuditReveal } from '@/components/signup2/AuditReveal';
import { SystemStatusPanel } from '@/components/signup2/SystemStatusPanel';

// ── Types ──────────────────────────────────────────────────────────────
type Phase = 'FORM' | 'UPLOADING' | 'THEATER' | 'OTP_GATE' | 'REVEAL';

type SaveLeadResponse = { leadId: string };
type UploadQuoteResponse = { pending_scan_uuid?: string; quote_analysis_id?: string; file_id?: string; success: boolean };
type OrchestrateResponse = { success: boolean; quote_analysis_id: string; analyzed_at: string | null; analysis_json: any };

// ── localStorage helpers ───────────────────────────────────────────────
const LS = {
  phase: 'wm.signup2.phase',
  accountId: 'wm.signup2.account_id',
  scanId: 'wm.signup2.scan_id',
  phone: 'wm.signup2.phone',
  email: 'wm.signup2.email',
} as const;

function lsGet<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
function lsSet(key: string, value: unknown) { window.localStorage.setItem(key, JSON.stringify(value)); }
function lsDel(key: string) { window.localStorage.removeItem(key); }

// ── Edge-function caller ───────────────────────────────────────────────
async function callEdge<T>(fnName: string, body: unknown, token?: string | null): Promise<{ status: number; data?: T; errorText?: string }> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* noop */ }
  if (!res.ok) return { status: res.status, errorText: json?.error || json?.message || res.statusText };
  return { status: res.status, data: json as T };
}

// ── Main Component ─────────────────────────────────────────────────────
export default function Signup2() {
  const { toast } = useToast();
  const { sessionId, sessionData, updateFields } = useSessionData();

  const [phase, setPhase] = useState<Phase>(() => lsGet<Phase>(LS.phase) ?? 'FORM');
  const [accountId, setAccountId] = useState<string | null>(() => lsGet<string>(LS.accountId));
  const [scanId, setScanId] = useState<string | null>(() => lsGet<string>(LS.scanId));
  const [phone, setPhone] = useState<string>(() => lsGet<string>(LS.phone) ?? '');
  const [email, setEmail] = useState<string>(() => lsGet<string>(LS.email) ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<OrchestrateResponse | null>(null);
  const [metadata, setMetadata] = useState<{ contractor?: string; openings?: number; total?: string } | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const pollingRef = useRef(false);
  const theaterDone = useRef(false);

  // Persist
  useEffect(() => { lsSet(LS.phase, phase); }, [phase]);
  useEffect(() => { if (accountId) lsSet(LS.accountId, accountId); }, [accountId]);
  useEffect(() => { if (scanId) lsSet(LS.scanId, scanId); }, [scanId]);
  useEffect(() => { if (phone) lsSet(LS.phone, phone); }, [phone]);
  useEffect(() => { if (email) lsSet(LS.email, email); }, [email]);

  const resetAll = useCallback(() => {
    setPhase('FORM');
    setAccountId(null);
    setScanId(null);
    setPhone('');
    setEmail('');
    setIsSubmitting(false);
    setOtpVerified(false);
    setAnalysisReady(false);
    setAnalysisResult(null);
    setMetadata(null);
    setOtpError(null);
    pollingRef.current = false;
    theaterDone.current = false;
    Object.values(LS).forEach(lsDel);
  }, []);

  // ── FORM submit ──────────────────────────────────────────────────────
  const handleFormSubmit = useCallback(
    async (data: { first_name: string; last_name: string; email: string; phone: string }, file: File) => {
      setIsSubmitting(true);
      const cleanPhone = stripPhone(data.phone);
      setPhone(cleanPhone);
      setEmail(data.email);

      try {
        // 1. Save lead
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token ?? null;

        const { status, data: leadData, errorText } = await callEdge<SaveLeadResponse>('save-lead', {
          sourceTool: 'signup2',
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email || undefined,
          phone: cleanPhone,
          metadata: { flow: 'signup2', page: '/signup2' },
        }, token);

        if (status >= 400 || !leadData?.leadId) throw new Error(errorText || 'Failed to save lead');
        setAccountId(leadData.leadId);
        updateFields({ firstName: data.first_name, lastName: data.last_name, email: data.email, phone: cleanPhone, leadId: leadData.leadId });
        trackEvent('wm_lead', { source_tool: 'signup2', lead_id: leadData.leadId });

        // 2. Upload file
        setPhase('UPLOADING');
        const uploadUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-quote`;
        const form = new FormData();
        form.append('file', file);
        form.append('session_id', sessionId);
        form.append('source_page', '/signup2');
        form.append('lead_id', leadData.leadId);

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: form,
        });
        const uploadJson = (await uploadRes.json()) as UploadQuoteResponse;
        if (!uploadRes.ok || !uploadJson?.success) throw new Error('Upload failed');

        const id = uploadJson.pending_scan_uuid || uploadJson.quote_analysis_id || uploadJson.file_id || null;
        if (!id) throw new Error('No scan ID returned');
        setScanId(id);
        trackEvent('wm_scanner_upload', { source_tool: 'signup2', scan_id: id });

        // 3. Transition to THEATER + start polling
        setPhase('THEATER');
        startPolling(leadData.leadId, id);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Please try again.';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        setPhase('FORM');
      } finally {
        setIsSubmitting(false);
      }
    },
    [sessionId, toast, updateFields],
  );

  // ── Polling ──────────────────────────────────────────────────────────
  const startPolling = useCallback((acctId: string, qaId: string) => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    const poll = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token ?? null;
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrate-quote-analysis`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ account_id: acctId, quote_analysis_id: qaId }),
        });

        if (res.status === 409) {
          // Not ready — retry
          window.setTimeout(poll, 3000);
          return;
        }

        const json = (await res.json()) as OrchestrateResponse;
        if (res.ok && json?.analysis_json) {
          // Extract metadata for theater
          const aj = json.analysis_json;
          setMetadata({
            contractor: aj.extractedIdentity?.contractorName || aj.contractor,
            openings: aj.extractedIdentity?.openingsCount ?? aj.openings,
            total: aj.extractedIdentity?.totalPrice ?? aj.total,
          });
          setAnalysisResult(json);
          setAnalysisReady(true);
        } else {
          // Keep polling
          window.setTimeout(poll, 3000);
        }
      } catch {
        window.setTimeout(poll, 5000);
      }
    };

    poll();
  }, []);

  // ── Theater complete → OTP_GATE ──────────────────────────────────────
  // ── TESTING MODE: Skip OTP_GATE, auto-verify ──────────────────
  const handleTheaterComplete = useCallback(() => {
    theaterDone.current = true;
    setOtpVerified(true);
    trackEvent('wm_phone_verified', { source_tool: 'signup2', testing_mode: true });
    // If analysis is already ready, go straight to REVEAL; otherwise wait
    if (analysisReady) {
      setPhase('REVEAL');
      trackEvent('wm_audit_revealed', { source_tool: 'signup2' });
    } else {
      setPhase('OTP_GATE'); // will auto-transition via the existing useEffect
    }
  }, [analysisReady]);

  // ── OTP verify ───────────────────────────────────────────────────────
  // ── TESTING MODE: Auto-accept any OTP code ────────────────────
  const handleVerifyOtp = useCallback(async (_code: string) => {
    setIsVerifyingOtp(true);
    setOtpError(null);
    setOtpVerified(true);
    trackEvent('wm_phone_verified', { source_tool: 'signup2', testing_mode: true });
    setIsVerifyingOtp(false);
  }, []);

  // ── OTP resend ───────────────────────────────────────────────────────
  const handleResendOtp = useCallback(async () => {
    const e164 = phone.length === 10 ? `+1${phone}` : `+${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    if (error) {
      toast({ title: 'Resend failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Code resent' });
    }
  }, [phone, toast]);

  // ── Transition to REVEAL when both gates met ─────────────────────────
  useEffect(() => {
    if (otpVerified && analysisReady && phase === 'OTP_GATE') {
      setPhase('REVEAL');
      trackEvent('wm_audit_revealed', { source_tool: 'signup2' });
    }
  }, [otpVerified, analysisReady, phase]);

  // ── If resuming at OTP_GATE, resend OTP and restart polling ──────────
  useEffect(() => {
    if (phase === 'OTP_GATE' && accountId && scanId && !pollingRef.current) {
      startPolling(accountId, scanId);
    }
  }, [phase, accountId, scanId, startPolling]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: NOIR.void, color: '#fff' }}>
      {/* Noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: `${NOIR.void}cc`, borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2 text-sm font-bold">
            <Shield className="h-4 w-4" style={{ color: NOIR.cyan }} />
            WINDOW MAN
          </a>
          <Button variant="ghost" size="sm" className="text-xs text-white/40" onClick={resetAll}>
            Reset
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 grid gap-6 lg:grid-cols-12">
        {/* Left — Workflow (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Hero */}
          <div
            className="space-y-3"
            style={{ animation: `fadeUp ${DURATION.cinematic}s ${EASE_EXPO_OUT} forwards` }}
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Get Your Free <span style={{ color: NOIR.cyan }}>Window Audit</span>
            </h1>
            <p className="text-sm text-white/50 max-w-md">
              Upload your contractor quote. Our AI scans for overpricing, scope gaps, and hidden clauses — verified by phone.
            </p>
          </div>

          {/* Phase content */}
          <div
            className="rounded-xl p-5 sm:p-6"
            style={{
              background: NOIR.glass,
              border: `1px solid ${NOIR.glassBorder}`,
              backdropFilter: 'blur(16px)',
            }}
          >
            {phase === 'FORM' && (
              <Signup2Form onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
            )}

            {phase === 'UPLOADING' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: NOIR.cyan, borderTopColor: 'transparent' }} />
                <p className="text-sm text-white/60">Uploading document…</p>
              </div>
            )}

            {phase === 'THEATER' && (
              <ExtractionTheater metadata={metadata} onComplete={handleTheaterComplete} />
            )}

            {phase === 'REVEAL' && analysisResult?.analysis_json && (
              <AuditReveal
                analysisJson={analysisResult.analysis_json}
                hasEmail={!!email}
                onUploadNew={resetAll}
              />
            )}

            {phase === 'OTP_GATE' && !otpVerified && !analysisReady && (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-white/50">Finalizing extraction…</p>
                <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: NOIR.cyan, borderTopColor: 'transparent' }} />
              </div>
            )}

            {phase === 'OTP_GATE' && otpVerified && !analysisReady && (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm" style={{ color: '#10b981' }}>✓ Phone verified</p>
                <p className="text-sm text-white/50">Waiting for analysis to complete…</p>
                <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: NOIR.cyan, borderTopColor: 'transparent' }} />
              </div>
            )}
          </div>
        </div>

        {/* Right — Status Panel (5 cols) */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <SystemStatusPanel phase={phase} />
          </div>
        </div>
      </div>

      {/* OTP Gate Overlay */}
      {phase === 'OTP_GATE' && !otpVerified && (
        <OtpGate
          phone={phone}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          isVerifying={isVerifyingOtp}
          error={otpError}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-[10px] font-mono text-white/20 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        © {new Date().getFullYear()} WINDOW MAN • ENCRYPTED • VERIFIED
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
