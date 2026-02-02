import { Loader2, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NameInputPair } from '@/components/ui/NameInputPair';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { emailInputProps } from '@/lib/formAccessibility';
import { formMicroCopy } from '@/components/forms/InlineFieldStatus';
import { cn } from '@/lib/utils';

interface ScannerStep1ContactProps {
  initialValues?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  onSubmit: (data: { firstName: string; lastName: string; email: string }) => void;
  isLoading?: boolean;
}

/**
 * Step 1: Contact Information
 * Collects first name, last name, and email only.
 * Phone is collected in Step 2 with context.
 */
export function ScannerStep1Contact({
  initialValues = {},
  onSubmit,
  isLoading = false,
}: ScannerStep1ContactProps) {
  const { values, setValue, getFieldProps, hasError, getError, validateAll } = useFormValidation({
    initialValues: {
      firstName: initialValues.firstName || '',
      lastName: initialValues.lastName || '',
      email: initialValues.email || '',
    },
    schemas: {
      firstName: commonSchemas.firstName,
      lastName: commonSchemas.lastName,
      email: commonSchemas.email,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      onSubmit({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
      });
    }
  };

  const emailError = hasError('email') ? getError('email') : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Unlock Your Free AI Analysis
        </h3>
        <p className="text-sm text-slate-600">
          Get instant insights into your window quote
        </p>
      </div>

      {/* Name Fields */}
      <NameInputPair
        firstName={values.firstName}
        lastName={values.lastName}
        onFirstNameChange={(v) => setValue('firstName', v)}
        onLastNameChange={(v) => setValue('lastName', v)}
        errors={{ 
          firstName: hasError('firstName') ? getError('firstName') : undefined 
        }}
        disabled={isLoading}
        autoFocus
      />

      {/* Email Field */}
      <div className="space-y-2">
        <Label 
          htmlFor="scanner-email" 
          className={cn(
            "font-semibold text-slate-900",
            emailError && "text-destructive"
          )}
        >
          Email Address *
        </Label>
        <Input
          id="scanner-email"
          {...emailInputProps}
          placeholder="you@example.com"
          {...getFieldProps('email')}
          disabled={isLoading}
          className={emailError ? 'border-destructive focus-visible:ring-destructive' : ''}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'scanner-email-error' : 'scanner-email-hint'}
          tabIndex={0}
        />
        {emailError ? (
          <p id="scanner-email-error" className="text-xs text-destructive" role="alert">
            {emailError}
          </p>
        ) : (
          <p id="scanner-email-hint" className="text-xs text-muted-foreground">
            {formMicroCopy.email}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="cta"
        className="w-full min-h-[48px]"
        disabled={isLoading || !values.email.trim() || !values.firstName.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      {/* Privacy note */}
      <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" />
        Your info stays private. No spam, ever.
      </p>
    </form>
  );
}
