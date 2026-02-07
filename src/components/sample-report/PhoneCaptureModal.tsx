import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneNumber } from '@/hooks/useFormValidation';
import { useFormLock } from '@/hooks/forms';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { Phone, Check, Loader2, Shield } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { TrustModal } from '@/components/forms/TrustModal';

interface PhoneCaptureModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export function PhoneCaptureModal({ isOpen, onClose, onSuccess }: PhoneCaptureModalProps) {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const { updateField } = useSessionData();
  const { leadId } = useLeadIdentity();
  
  // Form lock for double-submit protection
  const { isLocked, lockAndExecute } = useFormLock();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) { toast({ title: 'Invalid Phone', description: 'Please enter a valid 10-digit phone number.', variant: 'destructive' }); return; }
    
    await lockAndExecute(async () => {
      if (leadId) {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-leads`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ id: leadId, updates: { phone: phone.trim() } }) });
        if (!response.ok) throw new Error('Failed to update phone');
      }
      updateField('phone', phone.trim());
      trackEvent('phone_captured_for_partner_share', { source: 'sample_report' });
      toast({ title: 'Phone Added!', description: 'You can now request better quote options.' });
      onSuccess();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <TrustModal className="sm:max-w-md" modalTitle="One More Step" modalDescription="To connect you with vetted partners, we need a phone number." headerAlign="center">
        <div className="flex justify-center mb-2 -mt-2"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Phone className="w-5 h-5 text-primary" /></div></div>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2"><Label htmlFor="phone" className="font-semibold text-foreground">Phone Number</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} disabled={isLocked} autoFocus /></div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50"><div className="flex items-start gap-2"><Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" /><p className="text-xs text-muted-foreground">Partners will only contact you if you approve. We never sell your info.</p></div></div>
          <Button type="submit" variant="cta" className="w-full" disabled={isLocked || phone.replace(/\D/g, '').length < 10}>{isLocked ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : (<><Check className="mr-2 h-4 w-4" />Continue to Partner Options</>)}</Button>
          <button type="button" onClick={onClose} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">Skip for now</button>
        </form>
      </TrustModal>
    </Dialog>
  );
}
