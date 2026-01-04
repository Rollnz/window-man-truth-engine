import React, { useState } from 'react';
import { Lightbulb, Search, DoorOpen, X, XCircle } from 'lucide-react';
import { TACTIC_LIST } from '@/data/roleplayData';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Custom Button component with exact styling from user's code
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

// Custom Dialog component with exact styling
interface SimpleDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function SimpleDialog({ open, onClose, title, description, children, className }: SimpleDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={cn("bg-slate-950/90 border border-cyan-500/30 rounded-xl p-6 max-w-lg w-full shadow-[0_0_40px_rgba(6,182,212,0.15)] ring-1 ring-white/5 relative", className)}>
        <div className="mb-6 border-b border-cyan-500/20 pb-4">
          <h2 className="text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{title}</h2>
          {description && <p className="text-sm text-slate-400 mt-1 font-light">{description}</p>}
        </div>
        {children}
        <div className="absolute top-4 right-4">
          <button onClick={() => onClose(false)} className="text-slate-500 hover:text-cyan-400 transition-colors"><X className="w-5 h-5"/></button>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonsProps {
  hintsRemaining: number;
  showHints: boolean;
  onHintRequest: () => void;
  onGiveUp: () => void;
  onTacticSpotted: (id: string) => void;
  disabled?: boolean;
}

export function ActionButtons({ hintsRemaining, showHints, onHintRequest, onGiveUp, onTacticSpotted, disabled }: ActionButtonsProps) {
  const [showTactics, setShowTactics] = useState(false);
  const [showGiveUp, setShowGiveUp] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-white/5 bg-black/40 backdrop-blur-sm">
        {showHints && (
          <Button variant="outline" size="sm" onClick={onHintRequest} disabled={disabled || hintsRemaining <= 0} className="w-full sm:w-auto">
            <Lightbulb className="w-3.5 h-3.5 mr-2" /> HINT <span className="ml-1 opacity-50">[{hintsRemaining}]</span>
          </Button>
        )}
        <Button variant="neon" size="sm" onClick={() => setShowTactics(true)} disabled={disabled} className="w-full sm:w-auto flex-1 sm:flex-none">
          <Search className="w-3.5 h-3.5 mr-2" /> ANALYZE TACTIC
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowGiveUp(true)} disabled={disabled} className="w-full sm:w-auto text-red-400 hover:text-red-300 hover:bg-red-950/30">
          <DoorOpen className="w-3.5 h-3.5 mr-2" /> ABORT
        </Button>
      </div>
      
      <SimpleDialog open={showTactics} onClose={setShowTactics} title={<span className="flex items-center gap-2 text-emerald-400"><Search className="w-5 h-5"/> TACTIC_ANALYZER</span>} description="Identify the psychological manipulation pattern currently active.">
        <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {TACTIC_LIST.map((tactic) => (
            <button key={tactic.id} onClick={() => { setShowTactics(false); onTacticSpotted(tactic.id); }} className="text-left px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-emerald-950/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all group relative overflow-hidden">
              <div className="font-mono font-bold text-slate-300 group-hover:text-emerald-400 text-sm mb-1">{tactic.name}</div>
              <div className="text-xs text-slate-500 font-light">{tactic.description}</div>
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          ))}
        </div>
      </SimpleDialog>
      
      <SimpleDialog open={showGiveUp} onClose={setShowGiveUp} title={<span className="flex items-center gap-2 text-red-400"><XCircle className="w-5 h-5"/> CONFIRM ABORT</span>} description="Aborting now will result in immediate simulation failure.">
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowGiveUp(false)} className="flex-1">RESUME SIMULATION</Button>
          <Button variant="destructive" onClick={() => { setShowGiveUp(false); onGiveUp(); }} className="flex-1">CONFIRM ABORT</Button>
        </div>
      </SimpleDialog>
    </>
  );
}
