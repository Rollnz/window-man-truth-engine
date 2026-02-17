import React, { useState } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';
import {
  Target,
  Download,
  Smartphone,
  Clock,
  FileText,
  AlertTriangle,
  Eye,
  CheckCircle2,
  ArrowRight,
  ScanSearch,
  Lock,
  ThumbsDown,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { ConversionBar } from '@/components/conversion/ConversionBar';
import { Navbar } from '@/components/home/Navbar';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';
import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { useSessionData } from '@/hooks/useSessionData';
import { ROUTES } from '@/config/navigation';
import { useNavigate } from 'react-router-dom';
import { getGuidePageSchemas, getBreadcrumbSchema } from '@/lib/seoSchemas/index';
import { ProTipBox } from '@/components/seo';
import { ReviewedByBadge, ExitIntentModal } from '@/components/authority';
import { SalesTacticsGuideModal } from '@/components/conversion/SalesTacticsGuideModal';

const SalesTacticsGuide = () => {
  usePageTracking('sales-tactics-guide');
  const navigate = useNavigate();
  const { sessionData } = useSessionData();
  const frameControl = getFrameControl('sales-tactics-guide');
  const smartTools = getSmartRelatedTools('sales-tactics-guide', sessionData.toolsCompleted);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="11 Sales Tactics Window Contractors Use"
        description="Learn to recognize the psychological manipulation tactics used in window sales presentations. This guide exposes the scripts contractors use so you can protect yourself."
        canonicalUrl="https://itswindowman.com/sales-tactics-guide"
        jsonLd={[...getGuidePageSchemas('sales-tactics-guide'), getBreadcrumbSchema('sales-tactics-guide')]}
      />
      <Navbar />

      {/* SECTION 1 — HERO */}
      <div className="pt-14">
      <section className="relative bg-gradient-to-br from-destructive/5 via-background to-primary/10 py-16 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Column */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground uppercase tracking-wider">
                <Target className="w-4 h-4 text-destructive" />
                <span>Industry Secrets Exposed • 18 Pages</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                The 11 Sales Tactics Window Contractors Use on Every Homeowner
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Once you see these patterns, you'll never unsee them. This guide decodes the psychology behind window sales presentations — so you can recognize manipulation before you sign.
              </p>

              <div className="space-y-4">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Expose the Tactics
                  <Download className="w-4 h-4" />
                </Button>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> 5 min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-4 h-4" /> Mobile friendly
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> See the playbook
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Already got a quote?</p>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => navigate(ROUTES.QUOTE_SCANNER)}
                >
                  Check if these tactics were used <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image Column */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 bg-destructive/10 rounded-full blur-3xl scale-75" />
              
              <div className="relative">
                <div className="relative bg-card rounded-xl shadow-2xl p-2 border border-border">
                  <img
                    src="/images/sales-tactics-brain.webp"
                    alt="Contractor sales tactics brain map showing price inflation, fear-based upselling, and psychological pressure points"
                    className="w-64 sm:w-80 aspect-[4/3] object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                    width={640}
                    height={480}
                  />
                  
                  <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Contractor Playbook
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-lg px-4 py-3 shadow-lg">
                  <p className="text-xs text-muted-foreground">Includes</p>
                  <p className="text-sm font-semibold text-foreground">11 Named Tactics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Keep the estimate path visible for readers who are ready to act */}
        <ConversionBar
          headline="Spot the tactic, then book a zero-pressure inspection."
          subheadline="Share your address and goal—we'll pair you with a vetted estimator who won't play games."
        />
      </div>

      {/* SECTION 2 — IMMEDIATE VALIDATION */}
      <section className="py-16 sm:py-24 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
            They're Not "Just Being Salespeople"<br />They're Following a Script.
          </h2>
          
          <div className="text-left space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Window contractors don't wing it. The biggest companies train their reps using proven psychological frameworks designed to close deals on the first visit. These tactics include:
            </p>
            
            <div className="space-y-3">
              {[
                "The 'Manager Approval' Theatre — fake calls to create urgency",
                "Price Anchoring — starting high to make discounts feel huge",
                "The Fake Competitor Quote — inventing prices you can't verify",
                "Emotional Triggering — using fear of storms, break-ins, or regret"
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
              "These aren't tricks. They're systems. And they work because you don't know they're happening."
            </blockquote>

            <p className="text-foreground font-medium">
              This guide names all 11 tactics — so you can call them out.
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
            Documented from sales training materials, recorded presentations, and insider interviews with former window company sales managers.
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
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">11 Sales Tactics Exposed</p>
                    <p className="text-sm text-muted-foreground">18 Pages • PDF • 1.8MB</p>
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
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">All 11 Tactics, Named & Explained</h2>
              <p className="text-muted-foreground leading-relaxed">
                Each tactic gets its own page with: how it works, what they say, why it works psychologically, and exactly how to neutralize it.
              </p>
              
              <div className="space-y-3">
                {[
                  "The 'Manager Approval' Theatre",
                  "Price Anchoring & The Discount Illusion",
                  "Artificial Urgency Manufacturing",
                  "The Fake Competitor Quote Game",
                  "Emotional Fear Triggering"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground pl-8">+ 6 more tactics inside...</p>
              </div>
              
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-foreground italic">
                  Once you read this, you'll spot these tactics everywhere — not just in window sales.
                </p>
              </div>

              {/* Semantic ProTip linking to related tool */}
              <ProTipBox
                title="Ready to practice resisting these tactics?"
                description="Our Roleplay Simulator lets you practice saying no to high-pressure sales in a safe environment."
                linkTo="/roleplay"
                linkText="Practice resisting these tactics"
                variant="default"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — THE GATE (PRIMARY CONVERSION) */}
      <section 
        className="py-16 sm:py-24"
        style={{ 
          background: 'linear-gradient(135deg, #d2dfed 0%, #c8d7eb 19%, #a6c0e3 36%, #a6c0e3 36%, #c8d7eb 51%, #bed0ea 51%, #c8d7eb 51%, #afc7e8 62%, #bad0ef 69%, #99b5db 88%, #799bc8 100%)' 
        }}
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Get the Sales Tactics Guide</h2>
            <p className="text-slate-700">Free PDF • Instant Access</p>
          </div>

          <div 
            className="rounded-xl p-6 sm:p-8 ring-1 ring-white/30"
            style={{ 
              background: 'radial-gradient(ellipse at center, #e2bbb7 0%, #f0d5d2 25%, #ffffff 60%, #ffffff 100%)',
              boxShadow: '0 35px 60px -15px rgba(0, 0, 0, 0.35), 0 20px 25px -10px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">11 Sales Tactics You Need to Know</h3>
                <p className="text-sm text-slate-600">Learn to recognize manipulation before you sign.</p>
              </div>

              <Button 
                variant="cta" 
                size="lg" 
                className="w-full gap-2"
                onClick={() => setIsModalOpen(true)}
              >
                Unlock the Guide
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-slate-200 text-xs text-slate-700">
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
        </div>
      </section>

      {/* SECTION 5 — WHAT HAPPENS NEXT */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            After You Read It, You Can:
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                <ThumbsDown className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">1. Call Out the Tactic</h3>
              <p className="text-sm text-muted-foreground">
                Name it. "That sounds like the Manager Approval tactic." Watch them pivot.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                <Timer className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">2. Buy Yourself Time</h3>
              <p className="text-sm text-muted-foreground">
                Use the scripts inside to slow down the conversation without confrontation.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                <ScanSearch className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">3. Verify Their Quote</h3>
              <p className="text-sm text-muted-foreground">
                Upload it to our Quote Scanner to see if tactics made it onto paper.
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

      </div>

      {/* Exit Intent Modal for lead capture */}
      <ExitIntentModal
        sourceTool="sales-tactics-guide"
        hasConverted={isModalOpen}
        resultSummary="11 Sales Tactics Guide"
      />

      {/* Sales Tactics Guide Modal */}
      <SalesTacticsGuideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default SalesTacticsGuide;
