import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { getSourceToolLabel } from '@/constants/sourceToolLabels';
import { toast } from '@/hooks/use-toast';

interface AgentNameEditorProps {
  source_tool: string;
  current_agent_name: string;
  onSave: (source_tool: string, agent_name: string) => Promise<void>;
}

type EditorState = 'VIEWING' | 'EDITING' | 'SAVING' | 'ERROR';

const MAX_LENGTH = 100;

export function AgentNameEditor({
  source_tool,
  current_agent_name,
  onSave,
}: AgentNameEditorProps) {
  const [state, setState] = useState<EditorState>('VIEWING');
  const [inputValue, setInputValue] = useState(current_agent_name);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOverLimit = inputValue.length > MAX_LENGTH;
  const isValid = inputValue.length <= MAX_LENGTH;
  const hasContent = inputValue.length > 0;

  const handleEditClick = () => {
    setInputValue(current_agent_name);
    setErrorMessage(null);
    setState('EDITING');
  };

  const handleCancel = () => {
    setInputValue(current_agent_name);
    setErrorMessage(null);
    setState('VIEWING');
  };

  const handleSave = async () => {
    if (isOverLimit) return;

    setState('SAVING');
    setErrorMessage(null);

    try {
      await onSave(source_tool, inputValue);
      toast({
        title: 'Success',
        description: `Name updated for ${getSourceToolLabel(source_tool)}`,
      });
      setState('VIEWING');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save name: ${message}`,
      });
      setState('ERROR');
    }
  };

  // VIEWING state
  if (state === 'VIEWING') {
    return (
      <div className="flex items-center gap-2">
        {current_agent_name ? (
          <span className="text-sm text-foreground">{current_agent_name}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">Add a name...</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleEditClick}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // EDITING, SAVING, or ERROR state
  return (
    <div className="space-y-2">
      {/* Error banner for ERROR state */}
      {state === 'ERROR' && errorMessage && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={state === 'SAVING'}
            className={`pr-8 ${isOverLimit ? 'border-destructive' : ''}`}
            placeholder=""
          />
          {/* Validation icon */}
          {hasContent && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isOverLimit ? (
                <X className="h-4 w-4 text-destructive" />
              ) : (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          )}
        </div>

        {/* Save button */}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isOverLimit || state === 'SAVING'}
        >
          {state === 'SAVING' ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>

        {/* Cancel button - hidden during SAVING */}
        {state !== 'SAVING' && (
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Error text for over-limit */}
      {isOverLimit && (
        <p className="text-xs text-destructive">Max 100 characters</p>
      )}
    </div>
  );
}
