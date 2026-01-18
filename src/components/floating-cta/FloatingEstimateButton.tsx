import { useState, useEffect, useCallback, useRef } from 'react';
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
export function FloatingEstimateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Delayed entrance - loads last after 2 seconds
  useEffect(() => {
    const entranceTimer = setTimeout(() => {
      setHasEntered(true);
    }, 2000);
    return () => clearTimeout(entranceTimer);
  }, []);

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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            // Positioning - above mobile footer, normal on desktop
            'fixed right-4 z-50',
            'bottom-[120px] md:bottom-6 md:right-6',
            
            // Size: 52px mobile, 64px desktop
            'h-[52px] w-[52px] md:h-16 md:w-16',
            
            // Circular, transparent background (no shadow - logo has built-in depth)
            'rounded-full p-0 bg-transparent border-0',
            
            // Hover scale effect
            'hover:scale-110 transition-all duration-300 ease-in-out',
            
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
          }}
          aria-label="Get a free estimate"
        />
      </SheetTrigger>
      
      <EstimateSlidePanel onClose={() => setIsOpen(false)} />
    </Sheet>
  );
}
