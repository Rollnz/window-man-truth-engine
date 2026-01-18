import * as React from "react";

import { cn } from "@/lib/utils";
import { useFormSurface, formSurfaceStyles, type FormSurface } from "@/components/forms/FormSurfaceProvider";

/**
 * Input component with form surface variant support.
 * 
 * Resolves styling based on:
 * 1. Explicit `variant` prop (wins if provided)
 * 2. FormSurfaceProvider context
 * 3. Falls back to 'default' (theme-aware)
 * 
 * @example
 * // Inside a trust modal - auto-styles correctly
 * <FormSurfaceProvider surface="trust">
 *   <Input placeholder="Light background" />
 * </FormSurfaceProvider>
 * 
 * // Override explicitly
 * <Input variant="trust" placeholder="Forced light" />
 */
export interface InputProps extends React.ComponentProps<"input"> {
  /** Force a specific surface variant, bypassing context */
  variant?: FormSurface;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    const surfaceContext = useFormSurface();
    const resolvedVariant = variant ?? surfaceContext;
    
    const variantStyles = formSurfaceStyles[resolvedVariant].input;

    return (
      <input
        type={type}
        className={cn(
          // Base styles (always applied)
          "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // Variant-specific styles
          variantStyles,
          // Allow className overrides for error states, sizing, etc.
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
