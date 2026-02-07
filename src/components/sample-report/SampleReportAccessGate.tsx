import { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { useFormLock } from '@/hooks/forms';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useCanonicalScore, getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { useProgressiveGate } from '@/hooks/useProgressiveGate';
import { FileText, Check, Loader2, Shield, AlertCircle, Lock } from 'lucide-react';
import { trackEvent, trackModalOpen, trackLeadSubmissionSuccess, trackLeadCapture, generateEventId } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getLeadAnchor, setLeadAnchor } from '@/lib/leadAnchor';
import { getAttributionData } from '@/lib/attribution';
import { TrustModal } from '@/components/forms/TrustModal';
import { NameInputPair, normalizeNameFields } from '@/components/ui/NameInputPair';
import { cn } from '@/lib/utils';

interface SampleReportAccessGateProps { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (leadId: string) => void; 
}

/**
 * Progressive Hardening Lead Capture Gate
 * 
 * Implements 3-level escalation to maximize conversions while
 * maintaining brand alignment with consumer advocacy positioning.
 * 
 * Required Fields: firstName, lastName, email
 * Optional Field: phone (captured separately for high-intent signals)
 */
export function SampleReportAccessGate({ isOpen, onClose, onSuccess }: SampleReportAccessGateProps) {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const { leadId: hookLeadId, setLeadId } = useLeadIdentity();
  const { sessionData, updateFields } = useSessionData();
  const { awardScore } = useCanonicalScore();
  const effectiveLeadId = hookLeadId || getLeadAnchor();
  const hasFiredTrackingRef = useRef(false);
  
  // Form lock for double-submit protection
  const { isLocked, lockAndExecute } = useFormLock();

  // Progressive gate logic
  const {
    lockLevel,
    attemptCount,
    handleCloseAttempt,
    handleComplete,
    resetGate
  } = useProgressiveGate({
    onComplete: (leadId) => {
      onSuccess(leadId);
    }
  });

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
      // Reset gate when modal closes (for next visit)
      resetGate();
    }
  }, [isOpen, effectiveLeadId, resetGate]);

  // Browser back button prevention when gate is locked
  useEffect(() => {
    if (isOpen && lockLevel !== 'soft') {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
        handleCloseAttempt();
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen, lockLevel, handleCloseAttempt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationResult = validateAll();
    if (!validationResult) { 
      toast({ title: 'Invalid Email', description: getError('email') || 'Please enter a valid email', variant: 'destructive' }); 
      trackEvent('sample_report_gate_error', { 
        error_message: 'validation_email', 
        attempt_number: attemptCount + 1,
        lock_level: lockLevel
      });
      return; 
    }
    if (!firstName.trim() || !lastName.trim()) { 
      toast({ title: 'Missing Information', description: 'Please enter your first and last name.', variant: 'destructive' }); 
      trackEvent('sample_report_gate_error', { 
        error_message: 'validation_name', 
        attempt_number: attemptCount + 1,
        lock_level: lockLevel
      });
      return; 
    }
    
    await lockAndExecute(async () => {
      const normalizedNames = normalizeNameFields(firstName, lastName);
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
        
        // Fire progressive gate completion tracking
        handleComplete(data.leadId);
        
        // Fire-and-forget tracking - don't let tracking failures affect UI
        Promise.allSettled([
          awardScore({ eventType: 'LEAD_CAPTURED', sourceEntityType: 'lead', sourceEntityId: data.leadId }),
          trackLeadCapture({ leadId: data.leadId, sourceTool: 'sample_report', conversionAction: 'gate_unlock' }, values.email.trim(), phone.trim() || undefined, { hasName: true, hasPhone: !!phone.trim(), hasProjectDetails: false }),
          trackLeadSubmissionSuccess({ leadId: data.leadId, email: values.email.trim(), phone: phone.trim() || undefined, firstName: normalizedNames.firstName, lastName: normalizedNames.lastName, sourceTool: 'sample-report', eventId: `sample_report_gate:${data.leadId}`, value: 50 })
        ]).catch(err => console.warn('[tracking] Non-fatal tracking error:', err));
        
        toast({ title: 'Access Granted!', description: 'Enjoy the sample report.' });
        setTimeout(() => { onSuccess(data.leadId); }, 1200);
      } else { throw new Error(data.error || 'Failed to save'); }
    });
  };

  // Handle dialog close attempt
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // User is trying to close
      if (lockLevel === 'soft') {
        // First attempt - escalate to medium
        handleCloseAttempt();
      } else {
        // Medium/Hard - just fire the attempt handler (shows toast)
        handleCloseAttempt();
      }
      // Don't actually close the dialog - gate stays open
    }
  };

  const emailProps = getFieldProps('email'); 
  const emailHasError = hasError('email'); 
  const emailError = getError('email');
  const btnDisabled = isLocked || !values.email.trim() || !firstName.trim() || !lastName.trim();

  // Dynamic header content based on lock level
  const getHeaderContent = () => {
    switch (lockLevel) {
      case 'soft':
        return {
          icon: FileText,
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          title: 'View the Sample AI Report',
          description: 'See exactly what the audit looks like before uploading anything.'
        };
      case 'medium':
        return {
          icon: AlertCircle,
          iconColor: 'text-orange-600',
          iconBg: 'bg-orange-100',
          title: 'Just Need Your Email',
          description: 'We\'ll send you this report. No spam, ever. Takes 30 seconds.'
        };
      case 'hard':
        return {
          icon: Lock,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          title: 'Complete to Access Report',
          description: 'Required to view the full sample analysis.'
        };
    }
  };

  const headerContent = getHeaderContent();
  const IconComponent = headerContent.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <TrustModal 
        className="sm:max-w-md" 
        modalTitle={isSuccess ? undefined : headerContent.title} 
        modalDescription={isSuccess ? undefined : headerContent.description} 
        headerAlign="center"
        lockLevel={lockLevel}
        onCloseAttempt={handleCloseAttempt}
      >
        {/* Dynamic Icon */}
        {!isSuccess && (
          <div className="flex justify-center mb-2 -mt-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", headerContent.iconBg)}>
              <IconComponent className={cn("w-5 h-5", headerContent.iconColor)} />
            </div>
          </div>
        )}

        {/* Urgency Context (Medium+ Lock Levels) */}
        {!isSuccess && lockLevel !== 'soft' && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            {lockLevel === 'medium' && (
              <p className="text-sm text-amber-800">
                <strong>Why we ask:</strong> This report takes time to create. 
                Your email lets us send you the full analysis and keep you updated 
                on how to protect your windows investment.
              </p>
            )}
            {lockLevel === 'hard' && (
              <p className="text-sm text-amber-900 font-medium">
                <strong>Final step:</strong> Complete this form to unlock the 
                sample report and see exactly how our AI audit protects homeowners.
              </p>
            )}
          </div>
        )}

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
            <NameInputPair firstName={firstName} lastName={lastName} onFirstNameChange={setFirstName} onLastNameChange={setLastName} disabled={isLocked} autoFocus />
            <div className="space-y-2">
              <Label htmlFor="email" className={`font-semibold text-foreground ${emailHasError ? 'text-destructive' : ''}`}>Email Address <span className="text-destructive">*</span></Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" {...emailProps} disabled={isLocked} className={emailHasError ? 'border-destructive focus-visible:ring-destructive' : ''} aria-invalid={emailHasError} aria-describedby={emailHasError ? 'email-error' : undefined} />
              {emailHasError && <p id="email-error" className="text-sm text-destructive">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold text-foreground">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} disabled={isLocked} />
              <p className="text-xs text-muted-foreground">Only if you'd like a free call about the audit</p>
            </div>
            <Button type="submit" variant="cta" className="w-full" disabled={btnDisabled}>
              {isLocked ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Unlocking...</>) : (<><Shield className="mr-2 h-4 w-4" />Unlock Sample Report</>)}
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
