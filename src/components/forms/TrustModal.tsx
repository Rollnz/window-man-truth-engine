import * as React from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSurfaceProvider } from "@/components/forms/FormSurfaceProvider";
import { cn } from "@/lib/utils";
import type { GateLockLevel } from "@/types/gate.types";

/**
 * TrustModal - Single source of truth for conversion modals.
 * 
 * All conversion modals should use TrustModal; do NOT reintroduce
 * per-input dark-mode overrides. The FormSurfaceProvider inside
 * ensures all Input/Textarea/Select components auto-style correctly.
 * 
 * PROGRESSIVE HARDENING: When lockLevel is 'medium' or 'hard', the modal
 * prevents ESC key and overlay clicks from closing, and hides the X button.
 * The onCloseAttempt callback fires when users try to close, allowing the
 * parent to escalate lock level and show toasts.
 * 
 * ACCESSIBILITY FIX: Always renders DialogTitle and DialogDescription
 * (using VisuallyHidden fallbacks when no props provided) to ensure
 * Radix focus trap works correctly on all browsers (especially Firefox).
 * 
 * @example
 * <Dialog open={isOpen} onOpenChange={handleClose}>
 *   <TrustModal 
 *     modalTitle="Schedule Consultation" 
 *     modalDescription="..."
 *     lockLevel="medium"
 *     onCloseAttempt={handleCloseAttempt}
 *   >
 *     <form>
 *       <Input placeholder="Name" /> {/* Auto-styled for white card *\/}
 *     </form>
 *   </TrustModal>
 * </Dialog>
 */

export interface TrustModalProps extends Omit<React.ComponentPropsWithoutRef<typeof DialogContent>, 'title'> {
  /** Modal title - rendered with DialogTitle (renamed to avoid conflict with HTML title attr) */
  modalTitle?: React.ReactNode;
  /** Modal description - rendered with DialogDescription */
  modalDescription?: React.ReactNode;
  /** Header alignment - 'left' (default) or 'center' */
  headerAlign?: 'left' | 'center';
  /** Child content - wrapped with FormSurfaceProvider surface="trust" */
  children: React.ReactNode;
  /** Progressive hardening lock level */
  lockLevel?: GateLockLevel;
  /** Called when user attempts to close (ESC/overlay/X) - allows parent to escalate */
  onCloseAttempt?: () => void;
}

export function TrustModal({
  modalTitle,
  modalDescription,
  headerAlign = 'left',
  children,
  className,
  lockLevel = 'soft',
  onCloseAttempt,
  ...props
}: TrustModalProps) {
  /**
   * Intercept close attempts based on lock level
   * - soft: Allow normal close behavior
   * - medium/hard: Prevent close and notify parent
   */
  const handleInteractOutside = (e: Event) => {
    if (lockLevel !== 'soft') {
      e.preventDefault();
      onCloseAttempt?.();
    }
  };

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    if (lockLevel !== 'soft') {
      e.preventDefault();
      onCloseAttempt?.();
    }
  };

  const handlePointerDownOutside = (e: Event) => {
    if (lockLevel !== 'soft') {
      e.preventDefault();
      onCloseAttempt?.();
    }
  };

  return (
    <DialogContent
      hideCloseButton={lockLevel !== 'soft'}
      onInteractOutside={handleInteractOutside}
      onPointerDownOutside={handlePointerDownOutside}
      onEscapeKeyDown={handleEscapeKeyDown}
      className={cn(
        // White card styling - forced even in dark mode
        "bg-white dark:bg-white",
        // Trust indicator: primary brand top border
        "border-t-4 border-t-primary",
        // Elevated shadow for modal prominence
        "shadow-xl",
        // Standard modal padding
        "p-6",
        // Allow custom className to extend
        className,
      )}
      {...props}
    >
      {/* 
        ACCESSIBILITY: Always render DialogTitle and DialogDescription 
        for proper focus trap and screen reader support.
        Use VisuallyHidden when no visible title/description is provided.
      */}
      {modalTitle || modalDescription ? (
        <DialogHeader
          className={cn(
            headerAlign === 'center' && "text-center items-center",
          )}
        >
          {modalTitle ? (
            <DialogTitle className="text-slate-900 dark:text-slate-900">
              {modalTitle}
            </DialogTitle>
          ) : (
            <VisuallyHidden.Root>
              <DialogTitle>Form Modal</DialogTitle>
            </VisuallyHidden.Root>
          )}
          {modalDescription ? (
            <DialogDescription className="text-slate-600 dark:text-slate-600">
              {modalDescription}
            </DialogDescription>
          ) : (
            <VisuallyHidden.Root>
              <DialogDescription>Complete the form below</DialogDescription>
            </VisuallyHidden.Root>
          )}
        </DialogHeader>
      ) : (
        /* No visible header - still need accessible names for focus trap */
        <>
          <VisuallyHidden.Root>
            <DialogTitle>Form Modal</DialogTitle>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root>
            <DialogDescription>Complete the form below</DialogDescription>
          </VisuallyHidden.Root>
        </>
      )}

      {/* 
        FormSurfaceProvider surface="trust" ensures all nested form controls
        (Input, Textarea, Select) render with white-card-friendly styling
        regardless of global theme.
      */}
      <FormSurfaceProvider surface="trust">
        {children}
      </FormSurfaceProvider>
    </DialogContent>
  );
}
