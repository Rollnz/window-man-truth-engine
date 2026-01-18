import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ROUTES } from '@/config/navigation';
import {
  Wallet,
  Download,
  Smartphone,
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  Lock,
  DollarSign,
  Percent,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/home/Navbar';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';
import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { useSessionData } from '@/hooks/useSessionData';
import { getGuidePageSchemas, getBreadcrumbSchema } from '@/lib/seoSchemas/index';
import { ProTipBox } from '@/components/seo';
import { ReviewedByBadge, ExitIntentModal } from '@/components/authority';

const InsuranceSavingsGuide = () => {
  usePageTracking('insurance-savings-guide');
  const navigate = useNavigate();
  const { sessionData } = useSessionData();
  const frameControl = getFrameControl('insurance-savings-guide');
  const smartTools = getSmartRelatedTools('insurance-savings-guide', sessionData.toolsCompleted);

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

  const { submit, isSubmitting } = useLeadFormSubmit({
    sourceTool: 'insurance-savings-guide',
    formLocation: 'main',
    leadScore: 40,
    redirectTo: '/cost-calculator',
    successTitle: 'Blueprint Unlocked!',
    successDescription: 'Check your inbox - the savings blueprint is on its way.',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    await submit({ email: values.email, name: values.name });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="Florida Insurance Savings Blueprint"
        description="Learn how impact windows can cut your Florida insurance by 20%. Includes NOA documentation guide, wind mitigation inspection steps, and premium recalculation process."
        canonicalUrl="https://itswindowman.com/insurance-savings-guide"
        jsonLd={[...getGuidePageSchemas('insurance-savings-guide'), getBreadcrumbSchema('insurance-savings-guide')]}
      />
      <Navbar />

      {/* SECTION 1 — HERO */}
      <div className="pt-14">
      <section className="relative bg-gradient-to-br from-green-500/5 via-background to-primary/10 py-16 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Column */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-green-500" />
                <span>Premium Reduction Guide • 10 Pages</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Your New Windows Could Cut Your Insurance by 20%. Here's How.
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Most Florida homeowners don't know impact windows qualify for significant insurance discounts. This guide shows you exactly which specs qualify, what documentation you need, and how to claim your savings.
              </p>

              <div className="space-y-4">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Get the Savings Blueprint
                  <Download className="w-4 h-4" />
                </Button>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> 4 min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-4 h-4" /> Mobile friendly
                  </span>
                  <span className="flex items-center gap-1">
                    <Percent className="w-4 h-4" /> Up to 20% savings
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Want to calculate your potential savings?</p>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => navigate(ROUTES.COST_CALCULATOR)}
                >
                  Use the Cost Calculator <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image Column */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 bg-green-500/10 rounded-full blur-3xl scale-75" />
              
              <div className="relative">
                <div className="relative bg-card rounded-xl shadow-2xl p-2 border border-border">
                  <img 
                    src="/images/insurance-savings-book.webp"
                    alt="Florida Insurance Savings Blueprint Preview"
                    className="w-64 sm:w-80 h-auto rounded-lg"
                  />
                  
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                    <DollarSign className="w-3.5 h-3.5" />
                    Save Up to 20%
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-lg px-4 py-3 shadow-lg">
                  <p className="text-xs text-muted-foreground">Includes</p>
                  <p className="text-sm font-semibold text-foreground">NOA Documentation Guide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE OPPORTUNITY */}
      <section className="py-16 sm:py-24 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
            Florida Law Requires Insurers to Offer<br />Wind Mitigation Discounts. Most Don't Tell You.
          </h2>
          
          <div className="text-left space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Under Florida Statute 627.0629, insurance companies must provide premium discounts for homes with wind-resistant features — including impact windows. But they won't volunteer this information. You have to ask.
            </p>
            
            <div className="space-y-3">
              {[
                "Impact windows can qualify for 'Opening Protection' credits",
                "Proper documentation is required (NOA certificates, inspection reports)",
                "You can stack multiple mitigation credits for bigger savings",
                "Some carriers offer additional discounts beyond state minimums"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <blockquote className="border-l-4 border-green-500 pl-4 italic text-muted-foreground">
              "The average Florida homeowner with impact windows is missing $400-800/year in unclaimed discounts."
            </blockquote>

            <p className="text-foreground font-medium">
              This guide shows you exactly how to claim every dollar.
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
            Compiled from Florida insurance regulations, OIR guidelines, and real premium recalculation case studies from South Florida homeowners.
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
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Insurance Savings Blueprint</p>
                    <p className="text-sm text-muted-foreground">10 Pages • PDF • 1.0MB</p>
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
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">What You'll Learn</h2>
              <p className="text-muted-foreground leading-relaxed">
                A step-by-step guide to maximizing your insurance discounts — from knowing which windows qualify to requesting a premium recalculation.
              </p>
              
              <div className="space-y-3">
                {[
                  "Which Windows Actually Qualify for Discounts",
                  "NOA Documentation Requirements Explained",
                  "How to Request a Premium Recalculation",
                  "Stacking Multiple Discount Programs",
                  "What to Do If Your Insurer Refuses"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-foreground italic">
                  Most homeowners recover the cost of this guide's advice in 1-2 years of savings.
                </p>
              </div>

              {/* Semantic ProTip linking to related tool */}
              <ProTipBox
                title="Check if you qualify for all discounts"
                description="The Risk Diagnostic evaluates your home against Florida's wind mitigation credit requirements."
                linkTo="/risk-diagnostic"
                linkText="Run the Risk Diagnostic now"
                variant="success"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — THE GATE (PRIMARY CONVERSION) */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Get the Insurance Savings Blueprint</h2>
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
                {isSubmitting ? 'Sending...' : 'Send Me the Blueprint'}
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
                <CheckCircle2 className="w-3.5 h-3.5" /> Florida Specific
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHAT HAPPENS NEXT */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            Your 3-Step Insurance Savings Plan
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                <BadgeCheck className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">1. Gather Your Docs</h3>
              <p className="text-sm text-muted-foreground">
                Collect your NOA certificates and window installation records.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">2. Request Inspection</h3>
              <p className="text-sm text-muted-foreground">
                Schedule a wind mitigation inspection (usually $75-150).
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">3. Submit for Discount</h3>
              <p className="text-sm text-muted-foreground">
                Send the inspection report to your insurer and request recalculation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CROSS-TOOL BRIDGES */}
      <RelatedToolsGrid
        title={frameControl.title}
        description={frameControl.description}
        tools={smartTools}
        className="bg-muted/30"
      />

      {/* Reviewed By Badge */}
      <section className="py-12 bg-background border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReviewedByBadge />
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

      {/* Exit Intent Modal for lead capture */}
      <ExitIntentModal
        sourceTool="insurance-savings-guide"
        hasConverted={isSubmitting}
        resultSummary="Insurance Savings Blueprint"
      />
    </div>
  );
};

export default InsuranceSavingsGuide;
