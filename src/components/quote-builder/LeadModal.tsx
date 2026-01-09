// ============================================
// Quote Builder - Lead Capture Modal
// ============================================

import { X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormValidation, commonSchemas, formatPhoneNumber } from "@/hooks/useFormValidation";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    onSubmit({
      name: values.name,
      email: values.email,
      phone: values.phone
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 shadow-2xl rounded-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 border border-slate-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Check className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Your Estimate is Ready!</h3>
          <p className="text-slate-500 mt-2 text-sm">
            We've generated your project estimate. Where should we send the detailed PDF report?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name" className="text-slate-700 font-semibold">Full Name</Label>
            <Input
              id="lead-name"
              type="text"
              placeholder="John Smith"
              className={`bg-white ${hasError('name') ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-300'}`}
              {...getFieldProps('name')}
            />
            {hasError('name') && (
              <p className="text-sm text-red-600 font-medium">{getError('name')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-email" className="text-slate-700 font-semibold">Email Address</Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="john@example.com"
              className={`bg-white ${hasError('email') ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-300'}`}
              {...getFieldProps('email')}
            />
            {hasError('email') && (
              <p className="text-sm text-red-600 font-medium">{getError('email')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-phone" className="text-slate-700 font-semibold">Phone Number</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="(555) 123-4567"
              className={`bg-white ${hasError('phone') ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-300'}`}
              {...getFieldProps('phone')}
            />
            {hasError('phone') && (
              <p className="text-sm text-red-600 font-medium">{getError('phone')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        <p className="text-xs text-slate-400 text-center mt-4">
          Window GUY respects your privacy. No spam, ever.
        </p>
      </div>
    </div>
  );
};
