import React, { useState, useEffect } from 'react';
import { Flame, Clock, Zap, Activity } from 'lucide-react';
import type { Difficulty } from '@/types/roleplay';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface ResistanceMeterProps {
  current: number;
  max: number;
}

function ResistanceMeter({ current, max }: ResistanceMeterProps) {
  const dots = Array.from({ length: max }, (_, i) => i < current);
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 font-mono shadow-black drop-shadow-sm">Resistance Protocol</span>
      <div className="flex items-center gap-1">
        {dots.map((filled, index) => (
          <div 
            key={index} 
            className={cn(
              "w-2 h-4 sm:w-3 sm:h-5 rounded-sm transition-all duration-300", 
              filled 
                ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] scale-110 border border-cyan-300" 
                : "bg-slate-900 border border-slate-800"
            )} 
          />
        ))}
      </div>
    </div>
  );
}

interface GameHeaderProps {
  resistanceScore: number;
  maxResistance: number;
  turns: number;
  tacticsCount: number;
  difficulty: Difficulty;
  startTime: Date | null;
}

export function GameHeader({ resistanceScore, maxResistance, turns, tacticsCount, difficulty, startTime }: GameHeaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-14 z-20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4">
        <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <Flame className="w-5 h-5 text-red-500" />
        </div>
        <div className="hidden sm:block">
          <div className="text-xs text-slate-500 font-mono tracking-wider">SIMULATION</div>
          <div className="font-bold text-slate-100 tracking-tight">BEAT_THE_CLOSER</div>
        </div>
        <div className={cn("px-2 py-0.5 rounded text-[10px] font-mono tracking-wider border uppercase bg-opacity-10 backdrop-blur-sm", difficulty === 'rookie' ? "text-emerald-400 bg-emerald-500 border-emerald-500/30" : difficulty === 'nightmare' ? "text-red-400 bg-red-500 border-red-500/30 animate-pulse" : "text-amber-400 bg-amber-500 border-amber-500/30")}>
          {difficulty}
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-500" />
          <span>{formatTime(elapsed)}</span>
        </div>
        <div className="h-4 w-px bg-white/10"></div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-purple-500" />
          <span>TURN_{turns.toString().padStart(2, '0')}</span>
        </div>
        <div className="h-4 w-px bg-white/10"></div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>TACTICS_{tacticsCount}</span>
        </div>
      </div>
      
      <ResistanceMeter current={resistanceScore} max={maxResistance} />
    </div>
  );
}
