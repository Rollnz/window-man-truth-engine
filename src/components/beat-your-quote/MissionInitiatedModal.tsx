import { useState, useEffect, useCallback } from 'react';
import { Loader2, Shield, Send, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormValidation, formatPhoneNumber, commonSchemas } from '@/hooks/useFormValidation';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useSessionData } from '@/hooks/useSessionData';
import { useFormAbandonment } from '@/hooks/useFormAbandonment';
import { getAttributionData } from '@/lib/attribution';
import { trackLeadCapture, trackFormSubmit, trackEvent, trackLeadSubmissionSuccess, trackFormStart } from '@/lib/gtm';
import { getLeadQuality } from '@/lib/leadQuality';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MissionInitiatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The quote file ID to link to the captured lead */
  quoteFileId: string;
  /** Called when lead is successfully captured - receives leadId and name */
  onLeadCaptured?: (leadId: string, leadName?: string) => void;
}

export function MissionInitiatedModal({
  isOpen,
  onClose,
  quoteFileId,
  onLeadCaptured,
}: MissionInitiatedModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanning, setShowScanning] = useState(true);
  const [formStarted, setFormStarted] = useState(false);
  const { leadId: existingLeadId, setLeadId } = useLeadIdentity();
  const { sessionData } = useSessionData();

  // Form abandonment tracking (Phase 7)
  const { trackFieldEntry, resetTracking } = useFormAbandonment({
    formId: 'mission_initiated',
    sourceTool: 'beat-your-quote',
    isSubmitted: isSubmitting,
  });

  const {
    values,
    getFieldProps,
    validateAll,
    hasError,
    getError,
  } = useFormValidation({
    initialValues: { name: '', email: '', phone: '' },
    schemas: {
      name: commonSchemas.name,
      email: commonSchemas.email,
      phone: commonSchemas.phone,
    },
    formatters: {
      phone: formatPhoneNumber,
    },
  });

  // Show scanning animation for 1.5s before revealing form
  useEffect(() => {
    if (isOpen) {
      setShowScanning(true);
      const timer = setTimeout(() => setShowScanning(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) return;
    
    setIsSubmitting(true);
    
    try {
      const sessionId = sessionData.claimVaultSessionId || crypto.randomUUID();
      
      const payload = {
        email: values.email.trim(),
        name: values.name.trim(),
        phone: values.phone.trim(),
        sourceTool: 'beat-your-quote' as const,
        attribution: getAttributionData(),
        sessionId,
        quoteFileId, // Link the uploaded file
        aiContext: {
          source_form: 'beat-your-quote-upload',
        },
        ...(existingLeadId && { leadId: existingLeadId }),
      };

      const { data, error } = await supabase.functions.invoke('save-lead', {
        body: payload,
      });

      if (error) throw error;

      const newLeadId = data?.leadId;
      if (newLeadId) {
        setLeadId(newLeadId);
      }

      // Track analytics
      const effectiveLeadId = newLeadId || existingLeadId;
      
      trackFormSubmit({
        formName: 'beat-your-quote-upload',
        formId: 'mission_initiated_modal',
        sourceTool: 'beat-your-quote',
      });

      await trackLeadCapture(
        {
          leadId: effectiveLeadId || '',
          sourceTool: 'beat_your_quote',
          conversionAction: 'quote_upload',
        },
        values.email,
        values.phone,
        {
          hasName: !!values.name.trim(),
          hasPhone: !!values.phone.trim(),
          hasProjectDetails: true,
        }
      );

      trackEvent('quote_lead_captured', {
        quote_file_id: quoteFileId,
        lead_id: effectiveLeadId,
        source: 'beat-your-quote',
      });

      // Push Enhanced Conversion event with SHA-256 PII hashing (value: 15 USD)
      await trackLeadSubmissionSuccess({
        leadId: effectiveLeadId || '',
        email: values.email,
        phone: values.phone || undefined,
        name: values.name || undefined,
        sourceTool: 'beat-your-quote',
      });

      toast({
        title: 'Mission Received!',
        description: 'Our expert is reviewing your quote. Expect a text in 5 minutes.',
      });

      // Notify parent with leadId and name
      if (onLeadCaptured && effectiveLeadId) {
        onLeadCaptured(effectiveLeadId, values.name.trim());
      }

      onClose();
    } catch (err) {
      console.error('[MissionInitiatedModal] Submit error:', err);
      toast({
        title: 'Something went wrong',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll, sessionData, existingLeadId, setLeadId, quoteFileId, onLeadCaptured, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-white border-t-4 border-t-primary shadow-2xl">
        {showScanning ? (
          // Scanning animation state - colors adjusted for white background
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '2s' }} />
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-primary/30 animate-ping" />
            </div>
            <p className="text-lg font-semibold text-slate-900 mb-2">Scanning Your Quote...</p>
            <p className="text-sm text-slate-500">AI analysis in progress</p>
          </div>
        ) : (
          // Form state - clean white card with high contrast
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-900">
                Analysis in Progress...
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Where should we send the report?
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3 mt-4">
              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="mission-name" className="font-semibold text-slate-900">Name</Label>
                <Input
                  id="mission-name"
                  placeholder="Your name"
                  className={cn(
                    "h-9 bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 shadow-sm",
                    hasError('name') && "border-destructive"
                  )}
                  {...getFieldProps('name')}
                  disabled={isSubmitting}
                />
                {hasError('name') && (
                  <p className="text-xs text-destructive">{getError('name')}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="mission-email" className="font-semibold text-slate-900">Email</Label>
                <Input
                  id="mission-email"
                  type="email"
                  placeholder="your@email.com"
                  className={cn(
                    "h-9 bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 shadow-sm",
                    hasError('email') && "border-destructive"
                  )}
                  {...getFieldProps('email')}
                  disabled={isSubmitting}
                />
                {hasError('email') && (
                  <p className="text-xs text-destructive">{getError('email')}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label htmlFor="mission-phone" className="font-semibold text-slate-900">Phone</Label>
                <Input
                  id="mission-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  className={cn(
                    "h-9 bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 shadow-sm",
                    hasError('phone') && "border-destructive"
                  )}
                  {...getFieldProps('phone')}
                  disabled={isSubmitting}
                />
                {hasError('phone') && (
                  <p className="text-xs text-destructive">{getError('phone')}</p>
                )}
              </div>

              {/* Submit Button - CTA variant for maximum visibility */}
              <Button
                type="submit"
                variant="cta"
                className="w-full mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send My Report
                  </>
                )}
              </Button>

              {/* Trust indicator - dark text for white background */}
              <p className="text-xs text-center text-slate-500 pt-2">
                <Shield className="inline w-3 h-3 mr-1" />
                Your info is encrypted and never shared with contractors.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
