import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useTrackToolCompletion } from '@/hooks/useTrackToolCompletion';
import { SessionData } from '@/hooks/useSessionData';
import { IntelResource } from '@/data/intelData';
import { Mail, Check, Loader2, Unlock } from 'lucide-react';
import { trackEvent, trackModalOpen, trackLeadCapture } from '@/lib/gtm';
import { getAttributionData, buildAIContextFromSession } from '@/lib/attribution';
import type { SourceTool } from '@/types/sourceTool';
import { TrustModal } from '@/components/forms/TrustModal';

interface IntelLeadModalProps {
  isOpen: boolean;
  resource: IntelResource | null;
  onClose: () => void; // Called on X click - treated as skip
  onSuccess: (leadId: string) => void;
  sessionData: SessionData;
}

export function IntelLeadModal({
  isOpen,
  resource,
  onClose,
  onSuccess,
  sessionData,
}: IntelLeadModalProps) {
  const { toast } = useToast();
  const { leadId: hookLeadId, setLeadId } = useLeadIdentity();
  const { trackToolComplete } = useTrackToolCompletion();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalOpenTime, setModalOpenTime] = useState<number>(0);

  const { values, hasError, getError, getFieldProps, validateAll } = useFormValidation({
    initialValues: { email: sessionData.email || '' },
    schemas: { email: commonSchemas.email },
  });

  // Track modal open with resource details - fires ONLY when modal opens
  useEffect(() => {
    if (isOpen && resource) {
      const now = Date.now();
      setModalOpenTime(now);

      trackModalOpen({ 
        modalName: 'intel_lead', 
        sourceTool: 'intel-library',
      });
    }
  }, [isOpen, resource?.id]); // resource.id is stable, safe dependency

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast({
        title: 'Invalid Email',
        description: getError('email') || 'Please check your email',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            email: values.email.trim(),
            name: sessionData.name || null,
            phone: sessionData.phone || null,
            leadId: hookLeadId, // Golden Thread: pass existing leadId for upsert
            sourceTool: 'intel-library' satisfies SourceTool,
            sessionData,
            chatHistory: [],
            attribution: getAttributionData(),
            aiContext: buildAIContextFromSession(sessionData, 'intel-library'),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }

      const data = await response.json();

      if (data.success && data.leadId) {
        setIsSuccess(true);

        // Golden Thread: persist leadId for cross-tool tracking
        setLeadId(data.leadId);

        // Track lead capture with full metadata (Phase 4)
        await trackLeadCapture(
          {
            leadId: data.leadId,
            sourceTool: 'intel_library',
            conversionAction: 'ebook_download',
          },
          values.email.trim(),
          sessionData.phone || undefined,
          {
            hasName: !!sessionData.name,
            hasPhone: !!sessionData.phone,
            hasProjectDetails: !!sessionData.windowCount,
          }
        );

        trackEvent('intel_unlocked', {
          resource_id: resource?.id,
          resource_title: resource?.title,
          lead_id: data.leadId, // Golden Thread: include in analytics
        });

        // Track tool completion with delta value for value-based bidding
        trackToolComplete('intel-library', {
          resource_id: resource?.id,
          resource_title: resource?.title,
        });

        toast({
          title: 'Document Unlocked!',
          description: 'Access granted. Redirecting...',
        });

        setTimeout(() => {
          onSuccess(data.leadId);
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Lead capture error:', error);
      toast({
        title: 'Unable to save',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Soft gate: close button triggers skip behavior
  const handleClose = () => {
    if (!isLoading) {
      // Track modal abandonment if not successful
      if (!isSuccess && modalOpenTime > 0 && resource) {
        const timeSpent = Math.round((Date.now() - modalOpenTime) / 1000); // seconds
        trackEvent('modal_abandon', {
          modal_type: 'intel_lead',
          resource_id: resource.id,
          resource_title: resource.title,
          time_spent_seconds: timeSpent,
        });
      }

      setIsSuccess(false);
      onClose(); // Parent handles skip logic (redirect if landing page exists)
    }
  };

  const emailProps = getFieldProps('email');
  const emailHasError = hasError('email');
  const emailError = getError('email');

  if (!resource) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <TrustModal className="sm:max-w-md">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl mb-2 text-slate-900">Document Unlocked!</DialogTitle>
            <DialogDescription className="text-slate-600">
              Access granted. Redirecting you now...
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              {/* Dynamic book cover display */}
              {resource.bookImageUrl && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={resource.bookImageUrl} 
                    alt={resource.title}
                    className="h-20 sm:h-32 w-auto object-contain drop-shadow-lg"
                  />
                </div>
              )}
              {!resource.bookImageUrl && (
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Unlock className="w-4 h-4 text-primary" />
                  </div>
                </div>
              )}
              <DialogTitle className="text-center text-slate-900">
                Unlock: {resource.title}
              </DialogTitle>
              <DialogDescription className="text-center text-slate-600">
                Enter your email to access this resource and save it to your vault.
              </DialogDescription>
            </DialogHeader>

            {/* TrustModal auto-wraps children with FormSurfaceProvider surface="trust" */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="intel-email" className={`font-semibold text-slate-900 ${emailHasError ? 'text-destructive' : ''}`}>
                  Email Address
                </Label>
                <Input
                  id="intel-email"
                  type="email"
                  placeholder="you@example.com"
                  {...emailProps}
                  disabled={isLoading}
                  autoFocus
                  className={emailHasError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={emailHasError}
                  aria-describedby={emailHasError ? 'intel-email-error' : undefined}
                />
                {emailHasError && (
                  <p id="intel-email-error" className="text-sm text-destructive">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="cta"
                className="w-full"
                disabled={isLoading || !values.email.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Unlock & Access
                  </>
                )}
              </Button>
              
              <p className="text-xs text-slate-500 text-center">
                No spam. Just your document + helpful resources.
              </p>
            </form>
          </>
        )}
      </TrustModal>
    </Dialog>
  );
}
