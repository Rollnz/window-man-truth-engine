// ============================================
// Quote Builder - Lead Capture Modal
// ============================================

import { useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormValidation, commonSchemas, formatPhoneNumber } from "@/hooks/useFormValidation";
import { trackLeadSubmissionSuccess, generateEventId } from "@/lib/gtm";
import { getOrCreateClientId, getOrCreateSessionId } from "@/lib/tracking";
import { getLeadAnchor } from "@/lib/leadAnchor";
import type { LeadModalProps, LeadFormData } from "@/types/quote-builder";

export const LeadModal = ({ isOpen, onClose, onSubmit, isSubmitting }: LeadModalProps) => {
  const { values, getFieldProps, hasError, getError, validateAll } = useFormValidation({
    initialValues: { name: '', email: '', phone: '' },
    schemas: {
      name: commonSchemas.name,
      email: commonSchemas.email,
      phone: commonSchemas.phone
    },
    formatters: {
      phone: formatPhoneNumber
    }
  });

  // Enriched dataLayer push on modal open
  useEffect(() => {
    if (isOpen) {
      const externalId = getLeadAnchor() || null;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'quote_builder_modal_opened',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: externalId,
        source_tool: 'quote-builder',
        source_system: 'web',
        modal_name: 'quote_builder_lead',
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    const formData: LeadFormData = {
      name: values.name,
      email: values.email,
      phone: values.phone
    };

    // Call parent submit handler and get leadId
    const leadId = await onSubmit(formData);

    // Track with SHA-256 PII hashing (value: 15 USD)
    if (leadId) {
      // Enriched dataLayer push for form completion
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'quote_builder_form_completed',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: leadId,
        source_tool: 'quote-builder',
        source_system: 'web',
        form_name: 'quote_builder_lead',
      });

      await trackLeadSubmissionSuccess({
        leadId,
        email: values.email,
        phone: values.phone || undefined,
        name: values.name || undefined,
        sourceTool: 'quote-builder',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-primary/5 via-white to-blue-50/50 dark:from-card dark:via-card dark:to-card shadow-xl rounded-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 border border-slate-300 dark:border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-foreground transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Check className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-foreground">Your Estimate is Ready!</h3>
          <p className="text-slate-500 dark:text-muted-foreground mt-2 text-sm">
            We've generated your project estimate. Where should we send the detailed PDF report?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name" className="text-slate-700 dark:text-foreground font-semibold">Full Name</Label>
            <Input
              id="lead-name"
              type="text"
              placeholder="John Smith"
              className={hasError('name') ? 'border-destructive focus-visible:ring-destructive' : ''}
              {...getFieldProps('name')}
            />
            {hasError('name') && (
              <p className="text-sm text-destructive font-medium">{getError('name')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-email" className="text-slate-700 dark:text-foreground font-semibold">Email Address</Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="john@example.com"
              className={hasError('email') ? 'border-destructive focus-visible:ring-destructive' : ''}
              {...getFieldProps('email')}
            />
            {hasError('email') && (
              <p className="text-sm text-destructive font-medium">{getError('email')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-phone" className="text-slate-700 dark:text-foreground font-semibold">Phone Number</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="(555) 123-4567"
              className={hasError('phone') ? 'border-destructive focus-visible:ring-destructive' : ''}
              {...getFieldProps('phone')}
            />
            {hasError('phone') && (
              <p className="text-sm text-destructive font-medium">{getError('phone')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Unlocking...
              </>
            ) : (
              "Send My Quote & Report"
            )}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Window GUY respects your privacy. No spam, ever.
        </p>
      </div>
    </div>
  );
};
