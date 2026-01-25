import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { trackEvent } from '@/lib/gtm';
import { cn } from '@/lib/utils';

const PHONE_NUMBER = '+15614685571';
const PHONE_NUMBER_DISPLAY = '(561) 468-5571';

interface CallWindowManButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  source?: string;
}

/**
 * CallWindowManButton - Specialized phone button with click-to-reveal pattern
 * 
 * Mobile: Opens dialer prepopulated with the business number
 * Desktop: Reveals the number on click to hide from scrapers/bots
 * 
 * Analytics events:
 * - phone_reveal_click: When user clicks to reveal number (desktop)
 * - phone_call_initiated: When dialer is opened (mobile)
 */
export function CallWindowManButton({ 
  className, 
  variant = 'outline',
  size = 'lg',
  source = 'consultation'
}: CallWindowManButtonProps) {
  const isMobile = useIsMobile();
  const [isRevealed, setIsRevealed] = useState(false);

  const handleClick = useCallback(() => {
    if (isMobile) {
      // Mobile: Open dialer directly
      trackEvent('phone_call_initiated', {
        source,
        phone_number: PHONE_NUMBER,
        device: 'mobile',
      });
      window.location.href = `tel:${PHONE_NUMBER}`;
    } else {
      // Desktop: Reveal the number
      if (!isRevealed) {
        trackEvent('phone_reveal_click', {
          source,
          device: 'desktop',
        });
        setIsRevealed(true);
      } else {
        // Already revealed - open dialer (for softphones)
        trackEvent('phone_call_initiated', {
          source,
          phone_number: PHONE_NUMBER,
          device: 'desktop',
        });
        window.location.href = `tel:${PHONE_NUMBER}`;
      }
    }
  }, [isMobile, isRevealed, source]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        'transition-all duration-200',
        isRevealed && 'font-mono',
        className
      )}
    >
      <Phone className="mr-2 h-4 w-4" />
      {isRevealed ? PHONE_NUMBER_DISPLAY : 'Call Window Man'}
    </Button>
  );
}
