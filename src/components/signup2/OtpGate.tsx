import { useState, useCallback, useEffect, useRef } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { NOIR, EASE_EXPO_OUT, DURATION } from '@/lib/motion-tokens';
import { Lock } from 'lucide-react';

interface OtpGateProps {
  phone: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isVerifying: boolean;
  error: string | null;
}

export function OtpGate({ phone, onVerify, onResend, isVerifying, error }: OtpGateProps) {
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const [shaking, setShaking] = useState(false);
  const cooldownRef = useRef<number | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) window.clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cooldownRef.current) window.clearInterval(cooldownRef.current);
    };
  }, [cooldown]);

  // Error shake
  useEffect(() => {
    if (error) {
      setShaking(true);
      const t = window.setTimeout(() => setShaking(false), 300);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Auto-submit on 6 digits
  useEffect(() => {
    if (code.length === 6) {
      onVerify(code);
    }
  }, [code, onVerify]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    await onResend();
    setCooldown(60);
  }, [cooldown, onResend]);

  const maskedPhone = phone.length >= 4 ? `(•••) •••-${phone.slice(-4)}` : phone;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,20,25,0.92)', backdropFilter: 'blur(22px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-6 text-center"
        style={{
          background: NOIR.glass,
          border: `1px solid ${NOIR.glassBorder}`,
          backdropFilter: 'blur(24px)',
          animation: `otpEnter ${DURATION.slow}s ${EASE_EXPO_OUT} forwards`,
        }}
      >
        {/* Lock icon */}
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${NOIR.cyan}12`, border: `1px solid ${NOIR.cyan}25` }}>
          <Lock className="w-6 h-6" style={{ color: NOIR.cyan }} />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-white">Verify Your Phone</h2>
          <p className="text-xs text-white/50">
            Enter the 6-digit code sent to {maskedPhone}
          </p>
        </div>

        {/* OTP Input */}
        <div
          className={`flex justify-center ${shaking ? 'animate-shake' : ''}`}
          style={shaking ? { animation: `otpShake 260ms ease-out` } : {}}
        >
          <InputOTP maxLength={6} value={code} onChange={setCode} disabled={isVerifying}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="w-11 h-12 text-lg bg-white/5 border-white/15 text-white"
                  style={{
                    transition: `transform 80ms ${EASE_EXPO_OUT}, border-color ${DURATION.fast}s`,
                    borderColor: error ? '#ef4444' : undefined,
                  }}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Error */}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Resend */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={cooldown > 0 || isVerifying}
          className="text-xs text-white/50 hover:text-white"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </Button>

        <p className="text-[9px] font-mono text-white/20">SECURE VERIFICATION • AES-256</p>
      </div>

      <style>{`
        @keyframes otpEnter {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes otpShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-4px); }
          30% { transform: translateX(4px); }
          50% { transform: translateX(-2px); }
          70% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
