import React, { useState } from 'react';
import { Trophy, XCircle, RotateCcw, Clock, Zap, BookOpen, ChevronDown, ChevronUp, Loader2, Cpu } from 'lucide-react';
import type { GameResult, AnalysisResult } from '@/types/roleplay';
import { NextStepCard } from '@/components/seo/NextStepCard';

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

interface ResultsScreenProps {
  result: GameResult;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  onPlayAgain: () => void;
}

export function ResultsScreen({ result, analysis, isAnalyzing, onPlayAgain }: ResultsScreenProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] px-4 py-8 overflow-y-auto bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="text-center mb-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        {result.won ? (
          <>
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-in zoom-in duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
              <Trophy className="w-12 h-12 text-emerald-400 relative z-10" />
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-emerald-600 mb-2 tracking-tight">VICTORY</h1>
            <p className="text-emerald-400/60 font-mono text-sm tracking-wide">{result.winCondition === 'tactic_callout' ? "NEURAL PATTERN IDENTIFIED" : "MAXIMUM RESISTANCE ACHIEVED"}</p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-red-950/30 border border-red-500/30 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-in zoom-in duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
              <XCircle className="w-12 h-12 text-red-400 relative z-10" />
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-700 mb-2 tracking-tight">DEFEAT</h1>
            <p className="text-red-400/60 font-mono text-sm tracking-wide">CLOSING SEQUENCE SUCCESSFUL</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "TURNS", value: result.turns, icon: RotateCcw },
          { label: "TIME", value: `${Math.floor(result.duration)}s`, icon: Clock },
          { label: "TACTICS", value: result.tacticsUsed.length, icon: Zap }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 rounded-xl p-4 text-center border border-white/5 backdrop-blur-sm shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <stat.icon className="w-4 h-4 text-slate-500 mx-auto mb-2 opacity-50" />
            <div className="text-2xl font-mono font-bold text-slate-200 tracking-tighter">{stat.value}</div>
            <div className="text-[10px] text-cyan-500/70 font-mono tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {isAnalyzing ? (
        <div className="flex-1 flex items-center justify-center flex-col py-12">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin relative z-10" />
          </div>
          <p className="text-cyan-400/80 font-mono text-sm mt-6 animate-pulse">PROCESSING NEURAL DATA...</p>
        </div>
      ) : analysis ? (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/5 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu className="w-24 h-24 text-white"/></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-sm font-bold text-slate-400 font-mono uppercase tracking-widest">PERFORMANCE_GRADE</h3>
              <div className={cn("text-4xl font-black font-mono shadow-black drop-shadow-2xl", 
                analysis.scoreCard.overallGrade.startsWith('A') ? "text-emerald-400" : 
                analysis.scoreCard.overallGrade.startsWith('B') ? "text-cyan-400" : 
                "text-amber-400"
              )}>{analysis.scoreCard.overallGrade}</div>
            </div>
            <div className="space-y-3 relative z-10">
              {['Composure', 'Firmness', 'Tactic Recognition'].map((k, i) => {
                const values = [analysis.scoreCard.composure, analysis.scoreCard.firmness, analysis.scoreCard.tacticRecognition];
                return (
                  <div key={k} className="group">
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-slate-500">{k.toUpperCase()}</span>
                      <span className="text-slate-300">{values[i]}/10</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out group-hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                        style={{width: `${values[i] * 10}%`}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <button onClick={() => setShowAnalysis(!showAnalysis)} className="group flex items-center justify-center w-full py-4 text-xs font-mono tracking-widest text-slate-500 hover:text-cyan-400 transition-colors border border-dashed border-slate-800 hover:border-cyan-500/30 rounded-xl bg-slate-900/30">
            {showAnalysis ? <><ChevronUp className="w-3 h-3 mr-2"/> COLLAPSE_LOGS</> : <><ChevronDown className="w-3 h-3 mr-2 group-hover:translate-y-0.5 transition-transform"/> EXPAND_NEURAL_LOGS</>}
          </button>
          
          {showAnalysis && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {analysis.lessons.map((lesson, i) => (
                <div key={i} className="flex gap-3 text-sm text-slate-300 p-4 bg-slate-900/30 border-l-2 border-amber-500/50 rounded-r-lg">
                  <BookOpen className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/> 
                  <span className="font-light">{lesson}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Next Step Card - Prevents traffic leaks */}
      <div className="px-4 mt-6">
        <NextStepCard currentToolPath="/roleplay" showEvidence={false} />
      </div>

      <div className="mt-auto pt-8 pb-4 px-4">
        <Button onClick={onPlayAgain} variant="neon" size="lg" className="w-full font-bold tracking-widest text-lg h-14">
          <RotateCcw className="w-5 h-5 mr-3" /> INITIALIZE NEW SIMULATION
        </Button>
      </div>
    </div>
  );
}
