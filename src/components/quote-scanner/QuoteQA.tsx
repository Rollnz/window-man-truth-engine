import { useState } from 'react';
import { MessageSquare, Send, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuoteQAProps {
  answer: string | null;
  isAsking: boolean;
  onAsk: (question: string) => void;
  disabled: boolean;
}

export function QuoteQA({ answer, isAsking, onAsk, disabled }: QuoteQAProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !disabled && !isAsking) {
      onAsk(question.trim());
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <MessageSquare className="w-4 h-4" />
        <span>Ask the AI Expert</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Is the permit included?"
          disabled={disabled || isAsking}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || isAsking || !question.trim()}
        >
          {isAsking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      {answer && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
