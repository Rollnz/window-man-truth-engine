import React, { useRef, useEffect, useState } from 'react';
import { Send, Lightbulb } from 'lucide-react';
import type { Message, TacticLog, GameState } from '@/types/roleplay';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { GameHeader } from './GameHeader';
import { ActionButtons } from './ActionButtons';
import { HINT_PROMPTS } from '@/data/roleplayData';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Custom Button component with exact styling
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default' | 'destructive' | 'neon';
}

function Button({ className, size = 'md', variant = 'default', ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg font-mono text-sm tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-95";
  const variants = {
    default: "bg-gradient-to-r from-slate-800 to-slate-900 text-slate-100 hover:from-slate-700 hover:to-slate-800 border border-slate-700 shadow-lg shadow-black/50",
    destructive: "bg-red-900/50 text-red-100 border border-red-500/50 hover:bg-red-900/80 hover:border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.25)]",
    outline: "border border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/30 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
    ghost: "text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/20",
    neon: "bg-cyan-600/20 text-cyan-200 border border-cyan-500/60 hover:bg-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:text-white"
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-5 py-2",
    lg: "h-12 px-8 text-base",
    icon: "h-10 w-10"
  };
  
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

interface GamePlayAreaProps {
  gameState: GameState;
  maxResistance: number;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onHintRequest: () => void;
  onGiveUp: () => void;
  onTacticSpotted: (id: string) => void;
  currentHint: string | null;
}

export function GamePlayArea({ 
  gameState, 
  maxResistance, 
  isLoading, 
  onSendMessage, 
  onHintRequest, 
  onGiveUp, 
  onTacticSpotted,
  currentHint
}: GamePlayAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [gameState.messages, isLoading]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-100">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      
      <GameHeader 
        resistanceScore={gameState.resistanceScore} 
        maxResistance={maxResistance} 
        turns={gameState.turns} 
        tacticsCount={gameState.tacticsUsed.length} 
        difficulty={gameState.difficulty} 
        startTime={gameState.startTime} 
      />
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent relative z-10">
        {gameState.messages.map((m, i) => (
          <MessageBubble key={m.id} message={m} isLatest={i === gameState.messages.length - 1} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {currentHint && (
        <div className="mx-4 sm:mx-6 mb-2 p-4 bg-amber-950/90 border-l-4 border-amber-500 rounded-r-xl text-amber-100 text-sm flex items-start gap-3 animate-in slide-in-from-bottom-2 shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-md relative z-20">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <span className="font-mono">{currentHint}</span>
        </div>
      )}

      <ActionButtons 
        hintsRemaining={gameState.hintsRemaining} 
        showHints={gameState.difficulty !== 'nightmare'} 
        onHintRequest={onHintRequest} 
        onGiveUp={onGiveUp} 
        onTacticSpotted={onTacticSpotted} 
        disabled={isLoading} 
      />
      
      <div className="p-4 sm:p-6 bg-black/80 backdrop-blur-md border-t border-white/10 relative z-20">
        <div className="flex gap-3 relative">
          <input 
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:bg-slate-900 transition-all font-mono text-sm shadow-inner"
            placeholder=">> ENTER_RESPONSE..."
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button 
            variant="neon" 
            size="icon" 
            className="h-auto w-14 rounded-xl" 
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
