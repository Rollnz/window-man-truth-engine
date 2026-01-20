import { useState } from 'react';
import { Phone, AlertTriangle, Check, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeadDetailData, PendingCall } from '@/hooks/useLeadDetail';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DispatchWindowManButtonProps {
  lead: LeadDetailData;
  pendingCalls: PendingCall[];
  onSuccess: () => void;
}

type DispatchState = 'idle' | 'dispatching' | 'success' | 'blocked' | 'warning';

interface BlockerInfo {
  type: string;
  message: string;
}

export function DispatchWindowManButton({ lead, pendingCalls, onSuccess }: DispatchWindowManButtonProps) {
  const [state, setState] = useState<DispatchState>('idle');
  const [blocker, setBlocker] = useState<BlockerInfo | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const { toast } = useToast();

  // Check if there's an active pending call
  const activePendingCall = pendingCalls.find(
    (pc) => ['pending', 'processing', 'called'].includes(pc.status) && pc.source_tool === 'manual_dispatch'
  );

  const handleDispatch = async (overrideWarnings = false) => {
    setState('dispatching');
    setBlocker(null);
    setWarning(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        setState('idle');
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enqueue-manual-call`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wm_lead_id: lead.id,
          reason: 'manual_dispatch',
          override_warnings: overrideWarnings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch call');
      }

      // Handle response states
      if (data.queued) {
        setState('success');
        toast({
          title: 'Call Dispatched',
          description: `WindowMan Agent will call in ~2 minutes`,
        });
        onSuccess();
        // Reset after animation
        setTimeout(() => setState('idle'), 3000);
      } else if (data.blocker) {
        setState('blocked');
        setBlocker(data.blocker);
      } else if (data.warning) {
        setState('warning');
        setWarning(data.warning);
        setShowWarningDialog(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch call';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setState('idle');
    }
  };

  const handleWarningConfirm = () => {
    setShowWarningDialog(false);
    handleDispatch(true);
  };

  const handleWarningCancel = () => {
    setShowWarningDialog(false);
    setState('idle');
    setWarning(null);
  };

  // Render based on state
  const renderContent = () => {
    // Show active call badge
    if (activePendingCall) {
      return (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Phone className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Call in Progress</p>
                <p className="text-xs text-muted-foreground">
                  Status: {activePendingCall.status}
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                <Clock className="h-3 w-3 mr-1" />
                Queued
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (state === 'blocked' && blocker) {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-destructive">Cannot Dispatch</p>
                <p className="text-xs text-muted-foreground">{blocker.message}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setState('idle')}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (state === 'success') {
      return (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-primary">Call Dispatched!</p>
                <p className="text-xs text-muted-foreground">WindowMan Agent will call shortly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Default: dispatch button
    return (
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <Button
            onClick={() => handleDispatch()}
            disabled={state === 'dispatching' || !lead.phone}
            className="w-full"
            variant="default"
          >
            {state === 'dispatching' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Dispatch WindowMan Agent
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {lead.phone ? 'Queues outbound call via Voice AI' : 'No phone number on file'}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {renderContent()}

      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Outside Business Hours
            </AlertDialogTitle>
            <AlertDialogDescription>
              {warning || 'It is currently outside 9am-9pm EST. Calls outside business hours may have lower answer rates.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleWarningCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWarningConfirm}>
              Dispatch Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
