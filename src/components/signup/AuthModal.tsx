import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SignupFlow, SignupState } from "@/pages/Signup";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Shield } from "lucide-react";
import { formatPhoneDisplay, stripPhone, autoCapitalize } from "@/lib/phone-mask";
import { validateField, validateAll, type ProfileFormErrors } from "@/lib/signup-validation";
import confetti from "canvas-confetti";

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
  const [phone, setPhone] = useState(props.phone ? formatPhoneDisplay(props.phone) : "");
  const [otp, setOtp] = useState("");

  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [shake, setShake] = useState(false);

  const firstNameRef = useRef<HTMLInputElement>(null);

  // Auto-focus first field when modal opens
  useEffect(() => {
    if (open && state !== SignupState.VERIFYING_PHONE) {
      setTimeout(() => firstNameRef.current?.focus(), 100);
    }
  }, [open, state]);

  const handleBlur = useCallback(
    (field: "first_name" | "last_name" | "email" | "phone", value: string) => {
      setTouched((prev) => new Set(prev).add(field));
      const err = validateField(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[field] = err;
        else delete next[field];
        return next;
      });
    },
    []
  );

  const handleChange = useCallback(
    (field: keyof ProfileFormErrors) => {
      if (touched.has(field)) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [touched]
  );

  const headline = useMemo(() => {
    if (state === SignupState.VERIFYING_PHONE) return "Vault Secured";
    return "Create your free login to unlock unlimited audits";
  }, [state]);

  const subhead = useMemo(() => {
    if (state === SignupState.VERIFYING_PHONE) {
      return `Enter the 6-digit code we texted to ${maskPhone(stripPhone(phone))}`;
    }
    if (state === SignupState.VERIFYING_EMAIL) {
      return "Check your inbox for a secure link. Then we'll text your code.";
    }
    return "Security-first access. Email + phone verification required.";
  }, [phone, state]);

  const showOtp = state === SignupState.VERIFYING_PHONE;

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  // Fire confetti on successful OTP (transition away from VERIFYING_PHONE)
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (
      prevStateRef.current === SignupState.VERIFYING_PHONE &&
      state !== SignupState.VERIFYING_PHONE
    ) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#f97316", "#22c55e"],
      });
    }
    prevStateRef.current = state;
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover border-border text-popover-foreground rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{headline}</DialogTitle>
          <div className="text-sm text-muted-foreground mt-1" aria-live="polite">
            {subhead}
          </div>
        </DialogHeader>

        {!showOtp ? (
          <form
            className={`mt-2 space-y-4 ${shake ? "animate-shake" : ""}`}
            onSubmit={async (e) => {
              e.preventDefault();
              const rawPhone = stripPhone(phone);
              const formData = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                phone: rawPhone,
              };
              const validationErrors = validateAll(formData);
              if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                setTouched(new Set(["first_name", "last_name", "email", "phone"]));
                triggerShake();
                return;
              }
              setBusy(true);
              try {
                await onSubmitProfile(formData);
              } finally {
                setBusy(false);
              }
            }}
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="signup-first-name" className="text-muted-foreground">
                  First Name
                </Label>
                <Input
                  ref={firstNameRef}
                  id="signup-first-name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    handleChange("first_name");
                  }}
                  onBlur={() => {
                    setFirstName(autoCapitalize(firstName));
                    handleBlur("first_name", firstName.trim());
                  }}
                  className={`h-11 bg-muted/50 border-input focus-visible:ring-2 focus-visible:ring-ring ${errors.first_name && touched.has("first_name") ? "border-destructive" : ""}`}
                  placeholder="John"
                  autoComplete="given-name"
                  aria-invalid={!!(errors.first_name && touched.has("first_name"))}
                  aria-describedby={errors.first_name ? "err-first-name" : undefined}
                  disabled={busy}
                />
                {errors.first_name && touched.has("first_name") && (
                  <p id="err-first-name" className="text-xs text-destructive" role="alert">
                    {errors.first_name}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="signup-last-name" className="text-muted-foreground">
                  Last Name
                </Label>
                <Input
                  id="signup-last-name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    handleChange("last_name");
                  }}
                  onBlur={() => {
                    setLastName(autoCapitalize(lastName));
                    handleBlur("last_name", lastName.trim());
                  }}
                  className="h-11 bg-muted/50 border-input focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Smith"
                  autoComplete="family-name"
                  disabled={busy}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="signup-email" className="text-muted-foreground">
                Email
              </Label>
              <Input
                id="signup-email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  handleChange("email");
                }}
                onBlur={() => handleBlur("email", email.trim())}
                className={`h-11 bg-muted/50 border-input focus-visible:ring-2 focus-visible:ring-ring ${errors.email && touched.has("email") ? "border-destructive" : ""}`}
                placeholder="you@email.com"
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-invalid={!!(errors.email && touched.has("email"))}
                aria-describedby={errors.email ? "err-email" : undefined}
                disabled={busy}
              />
              {errors.email && touched.has("email") && (
                <p id="err-email" className="text-xs text-destructive" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="signup-phone" className="text-muted-foreground">
                Mobile Number
              </Label>
              <Input
                id="signup-phone"
                value={phone}
                onChange={(e) => {
                  const formatted = formatPhoneDisplay(e.target.value);
                  setPhone(formatted);
                  handleChange("phone");
                }}
                onBlur={() => handleBlur("phone", stripPhone(phone))}
                className={`h-11 bg-muted/50 border-input focus-visible:ring-2 focus-visible:ring-ring ${errors.phone && touched.has("phone") ? "border-destructive" : ""}`}
                placeholder="(555) 123-4567"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={!!(errors.phone && touched.has("phone"))}
                aria-describedby="phone-hint"
                disabled={busy}
              />
              <p id="phone-hint" className="text-xs text-muted-foreground">
                Used for <strong>OTP security</strong> to unlock Vault access.
              </p>
              {errors.phone && touched.has("phone") && (
                <p id="err-phone" className="text-xs text-destructive" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              2,847 Florida homeowners verified this month
            </div>

            <Button
              type="submit"
              disabled={busy || state === SignupState.VERIFYING_EMAIL}
              className="w-full h-11 rounded-xl"
            >
              {state === SignupState.VERIFYING_EMAIL ? (
                "Email sent — check inbox"
              ) : busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </span>
              ) : (
                "Create Account & Verify"
              )}
            </Button>

            {state === SignupState.VERIFYING_EMAIL && (
              <div className="text-xs text-muted-foreground" aria-live="polite">
                After you click the email link, you'll be prompted to enter your SMS code here.
              </div>
            )}
          </form>
        ) : (
          <div className="mt-3 space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <div className="text-sm font-semibold">Decrypt Final Access</div>
              <div className="text-xs text-muted-foreground mt-1">
                Enter your 6-digit code to activate your Vault.
              </div>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                inputMode="numeric"
                autoComplete="one-time-code"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <InputOTPSlot
                      key={idx}
                      index={idx}
                      className="bg-muted/50 border-input text-foreground"
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
              className="w-full h-11 rounded-xl"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </span>
              ) : (
                "Unlock Vault"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
