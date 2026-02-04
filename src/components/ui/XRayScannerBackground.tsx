import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface RedFlag {
  top: string;
  left: string;
  label: string;
  delay: number;
}

interface XRayScannerBackgroundProps {
  children: ReactNode;
  /** Optional custom contract line text */
  contractLines?: string[];
  /** Optional custom red flag positions/labels */
  redFlags?: RedFlag[];
  /** Additional wrapper className */
  className?: string;
  /** Section padding override (default: py-20) */
  padding?: string;
}

const DEFAULT_CONTRACT_LINES = [
  "ADMIN FEE – $1,950",
  "EMERGENCY RUSH – $3,200",
  "PERMIT PROCESSING – $875",
  "DISPOSAL FEE – $650",
  "WEEKEND SURCHARGE – $1,400",
  "CONSULTATION CHARGE – $550",
  "MATERIAL HANDLING – $925",
  "INSPECTION FEE – $780",
];

const DEFAULT_RED_FLAGS: RedFlag[] = [
  { top: '15%', left: '20%', label: '🚩 Markup 40%', delay: 0 },
  { top: '35%', left: '60%', label: '🚩 Junk Fee', delay: 0.2 },
  { top: '55%', left: '30%', label: '🚩 Double Counting', delay: 0.4 },
  { top: '75%', left: '70%', label: '🚩 Unnecessary', delay: 0.6 },
];

export function XRayScannerBackground({ 
  children,
  contractLines = DEFAULT_CONTRACT_LINES,
  redFlags = DEFAULT_RED_FLAGS,
  className,
  padding = 'py-20'
}: XRayScannerBackgroundProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // IntersectionObserver to pause animations when off-screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Track scroll position for scan bar
  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;
      
      // Calculate progress: 0 when entering viewport, 1 when leaving
      const scrollStart = windowHeight;
      const scrollEnd = -sectionHeight;
      const scrollRange = scrollStart - scrollEnd;
      const scrollPosition = scrollStart - sectionTop;
      const progress = Math.max(0, Math.min(1, scrollPosition / scrollRange));
      
      setScanProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  const shouldAnimate = !prefersReducedMotion && isInView;

  return (
    <section 
      ref={sectionRef}
      className={cn("relative overflow-hidden", padding, className)}
    >
      {/* Layer 1: Scrolling Contract Background (All devices, mobile-optimized) */}
      {!prefersReducedMotion && (
        <div 
          className={cn(
            "absolute inset-0 pointer-events-none transform-gpu",
            "opacity-[0.02] md:opacity-[0.03]" // Reduced opacity on mobile
          )}
          aria-hidden="true"
        >
          <div 
            className={cn(
              "flex gap-8 whitespace-nowrap",
              shouldAnimate ? "xray-animate-scroll" : "xray-animation-paused"
            )}
          >
            {/* Duplicate for seamless loop */}
            {[...contractLines, ...contractLines].map((line, i) => (
              <div 
                key={i} 
                className="text-2xl md:text-4xl font-mono text-foreground py-4"
              >
                {line}
              </div>
            ))}
          </div>
          <div 
            className={cn(
              "flex gap-8 whitespace-nowrap mt-8 md:mt-12",
              shouldAnimate ? "xray-animate-scroll-delayed" : "xray-animation-paused"
            )}
          >
            {[...contractLines, ...contractLines].map((line, i) => (
              <div 
                key={i} 
                className="text-2xl md:text-4xl font-mono text-foreground py-4"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer 2: Scan Bar (Scroll-triggered, all devices) */}
      {!prefersReducedMotion && (
        <div 
          className={cn(
            "absolute inset-x-0 h-16 md:h-24 pointer-events-none transition-all duration-200 ease-out transform-gpu"
          )}
          style={{ 
            top: `${scanProgress * 100}%`,
            background: 'linear-gradient(180deg, transparent 0%, hsl(var(--success) / 0.15) 30%, hsl(var(--success) / 0.25) 50%, hsl(var(--success) / 0.15) 70%, transparent 100%)',
            boxShadow: '0 0 30px hsl(var(--success) / 0.2)', // Reduced glow on mobile
          }}
          aria-hidden="true"
        >
          {/* Scan line effect */}
          <div className="w-full h-0.5 bg-success/60 absolute top-1/2" />
          <div className="w-full h-px bg-success/30 absolute top-1/2 mt-1 animate-pulse" />
        </div>
      )}

      {/* Layer 3: Red Flag Markers (appear as scan bar passes, all devices) */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {redFlags.map((flag, i) => {
            const flagProgress = scanProgress * 100;
            const flagPosition = parseFloat(flag.top);
            const isVisible = flagProgress > flagPosition - 10 && flagProgress < flagPosition + 10;
            
            // Safe left positioning for mobile using clamp
            const safeLeft = `clamp(10%, ${flag.left}, 85%)`;
            
            return (
              <div
                key={i}
                className={cn(
                  "absolute transition-all duration-500 ease-out",
                  "xray-red-flag-badge" // For mobile scaling
                )}
                style={{ 
                  top: flag.top, 
                  left: safeLeft,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                  transitionDelay: `${flag.delay}s`
                }}
              >
                <div className="bg-destructive/90 text-destructive-foreground px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-bold border border-destructive whitespace-nowrap">
                  {flag.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Inline CSS for animations - scoped with unique prefix */}
      <style>{`
        @keyframes xray-scroll-horizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .xray-animate-scroll {
          animation: xray-scroll-horizontal 60s linear infinite;
          will-change: transform;
        }

        .xray-animate-scroll-delayed {
          animation: xray-scroll-horizontal 60s linear infinite;
          animation-delay: -30s;
          will-change: transform;
        }

        .xray-animation-paused {
          animation-play-state: paused;
        }

        /* Mobile red flag optimization */
        @media (max-width: 767px) {
          .xray-red-flag-badge {
            transform: scale(0.85);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .xray-animate-scroll,
          .xray-animate-scroll-delayed {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
