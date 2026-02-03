import { useState, useEffect } from 'react';
import { Check, X, Pencil, Loader2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { getSourceToolLabel } from '@/constants/sourceToolLabels';
import { copyToClipboard } from '@/utils/clipboard';

type EditorState = 'VIEWING' | 'EDITING' | 'SAVING' | 'ERROR';

interface AgentIdEditorProps {
  source_tool: string;
  current_agent_id: string;
  onSave: (source_tool: string, agent_id: string) => Promise<void>;
}

// Validation: agent_ followed by lowercase letters or numbers only
const AGENT_ID_REGEX = /^agent_[a-z0-9]+$/;
const PLACEHOLDER_ID = 'PLACEHOLDER_AGENT_ID';

export function AgentIdEditor({
  source_tool,
  current_agent_id,
  onSave,
}: AgentIdEditorProps) {
  const [state, setState] = useState<EditorState>('VIEWING');
  const [inputValue, setInputValue] = useState(current_agent_id);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset input value when current_agent_id changes externally
  useEffect(() => {
    if (state === 'VIEWING') {
      setInputValue(current_agent_id);
    }
  }, [current_agent_id, state]);

  const label = getSourceToolLabel(source_tool);
  const maskedId = current_agent_id.length > 8
    ? `${current_agent_id.slice(0, 8)}...`
    : current_agent_id;

  // Validation logic (runs on every keystroke)
  const isEmpty = inputValue.trim() === '';
  const passesFormat = AGENT_ID_REGEX.test(inputValue);
  const isNotPlaceholder = inputValue !== PLACEHOLDER_ID;
  const isValid = passesFormat && isNotPlaceholder;

  // Deep link eligibility: valid format AND not placeholder
  const canShowDeepLink = AGENT_ID_REGEX.test(current_agent_id) && current_agent_id !== PLACEHOLDER_ID;

  // Determine which error to show (format takes priority)
  let errorMessage: string | null = null;
  if (!isEmpty && !passesFormat) {
    errorMessage = 'Format: agent_ followed by lowercase letters or numbers only';
  } else if (!isEmpty && !isNotPlaceholder) {
    errorMessage = 'Replace with your real ID from PhoneCall.bot → Agents → Settings';
  }

  const handleStartEdit = () => {
    setInputValue(current_agent_id);
    setServerError(null);
    setState('EDITING');
  };

  const handleCancel = () => {
    setInputValue(current_agent_id);
    setServerError(null);
    setState('VIEWING');
  };

  const handleSave = async () => {
    setState('SAVING');
    setServerError(null);

    try {
      await onSave(source_tool, inputValue);
      toast({
        title: 'Success',
        description: `Agent ID updated for ${label}`,
      });
      setState('VIEWING');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setServerError(message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save: ${message}`,
      });
      setState('ERROR');
    }
  };

  const handleCopyAgentId = async () => {
    await copyToClipboard(current_agent_id);
    toast({
      title: 'Copied',
      description: 'Agent ID copied',
    });
  };

  // VIEWING state
  if (state === 'VIEWING') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Agent ID:</span>
        <span className="font-mono text-sm text-foreground">{maskedId}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleStartEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopyAgentId}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        {canShowDeepLink && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={`https://app.phonecall.bot/agents/all?id=${current_agent_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>View on PhoneCall.bot</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // EDITING, SAVING, or ERROR states
  return (
    <div className="space-y-2">
      {/* Server error banner (ERROR state) */}
      {serverError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2 rounded">
          {serverError}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Agent ID:</span>
      </div>

      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={state === 'SAVING'}
          className="pr-8 font-mono text-sm"
          placeholder="agent_abc123..."
        />
        {/* Validation icon */}
        {!isEmpty && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>

      {/* Validation error text */}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isEmpty || !isValid || state === 'SAVING'}
        >
          {state === 'SAVING' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
        {state !== 'SAVING' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
