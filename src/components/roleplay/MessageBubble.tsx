import React from 'react';
import { User, Bot } from 'lucide-react';
import type { Message } from '@/types/roleplay';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isCloser = message.role === 'closer';
  
  return (
    <div className={cn("flex gap-3 sm:gap-4 animate-in slide-in-from-bottom-3 fade-in duration-500", isCloser ? "flex-row" : "flex-row-reverse")}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center border shadow-[0_0_15px_rgba(0,0,0,0.5)]",
        isCloser 
          ? "bg-slate-900 border-red-500/30 text-red-500 shadow-red-900/20" 
          : "bg-slate-900 border-cyan-500/30 text-cyan-500 shadow-cyan-900/20"
      )}>
        {isCloser ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      <div className={cn("flex-1 max-w-[85%] sm:max-w-[80%]", isCloser ? "pr-8" : "pl-8")}>
        <div className={cn("text-[10px] font-mono tracking-widest mb-1.5 opacity-70", isCloser ? "text-red-400" : "text-cyan-400 text-right")}>
          {isCloser ? "THE_CLOSER_AI_V2.0" : "USER_TERMINAL"}
        </div>
        <div className={cn(
          "px-5 py-3.5 text-sm leading-relaxed shadow-lg backdrop-blur-sm",
          isCloser 
            ? "bg-slate-900/80 text-slate-200 rounded-tr-xl rounded-br-xl rounded-bl-xl border-l-2 border-l-red-500 border-t border-r border-b border-white/5" 
            : "bg-cyan-950/30 text-cyan-50 rounded-tl-xl rounded-bl-xl rounded-br-xl border-r-2 border-r-cyan-500 border-t border-l border-b border-cyan-500/20"
        )}>
          {message.text}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-4 animate-in fade-in">
      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-red-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <Bot className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex items-center gap-1 h-10">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></span>
      </div>
    </div>
  );
}
