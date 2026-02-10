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
 * "War Room Entry" - Military-style CTA with tactical status indicator.
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
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        No decisions yet. Just securing your position.
      </p>

      {/* Tactical Status Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-sm font-mono text-stone-500 dark:text-emerald-400 uppercase tracking-wider">
          Tactical Systems Active
        </span>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      </div>

      {/* Primary CTA - Military Style */}
      <Button
        onClick={onGoogleAuth}
        disabled={isLoading}
        size="lg"
        className={cn(
          'w-full md:w-auto md:min-w-[360px] h-16 text-lg font-bold uppercase tracking-wider',
          'text-white',
          'border-2 border-[#b45309]',
          'shadow-lg hover:shadow-xl hover:brightness-110',
          'dark:shadow-[0_0_30px_rgba(217,119,6,0.4)]',
          'dark:animate-[radar-pulse_3s_ease-in-out_infinite]',
          'transition-all duration-200'
        )}
        style={{ backgroundColor: '#D97706' }}
      >
        <Lock className="w-5 h-5 mr-2" />
        ENTER YOUR SECURE VAULT
      </Button>

      {/* Email Fallback Toggle */}
      <button
        onClick={() => setShowEmailForm(!showEmailForm)}
        className="flex items-center justify-center gap-1 mx-auto mt-6 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
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
          className="max-w-md mx-auto space-y-4 p-6 rounded-xl border-2 bg-white dark:bg-stone-900/80 border-stone-200 dark:border-emerald-500/20"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="firstName" className="text-stone-700 dark:text-stone-300">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={values.firstName}
                onChange={(e) => setValue('firstName', e.target.value)}
                className={cn(
                  "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500",
                  hasError('firstName') && 'border-red-500'
                )}
                required
              />
              {hasError('firstName') && (
                <p className="text-xs text-red-500 dark:text-red-400">{getError('firstName')}</p>
              )}
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="lastName" className="text-stone-700 dark:text-stone-300">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={values.lastName}
                onChange={(e) => setValue('lastName', e.target.value)}
                className={cn(
                  "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500",
                  hasError('lastName') && 'border-red-500'
                )}
                required
              />
              {hasError('lastName') && (
                <p className="text-xs text-red-500 dark:text-red-400">{getError('lastName')}</p>
              )}
            </div>
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="text-stone-700 dark:text-stone-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              className={cn(
                "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500",
                hasError('email') && 'border-red-500'
              )}
              placeholder="you@example.com"
              required
            />
            {hasError('email') && (
              <p className="text-xs text-red-500 dark:text-red-400">{getError('email')}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white uppercase tracking-wider"
          >
            Continue with Email
          </Button>
        </form>
      </div>

      {/* Final Assurance */}
      <p className="text-xs text-stone-500 mt-8 max-w-sm mx-auto">
        Free forever. Takes 10 seconds. We never sell or share your data.
      </p>

      {/* Radar pulse animation for dark mode */}
      <style>{`
        @keyframes radar-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(217,119,6,0.3); }
          50% { box-shadow: 0 0 40px rgba(217,119,6,0.5); }
        }
      `}</style>
    </div>
  );
}
