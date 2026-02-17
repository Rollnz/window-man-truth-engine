import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/expert/ChatMessage';
import { Send, Loader2, MessageCircleQuestion, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/gtm';
import type { AuditAnalysisResult } from '@/types/audit';

interface AuditExpertChatProps {
  onAsk: (question: string) => Promise<void>;
  isAsking: boolean;
  latestAnswer: string | null;
  analysisResult: AuditAnalysisResult;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AuditExpertChat({ onAsk, isAsking, latestAnswer, analysisResult }: AuditExpertChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build context-aware suggested questions
  const suggestions = useMemo(() => {
    const items: string[] = [];
    if (analysisResult.warnings && analysisResult.warnings.length > 0) {
      items.push('What should I do about the red flags you found?');
    }
    if (analysisResult.pricePerOpening) {
      items.push('Is my price per window fair for my area?');
    }
    if (analysisResult.missingItems && analysisResult.missingItems.length > 0) {
      items.push('What are the risks of these missing items?');
    }
    items.push('How should I negotiate with this contractor?');
    // Always have at least 3
    if (items.length < 3) {
      items.push('What questions should I ask the contractor?');
    }
    return items.slice(0, 4);
  }, [analysisResult]);

  // When latestAnswer changes and we have a pending question, append both to history
  useEffect(() => {
    if (latestAnswer && pendingQuestion) {
      setMessages((prev) => [
      ...prev,
      { role: 'user', content: pendingQuestion },
      { role: 'assistant', content: latestAnswer }]
      );
      setPendingQuestion(null);
    }
  }, [latestAnswer, pendingQuestion]);

  // Auto-scroll on new messages or while loading
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isAsking]);

  const handleSend = useCallback(async (text?: string) => {
    const question = (text || input).trim();
    if (!question || isAsking) return;

    if ('vibrate' in navigator) navigator.vibrate(10);

    setPendingQuestion(question);
    setInput('');

    trackEvent('audit_expert_question', {
      question_length: question.length,
      message_count: messages.length,
      is_suggestion: !!text
    });

    await onAsk(question);
  }, [input, isAsking, messages.length, onAsk]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = messages.length === 0 && !isAsking;

  return (
    <section className="py-16 px-4 bg-slate-900/80">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <MessageCircleQuestion className="h-4 w-4" />
            AI Expert
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Got Questions About Your Report?
          </h2>
          <p className="text-sm md:text-base max-w-lg mx-auto text-gray-300">
            Ask our AI expert anything about your quote analysis — pricing fairness, hidden costs, negotiation strategies, and more.
          </p>
        </div>

        {/* Chat container */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-950/60 overflow-hidden">
          {/* Suggested questions */}
          {showSuggestions &&
          <div className="p-4 md:p-6 border-b border-slate-700/30">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Suggested Questions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((q, i) =>
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={isAsking}
                className={cn(
                  'text-left text-sm px-3 py-2.5 rounded-lg border transition-all',
                  'border-slate-700/50 bg-slate-800/50 text-slate-300',
                  'hover:border-primary/40 hover:bg-primary/5 hover:text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}>

                    {q}
                  </button>
              )}
              </div>
            </div>
          }

          {/* Message thread */}
          {(messages.length > 0 || isAsking) &&
          <div
            ref={scrollRef}
            className="max-h-[400px] overflow-y-auto p-4 space-y-3">

              {messages.map((msg, i) =>
            <ChatMessage key={i} role={msg.role} content={msg.content} />
            )}
              {isAsking && pendingQuestion &&
            <>
                  <ChatMessage role="user" content={pendingQuestion} />
                  <ChatMessage role="assistant" content="" isStreaming />
                </>
            }
            </div>
          }

          {/* Input bar */}
          <div className="flex gap-2 p-4 border-t border-slate-700/30 bg-slate-900/50">
            <label htmlFor="audit-expert-chat-input" className="sr-only">
              Ask about your quote analysis
            </label>
            <Textarea
              ref={textareaRef}
              id="audit-expert-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your quote..."
              className="min-h-[52px] max-h-[100px] resize-none bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              disabled={isAsking}
              aria-label="Ask about your quote analysis" />

            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isAsking}
              size="icon"
              className="h-[52px] w-[52px] shrink-0"
              aria-label={isAsking ? 'Sending message' : 'Send message'}>

              {isAsking ?
              <Loader2 className="h-5 w-5 animate-spin" /> :

              <Send className="h-5 w-5" />
              }
            </Button>
          </div>
        </div>
      </div>
    </section>);

}

export default AuditExpertChat;