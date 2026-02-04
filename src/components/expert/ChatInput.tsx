import { useState, KeyboardEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isLoading,
  disabled
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || isLoading || disabled) return;

    // Haptic feedback on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll textarea into view when focused (handles mobile keyboard)
  const handleFocus = () => {
    // Small delay to allow mobile keyboard to fully appear
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300);
  };

  return (
    <div className="flex gap-2 p-4 border-t border-border bg-background/80 backdrop-blur">
      <label htmlFor="expert-chat-input" className="sr-only">
        Ask a question about impact windows, energy savings, or your specific situation
      </label>
      <Textarea 
        ref={textareaRef}
        id="expert-chat-input"
        value={input} 
        onChange={e => setInput(e.target.value)} 
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder="Ask about impact windows, energy savings, or your specific situation..." 
        className="min-h-[60px] max-h-[120px] resize-none" 
        disabled={isLoading || disabled}
        aria-label="Ask a question about impact windows"
      />
      <Button 
        onClick={handleSend} 
        disabled={!input.trim() || isLoading || disabled} 
        size="icon" 
        className="h-[60px] w-[60px] shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
        aria-label={isLoading ? "Sending message" : "Send message"}
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 text-primary" />}
      </Button>
    </div>
  );
}
