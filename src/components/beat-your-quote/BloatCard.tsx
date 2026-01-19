import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface BloatCardProps {
  id: string;
  title: string;
  percentage: number;
  amount: number;
  description: string;
  onDissolveChange?: (id: string, isDissolved: boolean) => void;
}

export function BloatCard({ 
  id,
  title, 
  percentage, 
  amount, 
  description, 
  onDissolveChange 
}: BloatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDissolved, setIsDissolved] = useState(false);

  useEffect(() => {
    let rafId: number;
    
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (!cardRef.current) return;
        
        const rect = cardRef.current.getBoundingClientRect();
        const scanLineY = window.innerHeight * 0.7;
        
        // Card dissolves when its BOTTOM edge passes above the scan line
        const shouldDissolve = rect.bottom < scanLineY;
        
        if (shouldDissolve !== isDissolved) {
          setIsDissolved(shouldDissolve);
          onDissolveChange?.(id, shouldDissolve);
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [id, isDissolved, onDissolveChange]);

  return (
    <div 
      ref={cardRef}
      className={`
        relative p-6 rounded-lg border-2 border-red-500/60 bg-red-950/20
        transition-all duration-500 ease-out
        ${isDissolved 
          ? 'opacity-0 scale-95 blur-sm' 
          : 'opacity-100 scale-100 blur-0'
        }
      `}
    >
      {/* Warning Icon */}
      <AlertTriangle className="absolute top-4 right-4 w-6 h-6 text-red-400" />
      
      {/* Title with Percentage */}
      <div className="flex items-baseline gap-3 mb-2">
        <h4 className="text-lg font-bold text-red-400 uppercase tracking-wide font-mono">
          {title}
        </h4>
        <span className="text-sm text-red-300/70">({percentage}%)</span>
      </div>
      
      {/* Amount */}
      <div className="text-3xl font-bold text-white mb-3 font-mono">
        ${amount.toLocaleString()}
      </div>
      
      {/* Description */}
      <p className="text-sm text-white/85 leading-relaxed pr-8">
        {description}
      </p>
    </div>
  );
}
