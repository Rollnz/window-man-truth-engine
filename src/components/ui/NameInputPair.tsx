import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

/**
 * NameInputPair - Dual first/last name input component for Meta EMQ optimization.
 * 
 * Features:
 * - Side-by-side on desktop, stacked on mobile
 * - Proper autofill attributes (given-name, family-name)
 * - Accessible with ARIA attributes
 * - Last name optional (no error styling when empty)
 * - Keyboard navigation flows naturally
 */
export interface NameInputPairProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onFirstNameBlur?: () => void;
  onLastNameBlur?: () => void;
  errors?: { firstName?: string; lastName?: string };
  disabled?: boolean;
  autoFocus?: boolean;
  /** Show icon next to label */
  showIcon?: boolean;
  /** Hide visible labels (use sr-only for accessibility) */
  hideLabels?: boolean;
  /** Custom label text */
  firstNameLabel?: string;
  lastNameLabel?: string;
  /** ID prefix for form inputs */
  idPrefix?: string;
  /** Input size variant */
  size?: 'default' | 'compact';
  /** Additional className for the container */
  className?: string;
}

export function NameInputPair({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onFirstNameBlur,
  onLastNameBlur,
  errors = {},
  disabled = false,
  autoFocus = false,
  showIcon = false,
  hideLabels = false,
  firstNameLabel = "First Name",
  lastNameLabel = "Last Name",
  idPrefix = "",
  size = 'default',
  className,
}: NameInputPairProps) {
  const firstNameId = `${idPrefix}firstName`;
  const lastNameId = `${idPrefix}lastName`;
  const firstNameErrorId = `${firstNameId}-error`;
  const lastNameErrorId = `${lastNameId}-error`;
  
  const inputHeight = size === 'compact' ? 'h-9' : 'h-10';

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
      {/* First Name (required) */}
      <div className={hideLabels ? "" : "space-y-2"}>
        {hideLabels ? (
          <label htmlFor={firstNameId} className="sr-only">{firstNameLabel}</label>
        ) : (
          <Label 
            htmlFor={firstNameId} 
            className={cn(
              "flex items-center gap-2 font-semibold",
              errors.firstName ? "text-destructive" : "text-foreground"
            )}
          >
            {showIcon && <User className="h-4 w-4 text-muted-foreground" />}
            {firstNameLabel} *
          </Label>
        )}
        <Input
          id={firstNameId}
          name="firstName"
          type="text"
          autoComplete="given-name"
          placeholder={hideLabels ? firstNameLabel : "John"}
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          onBlur={onFirstNameBlur}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            inputHeight,
            errors.firstName && "border-destructive focus-visible:ring-destructive"
          )}
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? firstNameErrorId : undefined}
        />
        {errors.firstName && (
          <p id={firstNameErrorId} className={cn("text-xs text-destructive", hideLabels && "mt-1")} role="alert">
            {errors.firstName}
          </p>
        )}
      </div>

      {/* Last Name (optional) */}
      <div className={hideLabels ? "" : "space-y-2"}>
        {hideLabels ? (
          <label htmlFor={lastNameId} className="sr-only">{lastNameLabel}</label>
        ) : (
          <Label 
            htmlFor={lastNameId} 
            className={cn(
              "flex items-center gap-2 font-semibold",
              errors.lastName ? "text-destructive" : "text-foreground"
            )}
          >
            {lastNameLabel}
          </Label>
        )}
        <Input
          id={lastNameId}
          name="lastName"
          type="text"
          autoComplete="family-name"
          placeholder={hideLabels ? lastNameLabel : "Smith"}
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          onBlur={onLastNameBlur}
          disabled={disabled}
          className={cn(
            inputHeight,
            errors.lastName && "border-destructive focus-visible:ring-destructive"
          )}
          aria-invalid={!!errors.lastName}
          aria-describedby={errors.lastName ? lastNameErrorId : undefined}
        />
        {errors.lastName && (
          <p id={lastNameErrorId} className={cn("text-xs text-destructive", hideLabels && "mt-1")} role="alert">
            {errors.lastName}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Normalizes first/last name fields.
 * If lastName is empty and firstName contains a space, split on the first space.
 */
export function normalizeNameFields(
  firstName: string,
  lastName?: string
): { firstName: string; lastName: string } {
  const trimmedFirst = firstName.trim();
  const trimmedLast = (lastName || '').trim();

  // If lastName is empty and firstName has a space, split
  if (!trimmedLast && trimmedFirst.includes(' ')) {
    const spaceIndex = trimmedFirst.indexOf(' ');
    return {
      firstName: trimmedFirst.slice(0, spaceIndex),
      lastName: trimmedFirst.slice(spaceIndex + 1).trim(),
    };
  }

  return { firstName: trimmedFirst, lastName: trimmedLast };
}
