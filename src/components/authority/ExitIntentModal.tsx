import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, Shield, Save, Bell, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MethodologyBadge } from '@/components/authority/MethodologyBadge';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { trackEvent } from '@/lib/gtm';
import { ROUTES } from '@/config/navigation';
import type { SourceTool } from '@/types/sourceTool';

type ExitIntentStep = 'rehook' | 'vault' | 'safety';

interface ExitIntentModalProps {
  /** The source tool for analytics attribution */
  sourceTool: SourceTool;
  /** Whether the user has already converted (skip showing modal) */
  hasConverted?: boolean;
  /** Current tool result data to reference in messaging */
  resultSummary?: string;
  /** Callback when modal successfully captures lead */
  onSuccess?: () => void;
}

const STORAGE_KEY_PREFIX = 'authority_exit_intent_';
const MIN_TIME_ON_PAGE = 10000; // 10 seconds
const MIN_SCROLL_DEPTH = 0.3; // 30%

export function ExitIntentModal({ 
  sourceTool, 
  hasConverted = false,
  resultSummary,
  onSuccess 
}: ExitIntentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ExitIntentStep>('rehook');
  const [pageLoadTime] = useState(Date.now());
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);

  const storageKey = `${STORAGE_KEY_PREFIX}${sourceTool}`;

  // Form for vault signup (email)
  const vaultForm = useFormValidation({
    initialValues: { email: '' },
    schemas: { email: commonSchemas.email },
  });

  // Form for safety alerts (phone)
  const safetyForm = useFormValidation({
    initialValues: { phone: '' },
    schemas: { phone: commonSchemas.phone },
  });

  const vaultSubmit = useLeadFormSubmit({
    sourceTool,
    formLocation: 'exit_intent_vault',
    leadScore: 40,
    successTitle: 'Saved to Vault!',
    successDescription: 'Your results are safely stored. Access them anytime from your Window Vault.',
    onSuccess: () => {
      trackEvent('exit_intent_converted', { 
        page: sourceTool, 
        step: 'vault',
        conversion_type: 'vault_signup'
      });
      setIsOpen(false);
      onSuccess?.();
    },
  });

  const safetySubmit = useLeadFormSubmit({
    sourceTool,
    formLocation: 'exit_intent_safety',
    leadScore: 20,
    successTitle: 'You\'re Protected!',
    successDescription: 'You\'ll receive hurricane alerts when storms approach Florida.',
    onSuccess: () => {
      trackEvent('exit_intent_converted', { 
        page: sourceTool, 
        step: 'safety',
        conversion_type: 'safety_alerts'
      });
      setIsOpen(false);
      onSuccess?.();
    },
  });

  // Check if modal can be shown
  const canShowModal = useCallback(() => {
    if (hasConverted) return false;
    if (typeof window === 'undefined') return false;
    
    const alreadyShown = sessionStorage.getItem(storageKey);
    if (alreadyShown) return false;

    const timeOnPage = Date.now() - pageLoadTime;
    if (timeOnPage < MIN_TIME_ON_PAGE) return false;

    if (maxScrollDepth < MIN_SCROLL_DEPTH) return false;

    return true;
  }, [hasConverted, pageLoadTime, maxScrollDepth, storageKey]);

  const showModal = useCallback(() => {
    if (!canShowModal()) return;
    
    setIsOpen(true);
    setStep('rehook');
    sessionStorage.setItem(storageKey, 'true');
    trackEvent('exit_intent_shown', { 
      page: sourceTool,
      scroll_depth: Math.round(maxScrollDepth * 100),
      time_on_page_seconds: Math.round((Date.now() - pageLoadTime) / 1000),
    });
  }, [canShowModal, maxScrollDepth, pageLoadTime, sourceTool, storageKey]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScrollDepth = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      
      setMaxScrollDepth((prev) => Math.max(prev, currentScrollDepth));
      setLastScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Desktop: Mouse leave detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        showModal();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showModal]);

  // Mobile: Scroll up detection
  useEffect(() => {
    const handleScrollUp = () => {
      if (window.innerWidth > 768) return;
      if (maxScrollDepth < 0.5) return;
      
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY - 80) {
        showModal();
      }
    };

    window.addEventListener('scroll', handleScrollUp, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollUp);
  }, [showModal, maxScrollDepth, lastScrollY]);

  const handleClose = () => {
    setIsOpen(false);
    trackEvent('exit_intent_closed', { page: sourceTool, step });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleDecline = () => {
    trackEvent('exit_intent_declined', { page: sourceTool, step });
    if (step === 'rehook') {
      setStep('vault');
    } else if (step === 'vault') {
      setStep('safety');
    } else {
      handleClose();
    }
  };

  const handleVaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultForm.validateAll()) return;
    await vaultSubmit.submit({ email: vaultForm.values.email, name: 'Vault User' });
  };

  const handleSafetySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyForm.validateAll()) return;
    // Include a placeholder email for safety alerts since email is required
    await safetySubmit.submit({ 
      email: `safety-alert-${Date.now()}@placeholder.local`, 
      phone: safetyForm.values.phone, 
      name: 'Safety Alert Subscriber' 
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-card rounded-xl border-2 border-primary/30 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Step 1: Re-Hook */}
        {step === 'rehook' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Wait! Before you go...
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {resultSummary 
                  ? `Your ${resultSummary} calculation isn't complete.`
                  : 'Would you like to finish your calculation?'
                }
              </p>
            </div>

            <MethodologyBadge variant="card" className="mb-4" />

            <div className="space-y-3">
              <Button asChild size="lg" className="w-full gap-2">
                <Link to={ROUTES.FREE_ESTIMATE}>
                  Get a More Accurate Free Estimate
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground"
                onClick={handleDecline}
              >
                No thanks, I'll come back later
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Value Vault */}
        {step === 'vault' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <Save className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Save Your Results
              </h2>
              <p className="text-sm text-muted-foreground">
                Don't lose your calculation! Save it to your free Window Vault and access it anytime.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Your Free Vault Includes:
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• All your tool results in one place</li>
                <li>• Quote comparison history</li>
                <li>• Personalized recommendations</li>
              </ul>
            </div>

            <form onSubmit={handleVaultSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="email"
                  {...vaultForm.getFieldProps('email')}
                  placeholder="your@email.com"
                  className={`bg-background ${vaultForm.hasError('email') ? 'border-destructive' : ''}`}
                  disabled={vaultSubmit.isSubmitting}
                />
                {vaultForm.hasError('email') && (
                  <p className="text-xs text-destructive">{vaultForm.getError('email')}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                variant="cta"
                size="lg" 
                className="w-full gap-2" 
                disabled={vaultSubmit.isSubmitting}
              >
                {vaultSubmit.isSubmitting ? 'Saving...' : 'Save to My Vault'}
                {!vaultSubmit.isSubmitting && <Save className="w-4 h-4" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground"
                onClick={handleDecline}
                type="button"
              >
                Skip for now
              </Button>
            </form>
          </div>
        )}

        {/* Step 3: Safety Downsell */}
        {step === 'safety' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 rounded-full mb-4">
                <Bell className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Stay Safe This Hurricane Season
              </h2>
              <p className="text-sm text-muted-foreground">
                Get free hurricane text alerts with real-time storm updates for your area.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">100% Free:</strong> We'll only text you when there's 
                a storm that could affect Florida. No spam, ever.
              </p>
            </div>

            <form onSubmit={handleSafetySubmit} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="tel"
                  {...safetyForm.getFieldProps('phone')}
                  placeholder="(555) 555-5555"
                  className={`bg-background ${safetyForm.hasError('phone') ? 'border-destructive' : ''}`}
                  disabled={safetySubmit.isSubmitting}
                />
                {safetyForm.hasError('phone') && (
                  <p className="text-xs text-destructive">{safetyForm.getError('phone')}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full gap-2 bg-amber-500 hover:bg-amber-600" 
                disabled={safetySubmit.isSubmitting}
              >
                {safetySubmit.isSubmitting ? 'Signing up...' : 'Get Hurricane Alerts'}
                {!safetySubmit.isSubmitting && <Bell className="w-4 h-4" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground"
                onClick={handleClose}
                type="button"
              >
                No thanks
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExitIntentModal;
