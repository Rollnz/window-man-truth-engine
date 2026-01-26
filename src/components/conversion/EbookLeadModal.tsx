// ============================================
// Ebook Lead Capture Modal
// 2x2 layout: First Name* | Last Name, Email* | Phone
// For ebook/guide downloads across the site
// ============================================

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useCanonicalScore, getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { Download, Check, Loader2 } from 'lucide-react';
import { trackEvent, trackModalOpen, trackLeadSubmissionSuccess, trackFormStart, trackLeadCapture, generateEventId } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getLeadAnchor } from '@/lib/leadAnchor';
import { getAttributionData, buildAIContextFromSession } from '@/lib/attribution';
import { SourceTool } from '@/types/sourceTool';
import { TrustModal } from '@/components/forms/TrustModal';
import { normalizeNameFields } from '@/components/ui/NameInputPair';

export interface EbookConfig {
  title: string;
  description: string;
  buttonText: string;
  successTitle: string;
  successDescription: string;
}

interface EbookLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leadId: string) => void;
  sourceTool: SourceTool;
  config: EbookConfig;
}

export function EbookLeadModal({
  isOpen,
  onClose,
  onSuccess,
  sourceTool,
  config,
}: EbookLeadModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [modalOpenTime, setModalOpenTime] = useState<number>(0);

  const { sessionData, updateFields } = useSessionData();
  const { leadId: hookLeadId, setLeadId } = useLeadIdentity();
  const { awardScore } = useCanonicalScore();

  const { values, hasError, getError, getFieldProps, validateAll, setValue } = useFormValidation({
    initialValues: { 
      firstName: sessionData.firstName || '',
      email: sessionData.email || '',
    },
    schemas: { 
      firstName: commonSchemas.firstName,
      email: commonSchemas.email,
    },
  });

  // Pre-fill from session data
  useEffect(() => {
    if (sessionData.firstName) setValue('firstName', sessionData.firstName);
    if (sessionData.email) setValue('email', sessionData.email);
    if (sessionData.lastName) setLastName(sessionData.lastName);
    if (sessionData.phone) setPhone(sessionData.phone);
  }, [sessionData, setValue]);

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      const now = Date.now();
      setModalOpenTime(now);

      trackModalOpen({ modalName: 'ebook_lead', sourceTool });
      
      const externalId = hookLeadId || getLeadAnchor() || null;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'ebook_modal_opened',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: externalId,
        source_tool: sourceTool,
        source_system: 'web',
        modal_name: 'ebook_lead',
      });
    }
  }, [isOpen, sourceTool, hookLeadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast({
        title: 'Required Fields Missing',
        description: 'Please enter your first name and email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const normalizedNames = normalizeNameFields(values.firstName, lastName);

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
            firstName: normalizedNames.firstName || null,
            lastName: normalizedNames.lastName || null,
            phone: phone.trim() || null,
            sourceTool,
            sessionData: {
              ...(sessionData || {}),
              clientId: getOrCreateAnonId(),
            },
            attribution: getAttributionData(),
            aiContext: buildAIContextFromSession(sessionData, sourceTool),
            leadId: hookLeadId || undefined,
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

        setLeadId(data.leadId);
        updateFields({ leadId: data.leadId });
        
        // Award score for lead capture
        await awardScore({
          eventType: 'LEAD_CAPTURED',
          sourceEntityType: 'lead',
          sourceEntityId: data.leadId,
        });
        
        // Enriched dataLayer push
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'ebook_form_completed',
          event_id: generateEventId(),
          client_id: getOrCreateClientId(),
          session_id: getOrCreateSessionId(),
          external_id: data.leadId,
          source_tool: sourceTool,
          source_system: 'web',
          form_name: 'ebook_lead',
          user_data: {
            first_name: normalizedNames.firstName,
            last_name: normalizedNames.lastName || undefined,
          },
        });

        // Track lead capture
        await trackLeadCapture(
          {
            leadId: data.leadId,
            sourceTool: sourceTool.replace(/-/g, '_') as any,
            conversionAction: 'ebook_download',
          },
          values.email.trim(),
          phone.trim() || undefined,
          {
            hasName: !!normalizedNames.firstName,
            hasPhone: !!phone.trim(),
          }
        );

        // Track with value
        await trackLeadSubmissionSuccess({
          leadId: data.leadId,
          email: values.email.trim(),
          phone: phone.trim() || undefined,
          firstName: normalizedNames.firstName,
          lastName: normalizedNames.lastName || undefined,
          sourceTool,
          eventId: `lead_captured:${data.leadId}`,
          value: 100,
        });

        toast({
          title: config.successTitle,
          description: config.successDescription,
        });

        setTimeout(() => {
          onSuccess(data.leadId);
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Ebook lead capture error:', error);
      toast({
        title: 'Unable to save',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      if (!isSuccess && modalOpenTime > 0) {
        const timeSpent = Math.round((Date.now() - modalOpenTime) / 1000);
        trackEvent('modal_abandon', {
          modal_type: 'ebook_lead',
          source_tool: sourceTool,
          time_spent_seconds: timeSpent,
        });
      }

      setIsSuccess(false);
      onClose();
    }
  };

  const handleFirstFieldFocus = () => {
    trackFormStart({ formName: 'ebook_lead', sourceTool });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <TrustModal 
        className="sm:max-w-md"
        modalTitle={isSuccess ? undefined : config.title}
        modalDescription={isSuccess ? undefined : config.description}
        headerAlign="center"
      >
        {/* Download icon above title */}
        {!isSuccess && (
          <div className="flex justify-center mb-2 -mt-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Download className="w-4 h-4 text-primary" />
            </div>
          </div>
        )}
        
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">{config.successTitle}</h2>
            <p className="text-muted-foreground">{config.successDescription}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Row 1: First Name* | Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className={`font-semibold text-foreground ${hasError('firstName') ? 'text-destructive' : ''}`}>
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="John"
                  {...getFieldProps('firstName')}
                  disabled={isLoading}
                  autoFocus
                  onFocus={handleFirstFieldFocus}
                  className={hasError('firstName') ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={hasError('firstName')}
                />
                {hasError('firstName') && (
                  <p className="text-xs text-destructive">{getError('firstName')}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-semibold text-foreground">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Row 2: Email* | Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email" className={`font-semibold text-foreground ${hasError('email') ? 'text-destructive' : ''}`}>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  {...getFieldProps('email')}
                  disabled={isLoading}
                  className={hasError('email') ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={hasError('email')}
                />
                {hasError('email') && (
                  <p className="text-xs text-destructive">{getError('email')}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-semibold text-foreground">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="cta"
              className="w-full"
              disabled={isLoading || !values.firstName.trim() || !values.email.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {config.buttonText}
                </>
              )}
            </Button>
          </form>
        )}
      </TrustModal>
    </Dialog>
  );
}

// Pre-configured ebook configs for reuse
export const EBOOK_CONFIGS: Record<string, EbookConfig> = {
  'spec-checklist-guide': {
    title: 'Get Your Free Audit Checklist',
    description: 'Enter your details below to download your 35-page Pre-Installation Audit Checklist instantly.',
    buttonText: 'Download My Free Checklist',
    successTitle: 'Checklist Unlocked!',
    successDescription: 'Check your email! Your Pre-Installation Audit Checklist is on its way.',
  },
  'kitchen-table-guide': {
    title: 'Get Your Free Kitchen Table Guide',
    description: 'Enter your details to download the complete negotiation playbook.',
    buttonText: 'Download My Free Guide',
    successTitle: 'Guide Unlocked!',
    successDescription: 'Check your email for your Kitchen Table Negotiation Guide.',
  },
  'sales-tactics-guide': {
    title: 'Get Your Free Sales Tactics Guide',
    description: 'Enter your details to download the sales tactics decoder.',
    buttonText: 'Download My Free Guide',
    successTitle: 'Guide Unlocked!',
    successDescription: 'Check your email for your Sales Tactics Guide.',
  },
  'insurance-savings-guide': {
    title: 'Get Your Insurance Savings Guide',
    description: 'Enter your details to download strategies that could save you thousands.',
    buttonText: 'Download My Free Guide',
    successTitle: 'Guide Unlocked!',
    successDescription: 'Check your email for your Insurance Savings Guide.',
  },
};
