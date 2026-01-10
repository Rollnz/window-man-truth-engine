import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import {
  ShieldCheck,
  Download,
  Smartphone,
  Clock,
  FileText,
  AlertTriangle,
  PauseCircle,
  CheckCircle2,
  ArrowRight,
  ScanSearch,
  Scale,
  Calculator,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getAttributionData } from '@/lib/attribution';
import { Navbar } from '@/components/home/Navbar';
import { ROUTES } from '@/config/navigation';
import type { SourceTool } from '@/types/sourceTool';

const KitchenTableGuide = () => {
  usePageTracking('kitchen-table-guide');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    values,
    getFieldProps,
    hasError,
    getError,
    validateAll,
  } = useFormValidation({
    initialValues: { name: '', email: '' },
    schemas: {
      name: commonSchemas.name,
      email: commonSchemas.email,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) return;
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('save-lead', {
        body: {
          email: values.email,
          name: values.name,
          sourceTool: 'kitchen-table-guide' satisfies SourceTool,
          attribution: getAttributionData(),
          aiContext: { source_form: 'kitchen-table-guide' },
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "Guide Unlocked!",
        description: "Check your inbox - the guide is on its way.",
      });
      
      console.log('[Analytics] landing_page_lead_captured', {
        source: 'kitchen-table-guide',
        timestamp: new Date().toISOString(),
      });
      
      setTimeout(() => {
        navigate(ROUTES.QUOTE_SCANNER);
      }, 1500);
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* SECTION 1 — HERO */}
      <div className="pt-14">
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-16 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Column */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Built for homeowners • No sales pitch</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Before You Sign Anything at Your Kitchen Table, Read This.
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Most window quotes aren't designed to inform you — they're designed to control the conversation. This short guide shows you how in-home sales presentations apply pressure and steer decisions, so you can slow things down.
              </p>

              <div className="space-y-4">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Unlock the Kitchen Table Guide
                  <Download className="w-4 h-4" />
                </Button>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Takes 2 mins
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-4 h-4" /> Mobile friendly
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> No phone calls
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Already have a quote?</p>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => navigate(ROUTES.QUOTE_SCANNER)}
                >
                  Scan it for pressure tactics <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image Column */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-75" />
              
              <div className="relative">
                <div className="relative bg-card rounded-xl shadow-2xl p-2 border border-border">
                  <img 
                    src="/images/defense-kit-book.webp"
                    alt="Kitchen Table Defense Kit Preview"
                    className="w-64 sm:w-80 h-auto rounded-lg"
                  />
                  
                  <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Insider Trade Secrets
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-lg px-4 py-3 shadow-lg">
                  <p className="text-xs text-muted-foreground">Contains</p>
                  <p className="text-sm font-semibold text-foreground">The "Pause" Script</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — IMMEDIATE VALIDATION */}
      <section className="py-16 sm:py-24 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
            If Something Felt "Off"… <br />You're Not Imagining It.
          </h2>
          
          <div className="text-left space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Most homeowners can't explain why the kitchen table conversation made them uncomfortable — only that it did. That's because modern window sales presentations aren't scripted conversations. They're scripted experiences, built to:
            </p>
            
            <div className="space-y-3">
              {[
                "Anchor you to a large number early",
                "Create artificial urgency",
                "Control which comparisons feel 'reasonable'",
                "Frame hesitation as a mistake"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
              "None of this requires lying. It only requires controlling the pace and framing."
            </blockquote>

            <p className="text-foreground font-medium">
              This guide explains how to take it back.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2.5 — SOURCE IDENTITY */}
      <section className="py-12 bg-muted/30 border-y border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">From the Windowman Vault Archives</p>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Compiled from real in-home window sales presentations, quote audits, and contract reviews — by independent industry veterans who got tired of watching neighbors overpay at their own kitchen tables.
          </p>
        </div>
      </section>

      {/* SECTION 3 — WHAT THIS GUIDE ACTUALLY IS */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="relative bg-muted rounded-xl p-8 border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">The Kitchen Table Guide</p>
                    <p className="text-sm text-muted-foreground">12 Pages • PDF • 1.2MB</p>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-5/6" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-4/6" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Lock className="w-4 h-4" />
                  Preview Locked
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">What This Guide Actually Is</h2>
              <p className="text-muted-foreground leading-relaxed">
                This is not a long ebook. It's a 12-page, mobile-friendly field guide designed to be read in under 3 minutes — even while the salesperson is measuring your windows.
              </p>
              
              <div className="space-y-3">
                {[
                  "A one-page Red Flag Checklist",
                  "The exact phrases used to manufacture urgency",
                  "A simple pause script you can use without confrontation",
                  'A final "Do Not Sign If…" page'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-foreground italic">
                  This guide doesn't tell you what to buy. It teaches you how to listen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — THE GATE (PRIMARY CONVERSION) */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Get the Kitchen Table Guide</h2>
            <p className="text-primary-foreground/80">Free PDF • Instant Access</p>
          </div>

          <div className="bg-background rounded-xl p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">First Name</Label>
                <Input 
                  id="name"
                  {...getFieldProps('name')}
                  placeholder="Your name"
                  className={`bg-background ${hasError('name') ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
                {hasError('name') && (
                  <p className="text-xs text-destructive">{getError('name')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <Input 
                  id="email"
                  type="email"
                  {...getFieldProps('email')}
                  placeholder="you@example.com"
                  className={`bg-background ${hasError('email') ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
                {hasError('email') && (
                  <p className="text-xs text-destructive">{getError('email')}</p>
                )}
              </div>
              
              <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Me the Guide'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                We'll also save this to your private Windowman Vault.
              </p>
            </form>

            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-border text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> No Spam
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> No Sales Calls
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> No Contractor Handoff
              </span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-primary-foreground mb-2">Why is this free?</p>
            <p className="text-sm text-primary-foreground/80">
              Because an informed homeowner makes better decisions. When you're ready to verify a quote or slow things down, we hope you'll use our tools after the sale.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHAT HAPPENS NEXT */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            After You Read It, You'll Have 3 Clear Options
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 dark:bg-amber-500/20 rounded-full border border-amber-500/30">
                <PauseCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">1. Do Nothing Yet</h3>
              <p className="text-sm text-muted-foreground">
                Pause. Re-read your quote. Let the pressure fade. No option pushes you forward.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-500/10 dark:bg-sky-500/20 rounded-full border border-sky-500/30">
                <ScanSearch className="w-8 h-8 text-sky-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">2. Sanity-Check It</h3>
              <p className="text-sm text-muted-foreground">
                Upload it to the Quote Scanner and see where pressure or padding may exist.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full border border-emerald-500/30">
                <Calculator className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">3. Get Clarity on Price</h3>
              <p className="text-sm text-muted-foreground">
                Use the Cost Calculator to understand a fair range before talking to anyone again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CROSS-TOOL BRIDGES */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-12">
            Tools Homeowners Use After Reading
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                  <ScanSearch className="w-5 h-5 text-sky-500" />
                </div>
                <h3 className="font-semibold text-foreground">Quote Scanner</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Scan your quote for pressure tactics and confidence gaps.
              </p>
              <Button 
                variant="cta" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => navigate(ROUTES.QUOTE_SCANNER)}
              >
                Scan My Quote <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-cyan-500" />
                </div>
                <h3 className="font-semibold text-foreground">Comparison Tool</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Compare multiple quotes side-by-side with real cost analysis.
              </p>
              <Button 
                variant="cta" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => navigate(ROUTES.COMPARISON)}
              >
                Compare Quotes <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-foreground">Cost Calculator</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Understand what windows should actually cost before you buy.
              </p>
              <Button 
                variant="cta" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => navigate(ROUTES.COST_CALCULATOR)}
              >
                Calculate Costs <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — OPTIONAL MEASUREMENT */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
            Need Independent Measurements?
          </h2>
          <p className="text-muted-foreground mb-8">
            Want someone to measure your windows without a sales pitch? Book a no-obligation measurement from our independent technicians. No commission, no pressure.
          </p>
          <Button variant="outline" size="lg" className="gap-2">
            Learn About Professional Measurements <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xs">
                W
              </div>
              <span className="text-sm text-muted-foreground">© 2025 Windowman Vault</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate(ROUTES.PRIVACY)} className="hover:text-foreground transition-colors">
                Privacy
              </button>
              <button onClick={() => navigate(ROUTES.TERMS)} className="hover:text-foreground transition-colors">
                Terms
              </button>
              <button onClick={() => navigate(ROUTES.INTEL)} className="hover:text-foreground transition-colors">
                Intel Library
              </button>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default KitchenTableGuide;
