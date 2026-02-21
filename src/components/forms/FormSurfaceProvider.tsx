import * as React from "react";

/**
 * Form Surface Context System
 * 
 * Provides a way to declare form surface context once, and have all form controls
 * (Input, Textarea, Select) inside that subtree style correctly.
 * 
 * Usage:
 * - Wrap white-card forms in <FormSurfaceProvider surface="trust"> to force 
 *   light-surface control styling regardless of theme.
 * - Default pages use 'default' surface (theme-aware inputs).
 */

export type FormSurface = 'default' | 'trust';

const FormSurfaceContext = React.createContext<FormSurface>('default');

interface FormSurfaceProviderProps {
  surface: FormSurface;
  children: React.ReactNode;
}

/**
 * FormSurfaceProvider - Wrap form sections to control input styling
 * 
 * @param surface - 'default' for theme-aware inputs, 'trust' for forced light inputs
 * @example
 * <FormSurfaceProvider surface="trust">
 *   <Input placeholder="Always light background" />
 * </FormSurfaceProvider>
 */
export function FormSurfaceProvider({ surface, children }: FormSurfaceProviderProps) {
  return (
    <FormSurfaceContext.Provider value={surface}>
      {children}
    </FormSurfaceContext.Provider>
  );
}

/**
 * Hook to read the current form surface context
 * Returns 'default' when no provider is present
 */
export function useFormSurface(): FormSurface {
  return React.useContext(FormSurfaceContext);
}

/**
 * Variant style definitions for form controls
 * Use these in Input, Textarea, Select components
 */
export const formSurfaceStyles = {
  default: {
    input: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-500 placeholder:text-slate-500 dark:placeholder:text-slate-400',
    select: {
      trigger: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-500',
      content: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700',
      item: 'focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-slate-100',
    },
  },
  trust: {
    input: 'bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 shadow-sm',
    select: {
      trigger: 'bg-white text-slate-900 border-slate-300 shadow-sm',
      content: 'bg-white text-slate-900 border-slate-200 shadow-lg',
      item: 'focus:bg-slate-100 focus:text-slate-900',
    },
  },
} as const;
