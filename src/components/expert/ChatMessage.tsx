import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isAssistant = role === 'assistant';

  return (
    <div className={cn(
      'flex gap-3 p-4 rounded-lg',
      isAssistant ? 'bg-card/50' : 'bg-primary/10'
    )}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isAssistant ? 'bg-primary/20' : 'bg-muted'
      )}>
        {isAssistant ? (
          <Bot className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">
          {isAssistant ? 'Window Expert' : 'You'}
        </p>
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
