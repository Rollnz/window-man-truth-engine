import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/gtm';
import { toast } from 'sonner';
import { normalizeToE164 } from '@/lib/phoneFormat';

interface UsePhoneCaptureReturn {
  isCapturingPhone: boolean;
  capturePhone: (phone: string, leadId: string, trigger: string) => Promise<boolean>;
}

/**
 * Phone Capture Hook
 * 
 * Handles phone collection with E.164 normalization + attribution tracking
 * Triggers: 'partner_share', 'consultation_request', 'callback_request', 'gate_capture'
 * 
 * @example
 * const { isCapturingPhone, capturePhone } = usePhoneCapture();
 * 
 * const handlePhoneSubmit = async (phone: string) => {
 *   const success = await capturePhone(phone, leadId, 'partner_share');
 *   if (success) { // proceed }
 * };
 */
export function usePhoneCapture(): UsePhoneCaptureReturn {
  const [isCapturingPhone, setIsCapturingPhone] = useState(false);

  const capturePhone = async (
    phone: string, 
    leadId: string, 
    trigger: string
  ): Promise<boolean> => {
    setIsCapturingPhone(true);

    try {
      // Normalize to E.164 format
      const formattedPhone = normalizeToE164(phone);
      
      if (!formattedPhone) {
        toast.error('Please enter a valid phone number');
        setIsCapturingPhone(false);
        return false;
      }

      // Update lead record with phone
      const { error } = await supabase
        .from('leads')
        .update({ 
          phone: formattedPhone,
        })
        .eq('id', leadId);

      if (error) throw error;

      // Track capture event
      trackEvent('sample_report_phone_captured', {
        trigger,
        lead_id: leadId
      });

      toast.success('Phone number saved');
      return true;

    } catch (error) {
      console.error('Phone capture error:', error);
      toast.error('Failed to save phone number');
      
      trackEvent('sample_report_phone_error', {
        trigger,
        lead_id: leadId,
        error_message: error instanceof Error ? error.message : 'unknown'
      });
      
      return false;
    } finally {
      setIsCapturingPhone(false);
    }
  };

  return {
    isCapturingPhone,
    capturePhone
  };
}
