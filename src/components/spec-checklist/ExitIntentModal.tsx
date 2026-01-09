import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getAttributionData } from '@/lib/attribution';
import { trackEvent, trackLeadCapture } from '@/lib/gtm';
import { exitIntentData } from '@/data/specChecklistData';
import type { SourceTool } from '@/types/sourceTool';

interface ExitIntentModalProps {
  hasConverted: boolean;
  onSuccess?: () => void;
}

const STORAGE_KEY = 'spec_checklist_exit_intent_shown';
const MIN_TIME_ON_PAGE = 15000; // 15 seconds
const MIN_SCROLL_DEPTH = 0.4; // 40%
const MOBILE_SCROLL_THRESHOLD = 0.6; // 60% scroll for mobile trigger

const ExitIntentModal: React.FC<ExitIntentModalProps> = ({ hasConverted, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoadTime] = useState(Date.now());
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);

  const {
    values,
    getFieldProps,
    hasError,
    getError,
    validateAll,
  } = useFormValidation({
    initialValues: { email: '' },
    schemas: {
      email: commonSchemas.email,
    },
  });

  // Check if modal can be shown
  const canShowModal = useCallback(() => {
    if (hasConverted) return false;
    if (typeof window === 'undefined') return false;
    
    // Check if already shown this session
    const alreadyShown = localStorage.getItem(STORAGE_KEY);
    if (alreadyShown) return false;

    // Check time on page
    const timeOnPage = Date.now() - pageLoadTime;
    if (timeOnPage < MIN_TIME_ON_PAGE) return false;

    // Check scroll depth
    if (maxScrollDepth < MIN_SCROLL_DEPTH) return false;

    return true;
  }, [hasConverted, pageLoadTime, maxScrollDepth]);

  // Show modal and track
  const showModal = useCallback(() => {
    if (!canShowModal()) return;
    
    setIsOpen(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    trackEvent('exit_intent_shown', { 
      page: 'spec_checklist_guide',
      scroll_depth: Math.round(maxScrollDepth * 100),
      time_on_page_seconds: Math.round((Date.now() - pageLoadTime) / 1000),
    });
  }, [canShowModal, maxScrollDepth, pageLoadTime]);

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

  // Mobile: Scroll up detection after reaching threshold
  useEffect(() => {
    const handleScrollUp = () => {
      // Only trigger on mobile (rough detection)
      if (window.innerWidth > 768) return;
      
      // Only if we've scrolled deep enough
      if (maxScrollDepth < MOBILE_SCROLL_THRESHOLD) return;
      
      // Detect scroll up
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY - 100) { // 100px scroll up
        showModal();
      }
    };

    window.addEventListener('scroll', handleScrollUp, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollUp);
  }, [showModal, maxScrollDepth, lastScrollY]);

  const handleClose = () => {
    setIsOpen(false);
    trackEvent('exit_intent_closed', { page: 'spec_checklist_guide' });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) return;
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('save-lead', {
        body: {
          email: values.email,
          name: 'Friend', // Default name for exit intent
          sourceTool: 'spec-checklist-guide' satisfies SourceTool,
          attribution: getAttributionData(),
          aiContext: { 
            source_form: 'spec-checklist-guide-exit-intent',
          },
        },
      });
      
      if (error) throw error;
      
      trackEvent('exit_intent_converted', { 
        page: 'spec_checklist_guide',
      });
      
      trackLeadCapture({
        sourceTool: 'spec-checklist-guide' satisfies SourceTool,
        email: values.email,
        leadScore: 30, // Lower value than main CTA
        hasPhone: false,
      });
      
      trackEvent('generate_lead', {
        lead_source: 'spec_checklist_guide',
        form_location: 'exit_intent',
        value: 30,
      });
      
      toast({
        title: "Checklist Unlocked!",
        description: "Check your email! Your Pre-Installation Audit Checklist is on its way.",
      });
      
      setIsOpen(false);
      onSuccess?.(); // Mark as converted to hide other CTAs
      
    } catch (error) {
      console.error('Exit intent form error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or email support@windowguy.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Content */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
            <AlertTriangle className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            {exitIntentData.headline}
          </h2>
          <p className="text-sm text-muted-foreground">
            {exitIntentData.copy}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input 
              type="email"
              {...getFieldProps('email')}
              placeholder="your@email.com"
              className={`bg-background ${hasError('email') ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
            />
            {hasError('email') && (
              <p className="text-xs text-destructive">{getError('email')}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            size="lg" 
            className="w-full gap-2" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : exitIntentData.buttonText}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            We'll never share your email. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ExitIntentModal;
