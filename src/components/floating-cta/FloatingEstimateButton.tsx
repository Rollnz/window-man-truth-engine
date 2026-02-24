import { useState, useEffect } from 'react';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { EstimateSlidePanel } from './EstimateSlidePanel';
import { cn } from '@/lib/utils';

/**
 * FloatingEstimateButton
 * 
 * A persistent floating action button featuring the Window Man logo.
 * Appears in the bottom-right corner on all public pages.
 * Opens a slide-in panel for estimate requests.
 */
export function FloatingEstimateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [triggerSource, setTriggerSource] = useState<string | undefined>();
  const [triggerMode, setTriggerMode] = useState<string | undefined>();
  const [triggerInitialMessage, setTriggerInitialMessage] = useState<string | undefined>();

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
            className={cn(
              // Positioning
              'fixed right-4 z-50',
              'bottom-6 md:right-6',
              
              // Size: 52px mobile, 64px desktop
              'h-[52px] w-[52px] md:h-16 md:w-16',
              
              // Circular, transparent background
              'rounded-full p-0 bg-transparent border-0',
              
              // Hover scale effect
              'hover:scale-110',
              
              // Entrance transition
              hasEntered ? 'transition-all duration-300 ease-in-out' : 'transition-all duration-1000 ease-out',
              
              // Visibility — entrance slide-up only, always visible after
              !hasEntered 
                ? 'translate-y-32 opacity-0 pointer-events-none'
                : 'translate-y-0 opacity-100',
              
              // Cursor
              'cursor-pointer'
            )}
            style={{
              backgroundImage: "url('/images/windowman.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              // Subtle pulse glow animation after entrance (plays 3 times)
              ...(showPulse ? {
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
}
