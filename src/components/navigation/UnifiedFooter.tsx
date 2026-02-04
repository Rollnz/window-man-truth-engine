import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Shield, Lock, BadgeDollarSign, ScanSearch } from 'lucide-react';
import { ROUTES, FOOTER_NAV } from '@/config/navigation';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export function UnifiedFooter() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const handleCTAClick = (cta: 'beat_your_quote' | 'scan_quote') => {
    trackEvent('footer_cta_click', {
      cta,
      surface: 'full_footer',
      page: location.pathname
    });
  };
  const handleNavClick = (link: string) => {
    trackEvent('footer_nav_click', {
      link,
      surface: 'full_footer',
      page: location.pathname
    });
  };
  return <footer className="bg-white dark:bg-white border-t border-slate-200 py-12 md:py-16">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Top section - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-10 md:mb-12">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-slate-900">
                <span className="text-primary">Impact</span> Windows
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Helping Florida homeowners make informed decisions about window investments 
                since 2010.
              </p>
              <Link to={ROUTES.EXPERT} onClick={() => handleNavClick('expert')} className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                <span>Ask a Question</span>
              </Link>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Explore Tools
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to={ROUTES.REALITY_CHECK} onClick={() => handleNavClick('reality_check')} className="text-sm text-slate-900 hover:text-primary transition-colors">
                    Reality Check Tool
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.COST_CALCULATOR} onClick={() => handleNavClick('cost_calculator')} className="text-sm text-slate-900 hover:text-primary transition-colors">
                    Cost of Inaction Calculator
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.COMPARISON} onClick={() => handleNavClick('comparison')} className="text-sm text-slate-900 hover:text-primary transition-colors">
                    Comparison Tool
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.EVIDENCE} onClick={() => handleNavClick('evidence')} className="text-sm text-slate-900 hover:text-primary transition-colors">
                    Evidence Locker
                  </Link>
                </li>
              </ul>
            </div>

            {/* Privacy commitment */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Your Privacy Matters
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm text-slate-600">
                    Your data stays private 
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm text-slate-600">
                    No sales calls unless you request them.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 pt-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* Copyright - Left */}
              <p className="text-sm text-slate-500 order-3 md:order-1 text-center md:text-left">
                © {currentYear} Impact Windows. All rights reserved.
              </p>

              {/* CTA Buttons - Center */}
              <TooltipProvider>
                <div className="flex flex-col items-center order-1 md:order-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={() => handleCTAClick('beat_your_quote')}>
                          <Link to={FOOTER_NAV.BEAT_YOUR_QUOTE}>
                            <BadgeDollarSign className="w-4 h-4 mr-2" aria-hidden="true" />
                            Beat Your Quote
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Compare your contractor's price against fair market rates</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 hover:text-primary font-semibold" onClick={() => handleCTAClick('scan_quote')}>
                          <Link to={FOOTER_NAV.SCAN_QUOTE}>
                            <ScanSearch className="w-4 h-4 mr-2" aria-hidden="true" />
                            Scan Quote
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>AI analyzes your quote to flag overcharges and missing details</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-center mt-2 font-semibold text-dossier-modal text-sm">
                    Upload your quote for a free analysis
                  </p>
                </div>
              </TooltipProvider>

              {/* Legal links - Right */}
              <div className="flex items-center justify-center md:justify-end gap-4 md:gap-6 order-2 md:order-3">
                <Link to={FOOTER_NAV.HOME} onClick={() => handleNavClick('home')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors min-h-[44px] flex items-center">
                  Home
                </Link>
                <Link to={FOOTER_NAV.ALL_TOOLS} onClick={() => handleNavClick('all_tools')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors min-h-[44px] flex items-center">
                  All Tools
                </Link>
                <Link to={FOOTER_NAV.PRIVACY} onClick={() => handleNavClick('privacy')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors min-h-[44px] flex items-center">
                  Privacy
                </Link>
                <Link to={FOOTER_NAV.TERMS} onClick={() => handleNavClick('terms')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors min-h-[44px] flex items-center">
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>;
}