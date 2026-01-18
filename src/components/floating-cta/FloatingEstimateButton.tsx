import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { EstimateSlidePanel } from './EstimateSlidePanel';
import { cn } from '@/lib/utils';

/**
 * FloatingEstimateButton
 * 
 * A persistent floating action button that appears in the bottom-right corner
 * of all pages. When clicked, it opens a slide-in panel with options to either
 * call the Voice AI agent or fill out a 3-step estimate request form.
 * 
 * Design: "Calm and Authoritative" - matches the Truth Engine aesthetic
 */
export function FloatingEstimateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  // Track scroll to show/hide subtle animation
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Stop pulsing after 10 seconds to avoid annoyance
  useEffect(() => {
    const timer = setTimeout(() => setIsPulsing(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className={cn(
            // Positioning
            'fixed bottom-6 right-6 z-50',
            // Size and shape
            'h-14 w-14 rounded-full p-0',
            // Colors - using primary with glow effect
            'bg-primary hover:bg-primary/90 shadow-lg',
            // Hover effects
            'hover:scale-105 transition-all duration-300',
            // Glow effect matching Truth Engine style
            'shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]',
            // Pulse animation when not scrolled
            isPulsing && !hasScrolled && 'animate-pulse',
            // Mobile adjustments
            'md:h-16 md:w-16'
          )}
          aria-label="Get a free estimate"
        >
          <MessageSquare className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
        </Button>
      </SheetTrigger>
      
      <EstimateSlidePanel onClose={() => setIsOpen(false)} />
    </Sheet>
  );
}
