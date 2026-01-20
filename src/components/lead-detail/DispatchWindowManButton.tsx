import { useState } from 'react';
import { Phone, AlertTriangle, Check, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeadDetailData, PendingCall } from '@/hooks/useLeadDetail';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface DispatchWindowManButtonProps {
  lead: LeadDetailData;
  pendingCalls: PendingCall[];
  onSuccess: () => void;
}

type DispatchState = 'idle' | 'dispatching' | 'success' | 'error';

interface DirectDialResponse {
  ok: boolean;
  provider_http_status: number;
  provider_call_id?: string | null;
  response_preview: string;
  agent_id_used: string;
  warnings?: string[];
  code?: string;
  error?: string;
}

export function DispatchWindowManButton({ lead, pendingCalls, onSuccess }: DispatchWindowManButtonProps) {
  const [state, setState] = useState<DispatchState>('idle');
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [response, setResponse] = useState<DirectDialResponse | null>(null);
  const [showFullResponse, setShowFullResponse] = useState(false);
  const { toast } = useToast();

  // Only block if there's a truly pending/processing call (not yet dispatched)
  // 'called' means it was already sent to provider - user can retry
  const activePendingCall = pendingCalls.find(
    (pc) => ['pending', 'processing'].includes(pc.status) && pc.source_tool === 'manual_dispatch'
  );

  const handleDispatch = async () => {
    setState('dispatching');
    setResponse(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        setState('idle');
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-direct-dial`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wm_lead_id: lead.id }),
      });

      const data: DirectDialResponse = await res.json();
      setResponse(data);
      setShowResponseDialog(true);

      if (data.ok) {
        setState('success');
        toast({
          title: 'Call Initiated',
          description: `Provider returned ${data.provider_http_status}`,
        });
        onSuccess();
        setTimeout(() => setState('idle'), 3000);
      } else {
        setState('error');
        toast({
          title: 'Call Failed',
          description: data.error || `HTTP ${data.provider_http_status}`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch call';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setState('error');
      setResponse({
        ok: false,
        provider_http_status: 0,
        response_preview: message,
        agent_id_used: 'unknown',
        error: message,
      });
      setShowResponseDialog(true);
    }
  };

  const renderContent = () => {
    // Show active call badge (from queue system, if any)
    if (activePendingCall && state === 'idle') {
      return (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Phone className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Call in Queue</p>
                <p className="text-xs text-muted-foreground">
                  Status: {activePendingCall.status}
                </p>
              </div>
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
                <p className="font-medium text-sm text-primary">Call Sent!</p>
                <p className="text-xs text-muted-foreground">Check response dialog for details</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (state === 'error') {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-destructive">Call Failed</p>
                <p className="text-xs text-muted-foreground">
                  {response?.error || 'Check response dialog for details'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setState('idle')}>
                Retry
              </Button>
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
            onClick={handleDispatch}
            disabled={state === 'dispatching' || !lead.phone}
            className="w-full"
            variant="default"
          >
            {state === 'dispatching' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calling...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Dispatcher
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {lead.phone ? 'Immediate outbound call via Voice AI' : 'No phone number on file'}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {renderContent()}

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {response?.ok ? (
                <Check className="h-5 w-5 text-primary" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              Provider Response
            </DialogTitle>
            <DialogDescription>
              Direct dial result from PhoneCall.bot
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Row */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">HTTP Status</span>
              <Badge variant={response?.ok ? 'default' : 'destructive'}>
                {response?.provider_http_status || 0}
              </Badge>
            </div>

            {/* Provider Call ID */}
            {response?.provider_call_id && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Provider Call ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {response.provider_call_id}
                </code>
              </div>
            )}

            {/* Agent ID */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Agent Used</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {response?.agent_id_used || 'unknown'}
              </code>
            </div>

            {/* Warnings */}
            {response?.warnings && response.warnings.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-destructive">Warnings</span>
                {response.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* Response Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Body</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullResponse(!showFullResponse)}
                  className="h-6 px-2 text-xs"
                >
                  {showFullResponse ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Expand
                    </>
                  )}
                </Button>
              </div>
              <pre className={`text-xs bg-muted p-3 rounded overflow-x-auto font-mono whitespace-pre-wrap ${
                showFullResponse ? 'max-h-80' : 'max-h-24'
              } overflow-y-auto`}>
                {response?.response_preview || 'No response'}
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
