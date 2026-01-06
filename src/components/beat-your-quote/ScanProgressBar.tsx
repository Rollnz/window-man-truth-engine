import { useEffect, useState, useRef } from 'react';

interface ScanProgressBarProps {
  progress: number; // 0-100
  isScanning: boolean;
  onThresholdHit?: (threshold: number) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  direction: number;
}

export function ScanProgressBar({ progress, isScanning, onThresholdHit }: ScanProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [burstActive, setBurstActive] = useState(false);
  const lastThreshold = useRef(0);
  const particleId = useRef(0);

  // Track thresholds: 25%, 50%, 75%, 100%
  const thresholds = [25, 50, 75, 100];

  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress, isScanning]);

  // Detect threshold crossings and emit particles
  useEffect(() => {
    thresholds.forEach(threshold => {
      if (displayProgress >= threshold && lastThreshold.current < threshold) {
        // Emit particle burst
        emitParticleBurst(threshold);
        onThresholdHit?.(threshold);
        lastThreshold.current = threshold;
      }
    });
  }, [displayProgress, onThresholdHit]);

  const emitParticleBurst = (thresholdPercent: number) => {
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 300);

    // Create 8-12 particles
    const newParticles: Particle[] = [];
    const count = 8 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleId.current++,
        x: thresholdPercent,
        y: 50,
        opacity: 1,
        scale: 0.5 + Math.random() * 0.5,
        direction: (Math.random() - 0.5) * 360
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 800);
  };

  return (
    <div className="relative w-full py-6">
      {/* Label */}
      <div className="text-center mb-3">
        <span className={`
          text-xs font-mono tracking-[0.3em] transition-all duration-300
          ${burstActive ? 'text-white tracking-[0.5em]' : 'text-[#00D4FF]'}
        `}>
          {isScanning ? 'SCANNING' : 'SCAN COMPLETE'}
        </span>
      </div>
      
      {/* Progress Bar Container */}
      <div className="relative h-1 bg-[#0A0F14] rounded-full overflow-visible">
        {/* Glow Background */}
        <div 
          className="absolute inset-0 blur-sm bg-gradient-to-r from-transparent via-[#00D4FF]/30 to-transparent"
          style={{ 
            width: `${displayProgress}%`,
            transition: 'width 0.8s ease-out'
          }}
        />
        
        {/* Main Progress */}
        <div 
          className={`absolute h-full bg-gradient-to-r from-[#00D4FF]/60 via-[#00D4FF] to-[#00D4FF]/60 rounded-full transition-all ${burstActive ? 'h-2 -mt-0.5' : ''}`}
          style={{ 
            width: `${displayProgress}%`,
            transition: 'width 0.8s ease-out',
            boxShadow: burstActive 
              ? '0 0 40px #00D4FF, 0 0 80px #00D4FF80' 
              : '0 0 20px #00D4FF, 0 0 40px #00D4FF50'
          }}
        />
        
        {/* Scanning Pulse */}
        {isScanning && (
          <div 
            className="absolute h-full w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
            style={{ 
              left: `${displayProgress - 10}%`,
              transition: 'left 0.8s ease-out'
            }}
          />
        )}

        {/* Particle Effects */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full bg-[#00D4FF] pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: '50%',
              transform: `translate(-50%, -50%) scale(${particle.scale})`,
              boxShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF',
              animation: `particle-burst 0.8s ease-out forwards`,
              '--particle-angle': `${particle.direction}deg`,
            } as React.CSSProperties}
          />
        ))}

        {/* Threshold Burst Flash */}
        {burstActive && (
          <div 
            className="absolute h-8 w-16 -top-3.5 bg-[#00D4FF]/40 blur-xl rounded-full animate-pulse"
            style={{ left: `calc(${displayProgress}% - 2rem)` }}
          />
        )}
      </div>
      
      {/* Side Glows */}
      <div className="absolute left-0 top-1/2 w-8 h-8 -translate-y-1/2 bg-[#00D4FF]/20 blur-xl rounded-full" />
      <div 
        className={`absolute top-1/2 -translate-y-1/2 blur-xl rounded-full transition-all duration-300 ${burstActive ? 'w-12 h-12 bg-[#00D4FF]/60' : 'w-8 h-8 bg-[#00D4FF]/40'}`}
        style={{ left: `${displayProgress}%` }}
      />

      {/* Particle Animation Styles */}
      <style>{`
        @keyframes particle-burst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3) translateY(calc(var(--particle-angle) * 0.5)) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}
