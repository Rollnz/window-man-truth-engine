import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { EstimateSlidePanel } from './EstimateSlidePanel';
import { cn } from '@/lib/utils';

/**
 * FloatingEstimateButton
 * 
 * A persistent floating action button featuring the Window Man logo.
 * Appears in the bottom-right corner and syncs with the mobile sticky footer's
 * scroll hide/show behavior. Opens a slide-in panel for estimate requests.
 */
export const FloatingEstimateButton = forwardRef<HTMLButtonElement, Record<string, never>>((_props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [triggerSource, setTriggerSource] = useState<string | undefined>();
  const [triggerMode, setTriggerMode] = useState<string | undefined>();
  const [triggerInitialMessage, setTriggerInitialMessage] = useState<string | undefined>();
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Delayed entrance - loads last after 2 seconds, then pulse after entrance completes
  useEffect(() => {
    const entranceTimer = setTimeout(() => {
      setHasEntered(true);
      // Start pulse after entrance animation completes (1s entrance + small buffer)
      setTimeout(() => setShowPulse(true), 1100);
    }, 2000);
    return () => clearTimeout(entranceTimer);
  }, []);

  // Listen for programmatic open requests (e.g., from SilentAllyInterceptor)
  useEffect(() => {
    const handleOpenPanel = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        source?: string;
        mode?: string;
        initialMessage?: string;
      } | undefined;
      setTriggerSource(detail?.source);
      setTriggerMode(detail?.mode);
      setTriggerInitialMessage(detail?.initialMessage);
      setIsOpen(true);
    };
    window.addEventListener('open-estimate-panel', handleOpenPanel);
    return () => window.removeEventListener('open-estimate-panel', handleOpenPanel);
  }, []);

  // Reset trigger state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setTriggerSource(undefined);
      setTriggerMode(undefined);
      setTriggerInitialMessage(undefined);
    }
  }, [isOpen]);

  // Scroll handler - synced with MobileStickyFooter logic
  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY.current;
        const scrollingUp = currentScrollY < lastScrollY.current;
        
        // Require 10px+ delta to prevent jitter
        if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
          if (scrollingDown && currentScrollY > 100) {
            setIsVisible(false);
          } else if (scrollingUp) {
            setIsVisible(true);
          }
          lastScrollY.current = currentScrollY;
        }
        
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      {/* Inject pulse keyframe animation */}
      <style>{`
        @keyframes fab-pulse {
          0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 0 transparent);
          }
          50% { 
            transform: scale(1.08);
            filter: drop-shadow(0 0 12px hsl(var(--primary) / 0.5));
          }
        }
      `}</style>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            ref={ref}
            className={cn(
              // Positioning - above mobile footer, normal on desktop
              'fixed right-4 z-50',
              'bottom-[120px] md:bottom-6 md:right-6',
              
              // Size: 52px mobile, 64px desktop
              'h-[52px] w-[52px] md:h-16 md:w-16',
              
              // Circular, transparent background (no shadow - logo has built-in depth)
              'rounded-full p-0 bg-transparent border-0',
              
              // Hover scale effect (faster than entrance)
              'hover:scale-110',
              
              // Slow 1s entrance transition, faster scroll hide/show
              hasEntered ? 'transition-all duration-300 ease-in-out' : 'transition-all duration-1000 ease-out',
              
              // Visibility animation - entrance slide-up, then scroll sync (mobile only)
              !hasEntered 
                ? 'translate-y-32 opacity-0 pointer-events-none'
                : isVisible 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-20 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto',
              
              // Cursor
              'cursor-pointer'
            )}
            style={{
              backgroundImage: "url('/images/windowman.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              // Subtle pulse glow animation after entrance (plays 3 times)
              ...(showPulse && isVisible ? {
                animation: 'fab-pulse 2s ease-in-out 3',
              } : {}),
            }}
            aria-label="Get a free estimate"
          />
        </SheetTrigger>
        
        <EstimateSlidePanel
          onClose={() => setIsOpen(false)}
          triggerSource={triggerSource}
          triggerMode={triggerMode}
          triggerInitialMessage={triggerInitialMessage}
        />
      </Sheet>
    </>
  );
});

FloatingEstimateButton.displayName = "FloatingEstimateButton";
