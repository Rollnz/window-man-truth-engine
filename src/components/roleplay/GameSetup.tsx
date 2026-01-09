import React from 'react';
import { Flame, Shield, Target, Skull, ChevronRight } from 'lucide-react';
import type { Difficulty } from '@/types/roleplay';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface GameSetupProps {
  onStart: (difficulty: Difficulty) => void;
}

export function GameSetup({ onStart }: GameSetupProps) {
  const difficulties = [
    { id: 'rookie' as Difficulty, icon: Shield, label: "ROOKIE", sub: "TRAINING_MODE", color: "emerald" },
    { id: 'standard' as Difficulty, icon: Target, label: "STANDARD", sub: "REALITY_SIM", color: "amber" },
    { id: 'nightmare' as Difficulty, icon: Skull, label: "NIGHTMARE", sub: "PSYCH_WARFARE", color: "red" }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] bg-slate-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black p-4 text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      
      <div className="mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-red-400 tracking-[0.2em] uppercase">Sim v2.4.0 Active</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-4 tracking-tighter">BEAT THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">CLOSER</span></h1>
        <p className="text-slate-400 max-w-md mx-auto font-mono text-sm leading-relaxed border-l-2 border-cyan-500/30 pl-4 text-left ml-auto mr-auto">
          <span className="text-cyan-500">MISSION:</span> Resist high-pressure sales tactics. <br/>
          <span className="text-cyan-500">PROTOCOL:</span> Say NO 7 times or identify the neural manipulation pattern.
        </p>
      </div>
      
      <div className="grid gap-4 w-full max-w-sm relative z-10">
        {difficulties.map((opt) => (
          <button 
            key={opt.id}
            onClick={() => onStart(opt.id)} 
            className={cn(
              "group flex items-center p-5 rounded-xl border text-left transition-all duration-300 relative overflow-hidden",
              opt.color === 'emerald' ? "bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]" :
              opt.color === 'amber' ? "bg-amber-950/20 border-amber-500/20 hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]" :
              "bg-red-950/20 border-red-500/20 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            )}
          >
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r", 
              opt.color === 'emerald' ? "from-emerald-500" : opt.color === 'amber' ? "from-amber-500" : "from-red-500"
            )} />
            <div className={cn("p-3 rounded-lg mr-5 transition-transform group-hover:scale-110 group-hover:rotate-3",
              opt.color === 'emerald' ? "bg-emerald-500/10 text-emerald-400" :
              opt.color === 'amber' ? "bg-amber-500/10 text-amber-400" :
              "bg-red-500/10 text-red-400"
            )}>
              <opt.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-200 font-mono tracking-wider group-hover:text-white transition-colors">{opt.label}</div>
              <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase group-hover:text-slate-400">{opt.sub}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
      
      <div className="mt-12 text-[10px] text-slate-600 font-mono">
        SYSTEM_ID: GEMINI-3-FLASH // LATENCY: 24ms // SECURE_CONNECTION
      </div>
    </div>
  );
}
