import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BadgeDollarSign, ScanSearch } from 'lucide-react';
import { FOOTER_NAV } from '@/config/navigation';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';

export function MobileStickyFooter() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY.current;
        const scrollingUp = currentScrollY < lastScrollY.current;
        
        // Only toggle visibility after scrolling more than 10px to prevent jitter
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

  const handleCTAClick = (cta: 'beat_your_quote' | 'scan_quote') => {
    trackEvent('footer_cta_click', {
      cta,
      surface: 'sticky_footer',
      page: location.pathname,
    });
  };

  const handleNavClick = (link: string) => {
    trackEvent('footer_nav_click', {
      link,
      surface: 'sticky_footer',
      page: location.pathname,
    });
  };

  return (
    <div 
      className={`
        fixed bottom-0 left-0 right-0 z-40 
        bg-white dark:bg-white 
        border-t border-slate-200 
        shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
        md:hidden
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="px-4 py-3 space-y-1.5">
        {/* Primary CTA Row - Beat & Scan Buttons */}
        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
            onClick={() => handleCTAClick('beat_your_quote')}
          >
            <Link to={FOOTER_NAV.BEAT_YOUR_QUOTE}>
              <BadgeDollarSign className="w-4 h-4 mr-2" aria-hidden="true" />
              Beat Your Quote
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1 h-12 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-semibold text-sm"
            onClick={() => handleCTAClick('scan_quote')}
          >
            <Link to={FOOTER_NAV.SCAN_QUOTE}>
              <ScanSearch className="w-4 h-4 mr-2" aria-hidden="true" />
              Scan Quote
            </Link>
          </Button>
        </div>

        {/* Micro-copy */}
        <p className="text-[11px] text-slate-500 text-center">
          Upload your quote for a free analysis
        </p>

        {/* Secondary Navigation Row */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <Link 
            to={FOOTER_NAV.HOME}
            onClick={() => handleNavClick('home')}
            className="text-slate-600 hover:text-slate-900 transition-colors py-1"
          >
            Home
          </Link>
          <Link 
            to={FOOTER_NAV.ALL_TOOLS}
            onClick={() => handleNavClick('all_tools')}
            className="text-slate-600 hover:text-slate-900 transition-colors py-1"
          >
            All Tools
          </Link>
          <Link 
            to={FOOTER_NAV.PRIVACY}
            onClick={() => handleNavClick('privacy')}
            className="text-slate-600 hover:text-slate-900 transition-colors py-1"
          >
            Privacy
          </Link>
          <Link 
            to={FOOTER_NAV.TERMS}
            onClick={() => handleNavClick('terms')}
            className="text-slate-600 hover:text-slate-900 transition-colors py-1"
          >
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
