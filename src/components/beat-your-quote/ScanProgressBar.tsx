interface ScanProgressBarProps {
  isVisible: boolean;
}

export function ScanProgressBar({ isVisible }: ScanProgressBarProps) {
  return (
    <div 
      className={`
        fixed left-0 right-0 z-40 pointer-events-none
        transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{ top: '70vh' }}
    >
      {/* Label */}
      <div className="text-center mb-2">
        <span className="text-xs font-mono tracking-redacted text-tools-truth-engine bg-dossier-page/90 px-4 py-1">
          SCANNING
        </span>
      </div>

      {/* Progress Bar - Full Width */}
      <div className="relative h-1 bg-transparent">
        {/* Main Line */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-tools-truth-engine to-transparent"
          style={{
            boxShadow: '0 0 20px hsl(189 100% 50%), 0 0 40px hsl(189 100% 50% / 0.3)'
          }}
        />
        
        {/* Sweeping Glow Animation */}
        <div 
          className="absolute h-full w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[scan-sweep_2s_ease-in-out_infinite]"
        />
      </div>
    </div>
  );
}
