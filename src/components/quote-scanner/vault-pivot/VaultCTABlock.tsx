import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { useState } from 'react';

interface VaultCTABlockProps {
  /** Mock callback for demo - will be replaced with real auth */
  onGoogleAuth?: () => void;
  onEmailSubmit?: (data: { firstName: string; lastName: string; email: string }) => void;
  isLoading?: boolean;
}

/**
 * VaultCTABlock
 * Primary conversion engine with pulsing CTA button,
 * "Memory Protection Active" status, and email fallback form.
 * Theme-locked to dark for Blueprint Breakout section.
 */
export function VaultCTABlock({ 
  onGoogleAuth, 
  onEmailSubmit,
  isLoading = false 
}: VaultCTABlockProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Unified validation with Zod schemas
  const { values, setValue, validateAll, hasError, getError } = useFormValidation({
    initialValues: { firstName: '', lastName: '', email: '' },
    schemas: {
      firstName: commonSchemas.firstName,
      lastName: commonSchemas.required('Last name is required'),
      email: commonSchemas.email,
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    onEmailSubmit?.(values);
  };

  // Form is valid when all required fields have content
  const isFormValid = values.firstName.trim() && values.lastName.trim() && values.email.trim();

  return (
    <div className="mt-12 text-center">
      {/* Simplicity Anchor */}
      <p className="text-sm text-slate-400 mb-4">
        No decisions yet. Just saving your place.
      </p>

      {/* Memory Protection Status - "Smooth Criminal" trust pixel */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-sm text-slate-400">Memory Protection Active</span>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      </div>

      {/* Primary CTA - Pulsing Glow */}
      <Button
        onClick={onGoogleAuth}
        disabled={isLoading}
        size="lg"
        className={cn(
          'w-full md:w-auto md:min-w-[360px] h-16 text-lg font-bold',
          'bg-sky-500 hover:bg-sky-400 text-white',
          'shadow-[0_0_30px_rgba(14,165,233,0.4)]',
          'animate-[pulse-glow-cta_2.5s_ease-in-out_infinite]',
          'transition-all duration-200'
        )}
        style={{
          // Inline animation as fallback
          animation: 'pulse-glow-cta 2.5s ease-in-out infinite',
        }}
      >
        <Lock className="w-5 h-5 mr-2" />
        ENTER MY WINDOW VAULT
      </Button>

      {/* Email Fallback Toggle */}
      <button
        onClick={() => setShowEmailForm(!showEmailForm)}
        className="flex items-center justify-center gap-1 mx-auto mt-6 text-sm text-slate-400 hover:text-slate-300 transition-colors"
      >
        <Mail className="w-4 h-4" />
        Or continue with email
        {showEmailForm ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Email Fallback Form */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          showEmailForm ? 'max-h-[300px] opacity-100 mt-6' : 'max-h-0 opacity-0'
        )}
      >
        <form 
          onSubmit={handleEmailSubmit}
          className="max-w-md mx-auto space-y-4 p-6 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={values.firstName}
                onChange={(e) => setValue('firstName', e.target.value)}
                className={cn(
                  "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500",
                  hasError('firstName') && 'border-red-500'
                )}
                required
              />
              {hasError('firstName') && (
                <p className="text-xs text-red-400">{getError('firstName')}</p>
              )}
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={values.lastName}
                onChange={(e) => setValue('lastName', e.target.value)}
                className={cn(
                  "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500",
                  hasError('lastName') && 'border-red-500'
                )}
                required
              />
              {hasError('lastName') && (
                <p className="text-xs text-red-400">{getError('lastName')}</p>
              )}
            </div>
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              className={cn(
                "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500",
                hasError('email') && 'border-red-500'
              )}
              placeholder="you@example.com"
              required
            />
            {hasError('email') && (
              <p className="text-xs text-red-400">{getError('email')}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white"
          >
            Continue with Email
          </Button>
        </form>
      </div>

      {/* Final Assurance */}
      <p className="text-xs text-slate-500 mt-8 max-w-sm mx-auto">
        Free forever. Takes 10 seconds. We never sell or share your data.
      </p>

      {/* Inline keyframes for pulse-glow-cta */}
      <style>{`
        @keyframes pulse-glow-cta {
          0%, 100% { box-shadow: 0 0 25px rgba(14,165,233,0.3); }
          50% { box-shadow: 0 0 45px rgba(14,165,233,0.5); }
        }
      `}</style>
    </div>
  );
}
