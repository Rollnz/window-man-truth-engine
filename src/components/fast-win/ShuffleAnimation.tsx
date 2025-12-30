import { useEffect, useState } from 'react';
import { fastWinProducts } from '@/data/fastWinData';

interface ShuffleAnimationProps {
  onComplete: () => void;
}

export function ShuffleAnimation({ onComplete }: ShuffleAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'shuffling' | 'slowing' | 'done'>('shuffling');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Fast shuffle phase (1.5s)
    interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % fastWinProducts.length);
    }, 100);

    // After 1.5s, slow down
    const slowTimeout = setTimeout(() => {
      setPhase('slowing');
      clearInterval(interval);
      
      // Slower interval
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % fastWinProducts.length);
      }, 300);
    }, 1500);

    // After 2.5s total, complete
    const completeTimeout = setTimeout(() => {
      setPhase('done');
      clearInterval(interval);
      onComplete();
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(slowTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  const currentProduct = fastWinProducts[currentIndex];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Pulsing background */}
      <div className="absolute inset-0 gradient-radial animate-pulse opacity-30 pointer-events-none" />

      <div className="relative z-10 text-center">
        {/* Calculating text */}
        <p className="text-lg text-muted-foreground mb-8 animate-pulse">
          Analyzing your situation...
        </p>

        {/* Shuffling card */}
        <div
          className={`
            w-80 h-48 mx-auto rounded-2xl border-2 border-primary/50 bg-card
            flex flex-col items-center justify-center p-6
            transition-transform duration-100
            ${phase === 'shuffling' ? 'animate-[shuffle-card_0.4s_ease-in-out_infinite]' : ''}
            ${phase === 'slowing' ? 'animate-[shuffle-card_0.8s_ease-in-out_infinite]' : ''}
          `}
        >
          <span className="text-5xl mb-3">{currentProduct.icon}</span>
          <p className="text-xl font-bold text-foreground">{currentProduct.name}</p>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center gap-1.5 mt-8">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
