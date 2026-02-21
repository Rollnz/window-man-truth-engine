import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PriceAnalysis } from '@/lib/fairPriceCalculations';
import { gradeConfig } from '@/data/fairPriceQuizData';
import { z } from 'zod';
import { FormSurfaceProvider } from '@/components/forms/FormSurfaceProvider';
import { formatPhoneNumber } from '@/hooks/useFormValidation';
import { useFormLock } from '@/hooks/forms';
import { useTickerStats } from '@/hooks/useTickerStats';

interface BlurGateProps {
  analysis: PriceAnalysis;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) => Promise<void>;
}

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().max(50, 'Last name is too long').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().refine(
    (val) => val === '' || val.replace(/\D/g, '').length === 10,
    { message: 'Please enter a valid 10-digit phone number' }
  ),
});

export function BlurGate({ analysis, onSubmit }: BlurGateProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { isLocked, lockAndExecute } = useFormLock();
  const { total } = useTickerStats();
  const gradeInfo = gradeConfig[analysis.grade];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse({ firstName, lastName, email, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = String(err.path[0]);
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    await lockAndExecute(async () => {
      await onSubmit({ firstName, lastName, email, phone });
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background relative">
      {/* Blurred results preview behind modal */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="max-w-lg w-full mx-auto p-8 blur-lg opacity-40 select-none">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-primary mb-2">
              {gradeInfo.label}
            </div>
            <p className="text-xl text-muted-foreground">{gradeInfo.verdict}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Your Quote</p>
              <p className="text-2xl font-bold">$XX,XXX</p>
            </div>
            <div className="bg-card rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Fair Market Value</p>
              <p className="text-2xl font-bold">$XX,XXX - $XX,XXX</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lead capture card - White card trust styling */}
      <div className="relative z-10 max-w-md w-full mx-auto bg-white dark:bg-white border border-slate-200 rounded-xl p-8 shadow-2xl border-t-4 border-t-primary">
        {/* Grade preview (visible) */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="text-2xl">{gradeInfo.emoji}</span>
            <span className="text-lg font-bold text-primary">{gradeInfo.label}</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
          🎯 Your Fair Price Analysis is Ready
        </h2>
        <p className="text-slate-600 text-center mb-6">
          Enter your details to see your detailed breakdown
        </p>

        {/* Wrap form in FormSurfaceProvider for automatic trust styling */}
        <FormSurfaceProvider surface="trust">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: First Name + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="font-semibold text-slate-900">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  aria-required="true"
                  aria-invalid={!!errors.firstName}
                  className={errors.firstName ? 'border-destructive' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="font-semibold text-slate-900">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  className={errors.lastName ? 'border-destructive' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Row 2: Email */}
            <div>
              <Label htmlFor="email" className="font-semibold text-slate-900">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                aria-required="true"
                aria-invalid={!!errors.email}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            {/* Row 3: Phone (optional) */}
            <div>
              <Label htmlFor="phone" className="font-semibold text-slate-900">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                placeholder="(555) 123-4567"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                className={errors.phone ? 'border-destructive' : ''}
              />
              <p className="text-xs text-slate-500 mt-1">
                Phone optional — only needed if you want a 5-minute callback
              </p>
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="cta"
              className="w-full text-lg py-6"
              disabled={isLocked}
            >
              {isLocked ? 'Loading...' : 'See My Results →'}
            </Button>
          </form>
        </FormSurfaceProvider>

        <p className="text-xs text-slate-500 text-center mt-4">
          We'll also email you a copy for your records
        </p>

        {/* Social proof - live ticker */}
        <p className="text-sm text-slate-600 text-center mt-6">
          ✓ {total.toLocaleString()} homeowners analyzed their quotes this month
        </p>
      </div>
    </div>
  );
}
