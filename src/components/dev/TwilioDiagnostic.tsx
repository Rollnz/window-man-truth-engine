import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Activity } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const DEFAULT_PHONE = '+12038567938';
const PROJECT_ID = 'kffoximblqwcnznwvugu';

const DEEP_LINKS = {
  auth: `https://supabase.com/dashboard/project/${PROJECT_ID}/auth/providers`,
  tables: `https://supabase.com/dashboard/project/${PROJECT_ID}/editor`,
  storage: `https://supabase.com/dashboard/project/${PROJECT_ID}/storage/buckets/quotes`,
} as const;

type HealthStatus = 'idle' | 'ok' | 'fail';
type SmsStep = 'idle' | 'sending' | 'otp' | 'verifying' | 'verified';

const LED_COLORS: Record<HealthStatus, string> = {
  idle: 'bg-muted-foreground/40',
  ok: 'bg-emerald-500',
  fail: 'bg-destructive',
};

function Led({ status, label }: { status: HealthStatus; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className={`inline-block h-2 w-2 rounded-full ${LED_COLORS[status]}`} />
      {label}
    </span>
  );
}

function isDevEnvironment(): boolean {
  const host = window.location.hostname;
  return host === 'localhost' || host.endsWith('.lovable.app');
}

function DevHealthSuiteInner() {
  const [health, setHealth] = useState<{ db: HealthStatus; storage: HealthStatus; auth: HealthStatus }>({
    db: 'idle', storage: 'idle', auth: 'idle',
  });
  const [smsStep, setSmsStep] = useState<SmsStep>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [testPhone, setTestPhone] = useState(DEFAULT_PHONE);
  const [expanded, setExpanded] = useState(false);

  const toastError = (msg: string, link?: string) => {
    toast.error(msg, link ? {
      action: { label: 'Fix it here', onClick: () => window.open(link, '_blank') },
    } : undefined);
  };

  const runSmokeTest = useCallback(async () => {
    // DB
    try {
      const { error } = await supabase.from('accounts').select('id').limit(1);
      if (error) throw error;
      const { error: e2 } = await supabase.from('pending_scans').select('scan_uuid').limit(1);
      if (e2) throw e2;
      setHealth(h => ({ ...h, db: 'ok' }));
    } catch {
      setHealth(h => ({ ...h, db: 'fail' }));
      toastError('DB Smoke Test Failed: Check table access/RLS.', DEEP_LINKS.tables);
    }

    // Storage
    try {
      const { error } = await supabase.storage.from('quotes').list('', { limit: 1 });
      if (error) throw error;
      setHealth(h => ({ ...h, storage: 'ok' }));
    } catch {
      setHealth(h => ({ ...h, storage: 'fail' }));
      toastError('Storage Smoke Test Failed: Check "quotes" bucket.', DEEP_LINKS.storage);
    }

    // Auth
    try {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      setHealth(h => ({ ...h, auth: 'ok' }));
    } catch {
      setHealth(h => ({ ...h, auth: 'fail' }));
      toastError('Auth Smoke Test Failed: Check provider config.', DEEP_LINKS.auth);
    }
  }, []);

  useEffect(() => {
    runSmokeTest();
  }, [runSmokeTest]);

  const handleSendSms = async () => {
    setSmsStep('sending');
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: testPhone });
      if (error) {
        const status = (error as any).status ?? '???';
        const raw = error.message;
        const msg = raw.toLowerCase();
        if (msg.includes('credentials') || msg.includes('sid') || msg.includes('authenticate')) {
          toastError(`[${status}] Twilio Auth Failed: Check Account SID/Token. Raw: ${raw}`, DEEP_LINKS.auth);
        } else if (msg.includes('unverified') || msg.includes('not a valid')) {
          toastError(`[${status}] Twilio Trial: Number isn't verified. Raw: ${raw}`, DEEP_LINKS.auth);
        } else if (msg.includes('provider') && msg.includes('not enabled')) {
          toastError(`[${status}] Phone provider not enabled. Raw: ${raw}`, DEEP_LINKS.auth);
        } else if (msg.includes('service provider') || msg.includes('unable to get')) {
          toastError(`[${status}] Unable to reach SMS provider. Check Twilio Verify Service SID field (not Messaging SID). Raw: ${raw}`, DEEP_LINKS.auth);
        } else {
          toastError(`[${status}] ${raw}`, DEEP_LINKS.auth);
        }
        setSmsStep('idle');
        return;
      }
      toast.success(`SMS sent to ${testPhone}. Enter the 6-digit code.`);
      setSmsStep('otp');
    } catch (e: any) {
      toastError(e?.message ?? 'Unknown error');
      setSmsStep('idle');
    }
  };

  const handleVerifyOtp = async (token: string) => {
    setSmsStep('verifying');
    try {
      const { error } = await supabase.auth.verifyOtp({ phone: testPhone, token, type: 'sms' });
      if (error) {
        toastError(`OTP Verify Failed: ${error.message}`, DEEP_LINKS.auth);
        setSmsStep('otp');
        return;
      }
      toast.success('🎉 FULL LOOP VERIFIED: 100% Ready.');
      setSmsStep('verified');
    } catch (e: any) {
      toastError(e?.message ?? 'Verification error');
      setSmsStep('otp');
    }
  };

  const handleOtpComplete = (value: string) => {
    setOtpCode(value);
    if (value.length === 6) {
      handleVerifyOtp(value);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-1.5">
      {expanded && (
        <div className="rounded-lg border border-border/40 bg-muted/80 p-3 backdrop-blur-md shadow-lg w-64 space-y-3">
          {/* LEDs */}
          <div className="flex items-center gap-3">
            <Led status={health.db} label="DB" />
            <Led status={health.storage} label="Store" />
            <Led status={health.auth} label="Auth" />
            <button
              onClick={runSmokeTest}
              className="ml-auto text-[10px] text-muted-foreground underline hover:text-foreground"
            >
              Re-check
            </button>
          </div>

          {/* SMS Full Loop */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-foreground">Full Loop SMS Test</p>

            {smsStep === 'idle' && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground">Test Number</label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full rounded-md border border-border/40 bg-background/60 px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="+1XXXXXXXXXX"
                />
                <button
                  onClick={handleSendSms}
                  disabled={!testPhone.trim()}
                  className="w-full rounded-md border border-border/40 bg-background/60 px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-background hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Send Test SMS → {testPhone}
                </button>
              </div>
            )}

            {smsStep === 'sending' && (
              <p className="text-[11px] text-muted-foreground animate-pulse">Sending SMS…</p>
            )}

            {smsStep === 'otp' && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground">Enter the 6-digit code:</p>
                <InputOTP maxLength={6} value={otpCode} onChange={handleOtpComplete}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            {smsStep === 'verifying' && (
              <p className="text-[11px] text-muted-foreground animate-pulse">Verifying…</p>
            )}

            {smsStep === 'verified' && (
              <p className="text-[11px] text-primary font-medium">✅ Full Loop Verified</p>
            )}
          </div>
        </div>
      )}

      {/* Toggle pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/60 px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <Activity className="h-3 w-3" />
        <span>Dev Health Suite</span>
        <span className="flex items-center gap-0.5 ml-1">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${LED_COLORS[health.db]}`} />
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${LED_COLORS[health.storage]}`} />
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${LED_COLORS[health.auth]}`} />
        </span>
      </button>
    </div>
  );
}

export function TwilioDiagnostic() {
  if (!isDevEnvironment()) return null;
  return <DevHealthSuiteInner />;
}
