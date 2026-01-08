import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ClipboardList, Download, Smartphone, Clock, FileText, CheckCircle2, ArrowRight, ScanSearch, Scale, Calculator, Lock, HelpCircle, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getAttributionData } from '@/lib/attribution';
const SpecChecklistGuide = () => {
  usePageTracking('spec-checklist-guide');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    values,
    getFieldProps,
    hasError,
    getError,
    validateAll
  } = useFormValidation({
    initialValues: {
      name: '',
      email: ''
    },
    schemas: {
      name: commonSchemas.name,
      email: commonSchemas.email
    }
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    setIsSubmitting(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('save-lead', {
        body: {
          email: values.email,
          name: values.name,
          sourceTool: 'spec-checklist-guide',
          attribution: getAttributionData(),
          aiContext: {
            source_form: 'spec-checklist-guide'
          }
        }
      });
      if (error) throw error;
      toast({
        title: "Checklist Unlocked!",
        description: "Check your inbox - the checklist is on its way."
      });
      console.log('[Analytics] landing_page_lead_captured', {
        source: 'spec-checklist-guide',
        timestamp: new Date().toISOString()
      });
      setTimeout(() => {
        navigate('/quote-scanner');
      }, 1500);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-md sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button onClick={() => navigate('/')} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
                W
              </div>
              <span className="font-semibold text-foreground">Windowman Vault</span>
            </button>

            <div className="hidden md:flex items-center space-x-6">
              <button onClick={() => navigate('/comparison')} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Compare Windows
              </button>
              <button onClick={() => navigate('/intel')} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Intel Library
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* SECTION 1 — HERO */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-16 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Column */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground uppercase tracking-wider">
                <ClipboardList className="w-4 h-4 text-primary" />
                <span>​Complete Checklist </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Stop Comparing Apples to Oranges. Get the Spec Checklist.
              </h1>

              <p className="text-lg leading-relaxed text-primary-foreground">
                Every contractor uses different terms for the same specs. This checklist standardizes everything — so you can finally compare quotes side-by-side like a pro.
              </p>

              <div className="space-y-4">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Get the Checklist
                  <Download className="w-4 h-4" />
                </Button>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 text-primary-foreground">
                    <Clock className="w-4 h-4" /> 3 min read
                  </span>
                  <span className="flex items-center gap-1 text-primary-foreground">
                    <Smartphone className="w-4 h-4" /> Print or digital
                  </span>
                  <span className="flex items-center gap-1 text-primary-foreground">
                    <CheckCircle2 className="w-4 h-4" /> Side-by-side format
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Have multiple quotes already?</p>
                <Button variant="outline" className="gap-2" onClick={() => navigate('/comparison')}>
                  Use our Comparison Tool <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image Column */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-75" />
              
              <div className="relative">
                <div className="relative bg-card rounded-xl shadow-2xl p-2 border border-border">
                  <img src="/images/spec-checklist-book.webp" alt="Impact Window Audit Packet - Homeowner's Spec Check" className="w-64 sm:w-80 h-auto rounded-lg" />
                  
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Complete Spec Sheet
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-lg px-4 py-3 shadow-lg">
                  <p className="text-xs text-muted-foreground">Covers</p>
                  <p className="text-sm font-semibold text-foreground">12 Key Specifications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM */}
      <section className="py-16 sm:py-24 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
            Why Every Quote Looks Different<br />(Even When They Shouldn't)
          </h2>
          
          <div className="text-left space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Contractors deliberately use different terminology to make direct comparisons difficult. One says "DP50," another says "structural rating," and a third just says "hurricane-rated." Are they the same? You have no idea.
            </p>
            
            <div className="space-y-3">
              {["U-Factor vs SHGC vs VLT — which actually matters for Florida?", "What ASTM ratings should you actually demand?", "How to spot warranty red flags before signing", "Installation quality indicators you can verify yourself"].map((item, i) => <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </div>)}
            </div>

            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
              "If you can't compare specs line-by-line, you're comparing marketing — not products."
            </blockquote>

            <p className="text-foreground font-medium">
              This checklist gives you the exact specs to demand from every contractor.
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
            Compiled from Florida building codes, AAMA standards, and real-world installation audits by licensed contractors.
          </p>
        </div>
      </section>

      {/* SECTION 3 — WHAT THIS GUIDE COVERS */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="relative bg-muted rounded-xl p-8 border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Spec Checklist</p>
                    <p className="text-sm text-muted-foreground">8 Pages • PDF • 0.8MB</p>
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
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">What You'll Get</h2>
              <p className="text-muted-foreground leading-relaxed">
                A simple, print-ready checklist you can bring to every sales meeting. Hand it to the contractor and say: "Fill this out for your quote."
              </p>
              
              <div className="space-y-3">
                {["ASTM Ratings Explained Simply", "U-Factor vs SHGC: What Actually Matters", "Warranty Red Flags to Watch For", "Installation Quality Indicators", "Side-by-Side Comparison Grid"].map((feature, i) => <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>)}
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-foreground italic">
                  Force every contractor to speak the same language. Then compare.
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Get the Spec Checklist</h2>
            <p className="text-primary-foreground/80">Free PDF • Print or Save</p>
          </div>

          <div className="bg-background rounded-xl p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">First Name</Label>
                <Input id="name" {...getFieldProps('name')} placeholder="Your name" className={`bg-background ${hasError('name') ? 'border-destructive' : ''}`} disabled={isSubmitting} />
                {hasError('name') && <p className="text-xs text-destructive">{getError('name')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <Input id="email" type="email" {...getFieldProps('email')} placeholder="you@example.com" className={`bg-background ${hasError('email') ? 'border-destructive' : ''}`} disabled={isSubmitting} />
                {hasError('email') && <p className="text-xs text-destructive">{getError('email')}</p>}
              </div>
              
              <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Me the Checklist'}
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
                <CheckCircle2 className="w-3.5 h-3.5" /> Print-Ready
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHAT HAPPENS NEXT */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            How to Use the Checklist
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">1. Print It</h3>
              <p className="text-sm text-muted-foreground">
                Download and print one copy for each contractor you're meeting with.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                <Zap className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">2. Hand It Over</h3>
              <p className="text-sm text-muted-foreground">
                Say: "Please fill this out alongside your quote so I can compare."
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                <Scale className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">3. Compare Easily</h3>
              <p className="text-sm text-muted-foreground">
                Line up the checklists. Now you're comparing products, not marketing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CROSS-TOOL BRIDGES */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-12">
            Related Tools
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-foreground">Comparison Tool</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Input your specs and see 10-year true costs side-by-side.
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate('/comparison')}>
                Compare Options <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <ScanSearch className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-foreground">Quote Scanner</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your quote for AI-powered spec verification.
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate('/quote-scanner')}>
                Scan My Quote <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-foreground">Cost Calculator</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Estimate what you should pay for your window project.
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate('/cost-calculator')}>
                Calculate Costs <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
              <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
                Privacy
              </button>
              <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">
                Terms
              </button>
              <button onClick={() => navigate('/intel')} className="hover:text-foreground transition-colors">
                Intel Library
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default SpecChecklistGuide;