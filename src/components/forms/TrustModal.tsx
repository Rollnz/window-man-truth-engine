import * as React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSurfaceProvider } from "@/components/forms/FormSurfaceProvider";
import { cn } from "@/lib/utils";

/**
 * TrustModal - Single source of truth for conversion modals.
 * 
 * All conversion modals should use TrustModal; do NOT reintroduce
 * per-input dark-mode overrides. The FormSurfaceProvider inside
 * ensures all Input/Textarea/Select components auto-style correctly.
 * 
 * @example
 * <Dialog open={isOpen} onOpenChange={handleClose}>
 *   <TrustModal modalTitle="Schedule Consultation" modalDescription="...">
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
}

export function TrustModal({
  modalTitle,
  modalDescription,
  headerAlign = 'left',
  children,
  className,
  ...props
}: TrustModalProps) {
  return (
    <DialogContent
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
      {/* Header with title/description if provided */}
      {(modalTitle || modalDescription) && (
        <DialogHeader
          className={cn(
            headerAlign === 'center' && "text-center items-center",
          )}
        >
          {modalTitle && (
            <DialogTitle className="text-slate-900 dark:text-slate-900">
              {modalTitle}
            </DialogTitle>
          )}
          {modalDescription && (
            <DialogDescription className="text-slate-600 dark:text-slate-600">
              {modalDescription}
            </DialogDescription>
          )}
        </DialogHeader>
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
