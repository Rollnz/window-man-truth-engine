import { Zap } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface BloatExposedCounterProps {
  amount: number;
  isVisible: boolean;
}

export function BloatExposedCounter({ amount, isVisible }: BloatExposedCounterProps) {
  return (
    <div 
      className={`
        fixed right-6 top-1/2 -translate-y-1/2 z-50
        p-4 rounded-lg border border-red-500/40 bg-[#0A0F14]/95 backdrop-blur-sm
        transition-all duration-500
        ${isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-full pointer-events-none'
        }
      `}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-2 mx-auto">
        <Zap className="w-5 h-5 text-red-400" />
      </div>
      
      {/* Label */}
      <div className="text-xs font-mono text-red-400 tracking-wider text-center mb-1">
        BLOAT EXPOSED
      </div>
      
      {/* Amount */}
      <div className="text-2xl font-bold text-red-400 font-mono text-center">
        $<AnimatedNumber value={amount} duration={800} />
      </div>
    </div>
  );
}
