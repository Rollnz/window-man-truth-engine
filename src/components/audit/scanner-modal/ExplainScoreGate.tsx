// ═══════════════════════════════════════════════════════════════════════════
// ExplainScoreGate - Lead capture with "See How This Score Was Calculated"
// Uses exact copy from spec - no dynamic text
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { Loader2, Lock, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NameInputPair } from '@/components/ui/NameInputPair';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { ExplainScoreFormData } from '@/types/audit';

interface ExplainScoreGateProps {
  onSubmit: (data: ExplainScoreFormData) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Lead capture gate with exact copy:
 * - Headline: "See How This Score Was Calculated"
 * - Sub-headline: "We'll break down exactly what was missing..."
 * - CTA: "Unlock My Full Report"
 */
export function ExplainScoreGate({ onSubmit, isLoading = false }: ExplainScoreGateProps) {
  const { values, errors, setValue, handleBlur, validateAll, clearErrors } = useFormValidation({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    schemas: {
      firstName: commonSchemas.firstName,
      email: commonSchemas.email,
    },
    formatters: {
      phone: formatPhoneNumber,
    },
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = validateAll();
    if (!isValid) return;

    await onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
    });
  }, [values, validateAll, onSubmit]);

  return (
    <div className="px-6 py-8">
      {/* Header with Lock Icon */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-orange-400" />
        </div>
        
        {/* EXACT COPY - DO NOT MODIFY */}
        <h2 className="text-2xl font-bold text-white mb-3">
          See How This Score Was Calculated
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          We'll break down exactly what was missing, why it matters in Florida, 
          and how it affects your real cost and risk.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto">
        {/* Name Fields (2x2 grid) */}
        <NameInputPair
          firstName={values.firstName}
          lastName={values.lastName}
          onFirstNameChange={(val) => {
            setValue('firstName', val);
          }}
          onLastNameChange={(val) => setValue('lastName', val)}
          onFirstNameBlur={() => handleBlur('firstName')}
          errors={{
            firstName: errors.firstName,
            lastName: errors.lastName,
          }}
          disabled={isLoading}
          autoFocus
          className="[&_label]:text-white [&_input]:bg-white [&_input]:text-slate-900 [&_input]:border-slate-300"
        />

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="gate-email" className="text-white font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-400" />
            Email Address *
          </Label>
          <Input
            id="gate-email"
            type="email"
            autoComplete="email"
            placeholder="john@example.com"
            value={values.email}
            onChange={(e) => setValue('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            disabled={isLoading}
            className={cn(
              "h-10 bg-white text-slate-900 border-slate-300",
              errors.email && "border-destructive focus-visible:ring-destructive"
            )}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="gate-phone" className="text-white font-semibold flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" />
            Phone Number
          </Label>
          <Input
            id="gate-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(555) 123-4567"
            value={values.phone}
            onChange={(e) => setValue('phone', e.target.value)}
            disabled={isLoading}
            className="h-10 bg-white text-slate-900 border-slate-300"
          />
        </div>

        {/* Micro-trust copy - EXACT TEXT */}
        <div className="text-xs text-slate-500 leading-relaxed space-y-1">
          <p>
            Your report is saved to your WindowMan Vault so you can come back to it anytime.
          </p>
          <p>
            We only use your info to deliver the analysis and offer expert help if you want it.
          </p>
        </div>

        {/* CTA Button - EXACT TEXT */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Unlocking...
            </>
          ) : (
            'Unlock My Full Report'
          )}
        </Button>

        {/* Optional micro-line */}
        <p className="text-center text-xs text-slate-600">
          No pressure. No obligation. No spam.
        </p>
      </form>
    </div>
  );
}

export default ExplainScoreGate;
