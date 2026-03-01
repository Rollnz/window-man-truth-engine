import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Activity } from 'lucide-react';

const TEST_PHONE = '+12038567938';

function isDevEnvironment(): boolean {
  const host = window.location.hostname;
  return host === 'localhost' || host.endsWith('.lovable.app');
}

export function TwilioDiagnostic() {
  const [loading, setLoading] = useState(false);

  if (!isDevEnvironment()) return null;

  const handleTest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: TEST_PHONE });

      if (!error) {
        toast.success(`Handshake Verified! SMS Sent to ${TEST_PHONE}.`);
        return;
      }

      const msg = error.message.toLowerCase();

      if (msg.includes('credentials') || msg.includes('sid') || msg.includes('authenticate')) {
        toast.error('Twilio Auth Failed: Check Account SID/Token in Supabase Dashboard.');
      } else if (msg.includes('unverified') || msg.includes('not a valid')) {
        toast.error("Twilio Trial Error: This number isn't verified in your Twilio Console yet.");
      } else if (msg.includes('provider') && msg.includes('not enabled')) {
        toast.error('Supabase Error: Go to Auth -> Providers -> Phone and toggle it ON.');
      } else {
        toast.error(error.message);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTest}
      disabled={loading}
      className="fixed bottom-24 right-4 z-30 flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/60 px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      <Activity className="h-3 w-3" />
      {loading ? 'Testing…' : 'System Health: Twilio'}
    </button>
  );
}
