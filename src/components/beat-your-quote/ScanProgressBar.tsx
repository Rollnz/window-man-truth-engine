import { useEffect, useState } from 'react';

interface ScanProgressBarProps {
  progress: number; // 0-100
  isScanning: boolean;
}

export function ScanProgressBar({ progress, isScanning }: ScanProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress, isScanning]);

  return (
    <div className="relative w-full py-6">
      {/* Label */}
      <div className="text-center mb-3">
        <span className="text-xs font-mono tracking-[0.3em] text-[#00D4FF]">
          {isScanning ? 'SCANNING' : 'SCAN COMPLETE'}
        </span>
      </div>
      
      {/* Progress Bar Container */}
      <div className="relative h-1 bg-[#0A0F14] rounded-full overflow-hidden">
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
          className="absolute h-full bg-gradient-to-r from-[#00D4FF]/60 via-[#00D4FF] to-[#00D4FF]/60 rounded-full"
          style={{ 
            width: `${displayProgress}%`,
            transition: 'width 0.8s ease-out',
            boxShadow: '0 0 20px #00D4FF, 0 0 40px #00D4FF50'
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
      </div>
      
      {/* Side Glows */}
      <div className="absolute left-0 top-1/2 w-8 h-8 -translate-y-1/2 bg-[#00D4FF]/20 blur-xl rounded-full" />
      <div 
        className="absolute top-1/2 w-8 h-8 -translate-y-1/2 bg-[#00D4FF]/40 blur-xl rounded-full transition-all duration-800"
        style={{ left: `${displayProgress}%` }}
      />
    </div>
  );
}
