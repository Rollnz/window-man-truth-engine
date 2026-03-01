import React, { useMemo, useState } from "react";
import { SignupFlow, SignupState } from "@/pages/Signup";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

function maskPhone(phone: string) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `***-***-${digits.slice(-4)}`;
}

export function AuthModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  state: SignupState;
  flow: SignupFlow;

  email: string;
  phone: string;

  onSubmitProfile: (p: { first_name: string; last_name: string; email: string; phone: string }) => Promise<void>;
  onSubmitOtp: (token: string) => Promise<void>;
}) {
  const { open, onOpenChange, state, flow, onSubmitProfile, onSubmitOtp } = props;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(props.email ?? "");
  const [phone, setPhone] = useState(props.phone ?? "");
  const [otp, setOtp] = useState("");

  const [busy, setBusy] = useState(false);

  const headline = useMemo(() => {
    if (state === SignupState.VERIFYING_PHONE) return "Vault Secured";
    if (flow === "has_quote") return "Create your free Vault to unlock your grade";
    return "Create your free Vault (scan later)";
  }, [flow, state]);

  const subhead = useMemo(() => {
    if (state === SignupState.VERIFYING_PHONE) {
      return `Enter the 6-digit code we texted to ${maskPhone(phone)}`;
    }
    if (state === SignupState.VERIFYING_EMAIL) {
      return `Check your inbox for a secure link. Then we’ll text your code.`;
    }
    return "Security-first access. Email + phone verification required.";
  }, [phone, state]);

  const showOtp = state === SignupState.VERIFYING_PHONE;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{headline}</DialogTitle>
          <div className="text-sm text-white/70 mt-1">{subhead}</div>
        </DialogHeader>

        {!showOtp ? (
          <form
            className="mt-2 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await onSubmitProfile({
                  first_name: firstName.trim(),
                  last_name: lastName.trim(),
                  email: email.trim(),
                  phone: phone.trim(),
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-white/80">First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-white/5 border-white/10 focus-visible:ring-orange-400"
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/80">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-white/5 border-white/10 focus-visible:ring-orange-400"
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-white/80">Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 focus-visible:ring-orange-400"
                placeholder="you@email.com"
                type="email"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-white/80">Mobile Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white/5 border-white/10 focus-visible:ring-orange-400"
                placeholder="+1 954 555 1234"
                required
                autoComplete="tel"
              />
              <div className="text-xs text-white/55">
                Used for **OTP security** to unlock Vault access.
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy || state === SignupState.VERIFYING_EMAIL}
              className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
            >
              {state === SignupState.VERIFYING_EMAIL ? "Email sent — check inbox" : busy ? "Creating…" : "Create Account & Verify"}
            </Button>

            {state === SignupState.VERIFYING_EMAIL && (
              <div className="text-xs text-white/60">
                After you click the email link, you’ll be prompted to enter your SMS code here.
              </div>
            )}
          </form>
        ) : (
          <div className="mt-3 space-y-4">
            <div className="rounded-2xl border border-blue-200/15 bg-blue-500/10 p-4">
              <div className="text-sm font-semibold">Decrypt Final Access</div>
              <div className="text-xs text-white/70 mt-1">
                Enter your 6-digit code to activate your Vault.
              </div>
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <InputOTPSlot
                      key={idx}
                      index={idx}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={async () => {
                if (otp.length !== 6) return;
                setBusy(true);
                try {
                  await onSubmitOtp(otp);
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy || otp.length !== 6}
              className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
            >
              {busy ? "Verifying…" : "Unlock Vault"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
