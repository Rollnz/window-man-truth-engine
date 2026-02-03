import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { getSourceToolLabel } from '@/constants/sourceToolLabels';

const MAX_LENGTH = 500;

interface TemplateEditorProps {
  source_tool: string;
  current_template: string;
  onSave: (source_tool: string, template: string) => Promise<void>;
}

export function TemplateEditor({
  source_tool,
  current_template,
  onSave,
}: TemplateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(current_template);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const label = getSourceToolLabel(source_tool);

  // Reset input value when template changes externally or panel opens
  useEffect(() => {
    if (isOpen) {
      setInputValue(current_template);
      setServerError(null);
    }
  }, [isOpen, current_template]);

  const charCount = inputValue.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const hasChanged = inputValue !== current_template;

  // Preview: replace {first_name} with "Sarah" (display only)
  const previewText = inputValue.replace(/\{first_name\}/g, 'Sarah');
  const showPreview = inputValue.trim().length > 0;

  const handleToggle = () => {
    if (isOpen) {
      // Closing: reset to original
      setInputValue(current_template);
      setServerError(null);
    }
    setIsOpen(!isOpen);
  };

  const handleCancel = () => {
    setInputValue(current_template);
    setServerError(null);
    setIsOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setServerError(null);

    try {
      await onSave(source_tool, inputValue);
      toast({
        title: 'Success',
        description: `Script updated for ${label}`,
      });
      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setServerError(message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save script: ${message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="text-muted-foreground h-auto p-0 hover:bg-transparent"
      >
        {isOpen ? (
          <ChevronUp className="h-4 w-4 mr-1" />
        ) : (
          <ChevronDown className="h-4 w-4 mr-1" />
        )}
        Edit Script
      </Button>

      {/* Collapsible panel */}
      {isOpen && (
        <div className="space-y-3 pt-2 border-t">
          {/* Server error banner */}
          {serverError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2 rounded">
              {serverError}
            </div>
          )}

          {/* Textarea */}
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSaving}
            placeholder="Enter the opening script..."
            rows={4}
            className="resize-y min-h-[100px]"
          />

          {/* Character counter */}
          <div className="flex justify-end">
            <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {charCount} / {MAX_LENGTH}
            </span>
          </div>

          {/* Live Preview */}
          {showPreview && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Preview</span>
              <div className="bg-muted/50 p-3 rounded text-sm">
                {previewText}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanged || isOverLimit || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
