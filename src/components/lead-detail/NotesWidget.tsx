import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NotesWidgetProps {
  onAddNote: (content: string) => Promise<boolean>;
}

export function NotesWidget({ onAddNote }: NotesWidgetProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onAddNote(content.trim());
    setIsSubmitting(false);

    if (success) {
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Add Internal Note
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <div className="space-y-2">
          <label htmlFor="internal-note" className="sr-only">
            Add internal note about this lead
          </label>
          <Textarea
            id="internal-note"
            placeholder="Add a note about this lead..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none text-sm"
            aria-label="Add internal note about this lead"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              ⌘+Enter to submit
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              <Send className="h-3 w-3 mr-1" />
              Add Note
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
