import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ShieldCheck, Download, Smartphone, Clock, FileText, AlertTriangle, PauseCircle, CheckCircle2, ArrowRight, ScanSearch, Calculator } from 'lucide-react';
import { getResourceById } from '@/data/intelData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SEO } from '@/components/SEO';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { Navbar } from '@/components/home/Navbar';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';
import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { useSessionData } from '@/hooks/useSessionData';
import { ROUTES } from '@/config/navigation';
import { getToolPageSchemas, getBreadcrumbSchema } from '@/lib/seoSchemas/index';
import { ProTipBox } from '@/components/seo';
import { ReviewedByBadge, ExitIntentModal } from '@/components/authority';
import { KitchenTableGuideModal } from '@/components/conversion/KitchenTableGuideModal';
const KitchenTableGuide = () => {
  usePageTracking('kitchen-table-guide');
  const navigate = useNavigate();
  const {
    sessionData
  } = useSessionData();
  const frameControl = getFrameControl('kitchen-table-guide');
  const smartTools = getSmartRelatedTools('kitchen-table-guide', sessionData.toolsCompleted);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Single source of truth for book image
  const defenseKitResource = getResourceById('defense-kit');
  const bookImageUrl = defenseKitResource?.bookImageUrl || '/images/defense-kit-book.webp';
  const {
    values,
    getFieldProps,
    hasError,
    getError,
    validateAll
  } = useFormValidation({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    schemas: {
      firstName: commonSchemas.firstName,
      email: commonSchemas.email
    }
  });
  const {
    submit,
    isSubmitting
  } = useLeadFormSubmit({
    sourceTool: 'kitchen-table-guide',
    formLocation: 'main',
    leadScore: 40,
    redirectTo: ROUTES.QUOTE_SCANNER,
    successTitle: 'Guide Unlocked!',
    successDescription: 'Check your inbox - the guide is on its way.'
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    await submit({
      email: values.email,
      name: `${values.firstName}${values.lastName ? ' ' + values.lastName : ''}`,
      phone: values.phone || undefined
    });
  };
  return <div className="min-h-screen bg-background text-foreground">
      <SEO title="Kitchen Table Defense Guide" description="A 12-page guide teaching you how to handle in-home window sales presentations. Learn the scripts and strategies to slow down high-pressure tactics." canonicalUrl="https://itswindowman.com/kitchen-table-guide" jsonLd={[...getToolPageSchemas('kitchen-table-guide'), getBreadcrumbSchema('kitchen-table-guide')]} />
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
                <Button size="lg" className="w-full sm:w-auto gap-2" onClick={() => setIsModalOpen(true)}>
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
                <Button variant="outline" className="gap-2" onClick={() => navigate(ROUTES.QUOTE_SCANNER)}>
                  Scan it for pressure tactics <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image Column */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-75" />
              
              <div className="relative">
                <div className="relative bg-card rounded-xl shadow-2xl p-2 border border-border">
                  <img src={bookImageUrl} alt="Kitchen Table Defense Kit Preview" className="w-64 sm:w-80 h-auto rounded-lg" />
                  
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
              {["Anchor you to a large number early", "Create artificial urgency", "Control which comparisons feel 'reasonable'", "Frame hesitation as a mistake"].map((item, i) => <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </div>)}
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
              <div className="relative">
                <img src={bookImageUrl} alt="The Kitchen Table Defense Kit" className="w-64 sm:w-72 h-auto rounded-lg shadow-2xl" />
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">What This Guide Actually Is</h2>
              <p className="text-muted-foreground leading-relaxed">
                This is not a long ebook. It's a 12-page, mobile-friendly field guide designed to be read in under 3 minutes — even while the salesperson is measuring your windows.
              </p>
              
              <div className="space-y-3">
                {["A one-page Red Flag Checklist", "The exact phrases used to manufacture urgency", "A simple pause script you can use without confrontation", 'A final "Do Not Sign If…" page'].map((feature, i) => <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>)}
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-foreground italic">
                  This guide doesn't tell you what to buy. It teaches you how to listen.
                </p>
              </div>

              {/* Semantic ProTip linking to related tool */}
              <ProTipBox title="Want to see these tactics in action?" description="The 11 Sales Tactics Guide names and explains the psychological scripts contractors use on every homeowner." linkTo="/sales-tactics-guide" linkText="See the 11 tactics salespeople use" variant="warning" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — THE GATE (PRIMARY CONVERSION) */}
      <section 
        className="py-16 text-white text-xl text-center sm:py-0"
        style={{ background: 'linear-gradient(135deg, #d0e4f7 0%, #73b1e7 16%, #0a77d5 34%, #539fe1 61%, #539fe1 61%, #87bcea 100%)' }}
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-[31px] my-0">
        <div className="max-w-[500px] mx-auto px-4">
          <div 
            className="rounded-xl p-6 sm:p-8 ring-1 ring-white/30 transition-all duration-300 hover:-translate-y-1"
            style={{ 
              background: 'radial-gradient(ellipse at center, #e2bbb7 0%, #f0d5d2 25%, #ffffff 60%, #ffffff 100%)',
              boxShadow: '0 35px 60px -15px rgba(0, 0, 0, 0.35), 0 20px 25px -10px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            {/* Form Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Kitchen Table Defense Kit</h2>
              <p className="text-sm text-slate-600 mt-1">Free PDF • Instant Access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: First Name | Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input 
                    id="firstName" 
                    {...getFieldProps('firstName')} 
                    placeholder="First name" 
                    className={`bg-white border border-black focus:border-primary focus:outline-none transition-all duration-300 ${hasError('firstName') ? 'border-destructive' : ''}`}
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(57, 147, 221, 0.25), 0 0 20px rgba(57, 147, 221, 0.15)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    disabled={isSubmitting} 
                    autoComplete="given-name" 
                  />
                  {hasError('firstName') && <p className="text-xs text-destructive mt-1">{getError('firstName')}</p>}
                </div>
                <div>
                  <Input 
                    id="lastName" 
                    {...getFieldProps('lastName')} 
                    placeholder="Last name" 
                    className="bg-white border border-black focus:border-primary focus:outline-none transition-all duration-300"
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(57, 147, 221, 0.25), 0 0 20px rgba(57, 147, 221, 0.15)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    disabled={isSubmitting} 
                    autoComplete="family-name" 
                  />
                </div>
              </div>
              
              {/* Row 2: Email | Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input 
                    id="email" 
                    type="email" 
                    {...getFieldProps('email')} 
                    placeholder="Email address" 
                    className={`bg-white border border-black focus:border-primary focus:outline-none transition-all duration-300 ${hasError('email') ? 'border-destructive' : ''}`}
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(57, 147, 221, 0.25), 0 0 20px rgba(57, 147, 221, 0.15)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    disabled={isSubmitting} 
                    autoComplete="email" 
                  />
                  {hasError('email') && <p className="text-xs text-destructive mt-1">{getError('email')}</p>}
                </div>
                <div>
                  <Input 
                    id="phone" 
                    type="tel" 
                    {...getFieldProps('phone')} 
                    placeholder="Phone" 
                    className="bg-white border border-black placeholder:text-slate-500 focus:border-primary focus:outline-none transition-all duration-300"
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(57, 147, 221, 0.25), 0 0 20px rgba(57, 147, 221, 0.15)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    disabled={isSubmitting} 
                    autoComplete="tel" 
                  />
                </div>
              </div>
              
              <Button type="submit" variant="cta" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Me the Guide'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </Button>
              
              <p className="text-xs text-black text-center">
                We'll also save this to your private Windowman Vault.
              </p>
            </form>

            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-slate-200 text-xs text-black">
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
        </div>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-slate-900 mb-2">Why is this free?</p>
            <p className="text-sm text-slate-700">
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
              <h3 className="font-semibold text-black dark:text-white text-sm">1. Do Nothing Yet</h3>
              <p className="text-sm text-black dark:text-white">
                Pause. Re-read your quote. Let the pressure fade. No option pushes you forward.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-500/10 dark:bg-sky-500/20 rounded-full border border-sky-500/30">
                <ScanSearch className="w-8 h-8 text-sky-500" />
              </div>
              <h3 className="font-semibold text-black dark:text-white text-sm">2. Sanity-Check It</h3>
              <p className="text-sm text-black dark:text-white">
                Upload it to the Quote Scanner and see where pressure or padding may exist.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full border border-emerald-500/30">
                <Calculator className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm text-black dark:text-white">3. Get Clarity on Price</h3>
              <p className="text-sm text-black dark:text-white">
                Use the Cost Calculator to understand a fair range before talking to anyone again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CROSS-TOOL BRIDGES */}
      <RelatedToolsGrid title={frameControl.title} description={frameControl.description} tools={smartTools} className="bg-muted/30" />

      {/* Reviewed By Badge */}
      <section className="py-12 bg-background border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReviewedByBadge />
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
          <Button variant="cta" size="lg" className="gap-2">
            Learn About Professional Measurements <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      </div>

      {/* Exit Intent Modal for lead capture */}
      <ExitIntentModal sourceTool="kitchen-table-guide" hasConverted={isSubmitting} resultSummary="Kitchen Table Defense Guide" />

      {/* Kitchen Table Guide Modal */}
      <KitchenTableGuideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>;
};
export default KitchenTableGuide;