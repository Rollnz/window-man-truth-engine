import * as React from "react";

import { cn } from "@/lib/utils";
import { useFormSurface, formSurfaceStyles, type FormSurface } from "@/components/forms/FormSurfaceProvider";

/**
 * Textarea component with form surface variant support.
 * 
 * Resolves styling based on:
 * 1. Explicit `variant` prop (wins if provided)
 * 2. FormSurfaceProvider context
 * 3. Falls back to 'default' (theme-aware)
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Force a specific surface variant, bypassing context */
  variant?: FormSurface;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    const surfaceContext = useFormSurface();
    const resolvedVariant = variant ?? surfaceContext;
    
    const variantStyles = formSurfaceStyles[resolvedVariant].input;

    return (
      <textarea
        className={cn(
          // Base styles - CRITICAL: text-base prevents iOS auto-zoom on focus
          "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          // Variant-specific styles
          variantStyles,
          // Allow className overrides
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
