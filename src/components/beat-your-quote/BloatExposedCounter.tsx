import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface BloatExposedCounterProps {
  amount: number;
  isVisible: boolean;
  isGlitching?: boolean;
}

export function BloatExposedCounter({ amount, isVisible, isGlitching = false }: BloatExposedCounterProps) {
  const [glitchActive, setGlitchActive] = useState(false);

  // Trigger glitch animation when isGlitching prop changes to true
  useEffect(() => {
    if (isGlitching) {
      setGlitchActive(true);
      const timer = setTimeout(() => setGlitchActive(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isGlitching]);

  return (
    <div 
      className={`
        fixed right-6 top-1/2 -translate-y-1/2 z-50
        p-4 rounded-lg border bg-[#0A0F14]/95 backdrop-blur-sm
        transition-all duration-500
        ${glitchActive 
          ? 'border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse' 
          : 'border-red-500/40'
        }
        ${isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-full pointer-events-none'
        }
      `}
    >
      {/* Glitch Overlay */}
      {glitchActive && (
        <div className="absolute inset-0 bg-red-500/20 rounded-lg animate-pulse" />
      )}
      
      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto
        transition-all duration-150
        ${glitchActive ? 'bg-red-500/40 scale-110' : 'bg-red-500/20'}
      `}>
        <Zap className={`w-5 h-5 transition-colors ${glitchActive ? 'text-red-300' : 'text-red-400'}`} />
      </div>
      
      {/* Label */}
      <div className={`
        text-xs font-mono tracking-wider text-center mb-1 transition-all
        ${glitchActive ? 'text-red-300 tracking-[0.4em]' : 'text-red-400'}
      `}>
        BLOAT EXPOSED
      </div>
      
      {/* Amount */}
      <div className={`
        text-2xl font-bold font-mono text-center transition-all
        ${glitchActive ? 'text-red-300 scale-105' : 'text-red-400'}
      `}>
        $<AnimatedNumber value={amount} duration={800} />
      </div>
    </div>
  );
}
