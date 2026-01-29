import { Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * InlineFieldStatus - Visual feedback for form field validation
 * 
 * Shows:
 * - Green checkmark when valid
 * - Red X with error message when invalid
 * - Nothing when pristine (not yet touched)
 * 
 * @example
 * <div className="relative">
 *   <Input {...props} />
 *   <InlineFieldStatus 
 *     isValid={isValidEmail} 
 *     error={emailError}
 *     showSuccess={email.length > 0}
 *   />
 * </div>
 */

export interface InlineFieldStatusProps {
  /** Whether the field is currently valid */
  isValid: boolean;
  /** Error message to display (if any) */
  error?: string;
  /** Whether to show success state (prevents showing green on empty fields) */
  showSuccess?: boolean;
  /** Position of the indicator */
  position?: 'inside' | 'below';
  /** Additional className */
  className?: string;
}

export function InlineFieldStatus({
  isValid,
  error,
  showSuccess = false,
  position = 'below',
  className,
}: InlineFieldStatusProps) {
  // Don't show anything if there's no error and we shouldn't show success
  if (!error && !showSuccess) {
    return null;
  }

  if (position === 'inside') {
    // Icon-only inside the input (absolute positioned)
    return (
      <div 
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none",
          className
        )}
        aria-hidden="true"
      >
        {isValid && showSuccess && (
          <Check className="h-4 w-4 text-primary" />
        )}
        {error && (
          <X className="h-4 w-4 text-destructive" />
        )}
      </div>
    );
  }

  // Below the input with text
  return (
    <div 
      className={cn(
        "flex items-center gap-1 text-xs mt-1",
        error ? "text-destructive" : "text-primary",
        className
      )}
      role={error ? "alert" : undefined}
    >
      {isValid && showSuccess && (
        <>
          <Check className="h-3 w-3 flex-shrink-0" />
          <span>Looks good!</span>
        </>
      )}
      {error && (
        <>
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{error}</span>
        </>
      )}
    </div>
  );
}

/**
 * Micro-copy for common form fields
 * Use these for consistent reassuring text across forms
 */
export const formMicroCopy = {
  email: "We'll never share your email or spam you.",
  phone: "For texts only. No sales calls, ever.",
  submit: "Free forever. Takes 10 seconds. We never sell or share your data.",
  privacy: "Your info stays private. No spam, ever.",
} as const;
