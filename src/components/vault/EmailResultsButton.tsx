import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { trackEvent } from '@/lib/gtm';
import { SessionData } from '@/hooks/useSessionData';

interface EmailResultsButtonProps {
  sessionData: SessionData;
  userEmail?: string;
}

export function EmailResultsButton({ sessionData, userEmail }: EmailResultsButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  // Golden Thread: Get leadId for attribution
  const { leadId } = useLeadIdentity();

  const handleEmailResults = async () => {
    if (!userEmail) {
      toast({
        title: "No email found",
        description: "Please ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('email-vault-summary', {
        body: {
          email: userEmail,
          sessionData,
          // Golden Thread: Include leadId for attribution tracking
          leadId: leadId || undefined,
        },
      });

      if (error) throw error;

      setSent(true);

      // Golden Thread: Track event with lead_id
      trackEvent('vault_email_sent', {
        lead_id: leadId,
        has_session_data: !!sessionData,
      });

      toast({
        title: "Results sent!",
        description: `Your vault summary has been sent to ${userEmail}`,
      });

      // Reset sent state after 3 seconds
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to send",
        description: "There was an error sending your results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEmailResults}
      disabled={isSending || sent || !userEmail}
    >
      {sent ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2 text-primary" />
          Sent!
        </>
      ) : isSending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Mail className="w-4 h-4 mr-2" />
          Email My Results
        </>
      )}
    </Button>
  );
}
