import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { getSourceToolLabel } from '@/constants/sourceToolLabels';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type DialogState = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';

interface TestCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agent: { source_tool: string; agent_id: string } | null;
  onTestCall: (source_tool: string, phone_number: string) => Promise<{
    test_call_id: string;
    provider_call_id?: string | null;
  }>;
}

interface TestCallResult {
  test_call_id: string;
  provider_call_id?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Phone Validation Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize phone input for validation.
 * Strips spaces, dashes, parentheses and prepends + if missing.
 */
function sanitizePhone(input: string): string {
  // Strip spaces, dashes, parentheses
  let cleaned = input.replace(/[\s\-()]/g, '');
  
  // If doesn't start with +, prepend it
  if (cleaned && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate E.164 format: +[1-9][0-9]{1,14}
 */
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function TestCallDialog({
  isOpen,
  onClose,
  agent,
  onTestCall,
}: TestCallDialogProps) {
  // State
  const [state, setState] = useState<DialogState>('IDLE');
  const [phoneInput, setPhoneInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TestCallResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Derived validation state
  const sanitizedPhone = sanitizePhone(phoneInput);
  const isValid = isValidE164(sanitizedPhone);
  const isEmpty = phoneInput.trim() === '';

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setState('IDLE');
      setPhoneInput('');
      setErrorMessage(null);
      setResult(null);
      setCopied(false);
    }
  }, [isOpen]);

  // Handle dispatch
  const handleDispatch = useCallback(async () => {
    if (!agent || !isValid) return;

    setState('LOADING');
    setErrorMessage(null);

    try {
      const response = await onTestCall(agent.source_tool, sanitizedPhone);
      setResult(response);
      setState('SUCCESS');
      toast.success('Test call dispatched successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch test call';
      setErrorMessage(message);
      setState('ERROR');
      toast.error(`Failed to dispatch: ${message}`);
    }
  }, [agent, sanitizedPhone, isValid, onTestCall]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    const idToCopy = result?.provider_call_id || result?.test_call_id;
    if (!idToCopy) return;

    try {
      await navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [result]);

  // Early return if no agent
  if (!agent) return null;

  const agentLabel = getSourceToolLabel(agent.source_tool);
  const maskedAgentId = agent.agent_id.length > 8
    ? `${agent.agent_id.slice(0, 8)}...`
    : agent.agent_id;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* SUCCESS STATE */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {state === 'SUCCESS' && result && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle>Call Dispatched</DialogTitle>
              <DialogDescription>
                Your test call has been queued successfully
              </DialogDescription>
            </DialogHeader>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <Label className="text-xs text-muted-foreground">
                  {result.provider_call_id ? 'Provider Call ID' : 'Test Call ID'}
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 font-mono text-sm bg-muted px-2 py-1 rounded break-all">
                    {result.provider_call_id || result.test_call_id}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* IDLE / LOADING / ERROR STATES */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {state !== 'SUCCESS' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Test Call — {agentLabel}
              </DialogTitle>
              <DialogDescription>
                Agent: {maskedAgentId}
              </DialogDescription>
            </DialogHeader>

            {/* Error Banner */}
            {state === 'ERROR' && errorMessage && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone-input">Phone Number</Label>
              <div className="relative">
                <Input
                  id="phone-input"
                  type="tel"
                  placeholder="+12125551234"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  disabled={state === 'LOADING'}
                  className="pr-10"
                  autoComplete="off"
                />
                {/* Validation Icons */}
                {!isEmpty && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {/* Validation Error Text */}
              {!isEmpty && !isValid && (
                <p className="text-xs text-destructive">
                  Must be E.164 format (e.g. +12125551234)
                </p>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={state === 'LOADING'}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDispatch}
                disabled={isEmpty || !isValid || state === 'LOADING'}
              >
                {state === 'LOADING' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Dispatching...
                  </>
                ) : state === 'ERROR' ? (
                  'Retry'
                ) : (
                  'Dispatch Test Call'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
