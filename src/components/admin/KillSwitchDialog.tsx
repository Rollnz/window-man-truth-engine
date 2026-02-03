import { useState } from 'react';
import { Check, Loader2, Power } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

type DialogState = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';

interface KillSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ disabled_count: number }>;
  enabledAgentCount: number;
}

export function KillSwitchDialog({
  isOpen,
  onClose,
  onConfirm,
  enabledAgentCount,
}: KillSwitchDialogProps) {
  const [state, setState] = useState<DialogState>('IDLE');
  const [inputValue, setInputValue] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [disabledCount, setDisabledCount] = useState(0);

  // Exact string match - case-sensitive, no trimming
  const isConfirmValid = inputValue === 'DISABLE';

  const handleConfirm = async () => {
    setState('LOADING');
    setServerError(null);

    try {
      const result = await onConfirm();
      setDisabledCount(result.disabled_count);
      toast({
        variant: 'destructive',
        title: 'Kill switch activated',
        description: `${result.disabled_count} agent(s) disabled.`,
      });
      setState('SUCCESS');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setServerError(message);
      toast({
        variant: 'destructive',
        title: 'Kill switch failed',
        description: message,
      });
      setState('ERROR');
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setState('IDLE');
    setInputValue('');
    setServerError(null);
    setDisabledCount(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Power className="h-5 w-5" />
            System Kill Switch
          </DialogTitle>
        </DialogHeader>

        {/* IDLE / ERROR State */}
        {(state === 'IDLE' || state === 'ERROR') && (
          <div className="space-y-4">
            {/* Server error banner */}
            {serverError && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2 rounded">
                {serverError}
              </div>
            )}

            {/* Warning text */}
            <p className="text-sm text-muted-foreground">
              This will disable all{' '}
              <span className="font-semibold text-foreground">
                {enabledAgentCount}
              </span>{' '}
              active agent(s). Zero calls will dispatch until each agent is
              re-enabled individually.
            </p>

            {/* Confirmation input */}
            <div className="space-y-2">
              <Label htmlFor="kill-confirm">
                Type <span className="font-mono font-bold">DISABLE</span> to
                confirm
              </Label>
              <Input
                id="kill-confirm"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="DISABLE"
                className="font-mono"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={!isConfirmValid}
              >
                Confirm — Disable All Agents
              </Button>
            </div>
          </div>
        )}

        {/* LOADING State */}
        {state === 'LOADING' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Disabling all active agents...
            </p>

            <div className="space-y-2">
              <Label htmlFor="kill-confirm-loading">
                Type <span className="font-mono font-bold">DISABLE</span> to
                confirm
              </Label>
              <Input
                id="kill-confirm-loading"
                type="text"
                value="DISABLE"
                className="font-mono"
                disabled
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="destructive" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Disabling...
              </Button>
            </div>
          </div>
        )}

        {/* SUCCESS State */}
        {state === 'SUCCESS' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold">
                {disabledCount} agent(s) disabled.
              </p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Re-enable agents individually from the Command Center.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
