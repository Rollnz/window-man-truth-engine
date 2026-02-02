import { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useCanonicalScore, getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { FileText, Check, Loader2, Shield } from 'lucide-react';
import { trackEvent, trackModalOpen, trackLeadSubmissionSuccess, trackLeadCapture, generateEventId } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getLeadAnchor, setLeadAnchor } from '@/lib/leadAnchor';
import { getAttributionData } from '@/lib/attribution';
import { TrustModal } from '@/components/forms/TrustModal';
import { NameInputPair, normalizeNameFields } from '@/components/ui/NameInputPair';

interface SampleReportAccessGateProps { isOpen: boolean; onClose: () => void; onSuccess: (leadId: string) => void; }

export function SampleReportAccessGate({ isOpen, onClose, onSuccess }: SampleReportAccessGateProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const { leadId: hookLeadId, setLeadId } = useLeadIdentity();
  const { sessionData, updateFields } = useSessionData();
  const { awardScore } = useCanonicalScore();
  const effectiveLeadId = hookLeadId || getLeadAnchor();
  const hasFiredTrackingRef = useRef(false);

  // Sync form fields from sessionData
  useEffect(() => { 
    if (sessionData.firstName) setFirstName(sessionData.firstName); 
    if (sessionData.lastName) setLastName(sessionData.lastName); 
    if (sessionData.phone) setPhone(sessionData.phone); 
  }, [sessionData]);

  const { values, hasError, getError, getFieldProps, validateAll, setValues } = useFormValidation({ 
    initialValues: { email: sessionData.email || '' }, 
    schemas: { email: commonSchemas.email } 
  });

  // Sync email from sessionData when it arrives
  useEffect(() => {
    if (sessionData.email) {
      setValues({ email: sessionData.email });
    }
  }, [sessionData.email, setValues]);

  // Track modal open only once per open
  useEffect(() => { 
    if (isOpen && !hasFiredTrackingRef.current) { 
      hasFiredTrackingRef.current = true;
      trackModalOpen({ modalName: 'sample_report_gate', sourceTool: 'sample-report' }); 
      trackEvent('sample_report_gate_opened', { 
        event_id: generateEventId(), 
        client_id: getOrCreateClientId(), 
        session_id: getOrCreateSessionId(), 
        external_id: effectiveLeadId || null, 
        source_tool: 'sample-report', 
        source_system: 'web' 
      }); 
    }
    if (!isOpen) {
      hasFiredTrackingRef.current = false;
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationResult = validateAll();
    if (!validationResult) { toast({ title: 'Invalid Email', description: getError('email') || 'Please enter a valid email', variant: 'destructive' }); return; }
    if (!firstName.trim() || !lastName.trim()) { toast({ title: 'Missing Information', description: 'Please enter your first and last name.', variant: 'destructive' }); return; }
    setIsLoading(true);
    const normalizedNames = normalizeNameFields(firstName, lastName);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-lead`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, 
        body: JSON.stringify({ 
          email: values.email.trim(), 
          firstName: normalizedNames.firstName, 
          lastName: normalizedNames.lastName, 
          phone: phone.trim() || null, 
          sourceTool: 'sample-report', 
          sessionId: getOrCreateSessionId(), 
          sessionData: { clientId: getOrCreateAnonId() }, 
          attribution: getAttributionData(), 
          leadId: effectiveLeadId || undefined 
        }) 
      });
      if (!response.ok) { 
        const errorData = await response.json().catch(() => ({})); 
        throw new Error(errorData.error || 'Failed to save'); 
      }
      const data = await response.json();
      if (data.success && data.leadId) {
        setIsSuccess(true); 
        setLeadId(data.leadId); 
        setLeadAnchor(data.leadId);
        updateFields({ 
          leadId: data.leadId, 
          firstName: normalizedNames.firstName, 
          lastName: normalizedNames.lastName, 
          email: values.email.trim(), 
          phone: phone.trim() || undefined 
        });
        
        // Fire-and-forget tracking - don't let tracking failures affect UI
        Promise.allSettled([
          awardScore({ eventType: 'LEAD_CAPTURED', sourceEntityType: 'lead', sourceEntityId: data.leadId }),
          trackLeadCapture({ leadId: data.leadId, sourceTool: 'sample_report', conversionAction: 'gate_unlock' }, values.email.trim(), phone.trim() || undefined, { hasName: true, hasPhone: !!phone.trim(), hasProjectDetails: false }),
          trackLeadSubmissionSuccess({ leadId: data.leadId, email: values.email.trim(), phone: phone.trim() || undefined, firstName: normalizedNames.firstName, lastName: normalizedNames.lastName, sourceTool: 'sample-report', eventId: `sample_report_gate:${data.leadId}`, value: 50 })
        ]).catch(err => console.warn('[tracking] Non-fatal tracking error:', err));
        
        toast({ title: 'Access Granted!', description: 'Enjoy the sample report.' });
        setTimeout(() => { onSuccess(data.leadId); }, 1200);
      } else { throw new Error(data.error || 'Failed to save'); }
    } catch (error) { 
      console.error('Sample report gate error:', error); 
      toast({ title: 'Unable to unlock', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' }); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const emailProps = getFieldProps('email'); 
  const emailHasError = hasError('email'); 
  const emailError = getError('email');
  const btnDisabled = isLoading || !values.email.trim() || !firstName.trim() || !lastName.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <TrustModal className="sm:max-w-md" modalTitle={isSuccess ? undefined : "View the Sample AI Report"} modalDescription={isSuccess ? undefined : "See exactly what the audit looks like before uploading anything."} headerAlign="center">
        {!isSuccess && <div className="flex justify-center mb-2 -mt-2"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div></div>}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-900">Access Granted!</h2>
            <p className="text-slate-600">Loading your sample report...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <NameInputPair firstName={firstName} lastName={lastName} onFirstNameChange={setFirstName} onLastNameChange={setLastName} disabled={isLoading} autoFocus />
            <div className="space-y-2">
              <Label htmlFor="email" className={`font-semibold text-slate-900 ${emailHasError ? 'text-destructive' : ''}`}>Email Address <span className="text-destructive">*</span></Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" {...emailProps} disabled={isLoading} className={emailHasError ? 'border-destructive focus-visible:ring-destructive' : ''} aria-invalid={emailHasError} aria-describedby={emailHasError ? 'email-error' : undefined} />
              {emailHasError && <p id="email-error" className="text-sm text-destructive">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold text-slate-900">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} disabled={isLoading} />
              <p className="text-xs text-muted-foreground">Only if you'd like a free call about the audit</p>
            </div>
            <Button type="submit" variant="cta" className="w-full" disabled={btnDisabled}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Unlocking...</>) : (<><Shield className="mr-2 h-4 w-4" />Unlock Sample Report</>)}
            </Button>
            <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" />100% Free</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" />No obligation</span>
            </div>
          </form>
        )}
      </TrustModal>
    </Dialog>
  );
}
