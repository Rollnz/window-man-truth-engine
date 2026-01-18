import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ShieldCheck, 
  Sparkles, 
  Target, 
  FlaskConical, 
  Award, 
  Scale,
  CheckCircle,
  Building,
  FileText,
  Users
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/button";
import { ConversionBar } from "@/components/conversion/ConversionBar";
import { CommunityImpact } from "@/components/authority/CommunityImpact";
import { ROUTES } from "@/config/navigation";
import { getAboutPageSchemas, getBreadcrumbSchema } from "@/lib/seoSchemas/index";
import { REVIEW_BOARD } from "@/config/expertIdentity";

const About = () => {
  const { hash } = useLocation();

  // Auto-scroll to section if hash is present
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="About Window Man - Our Methodology & Mission"
        description="Built to protect Florida homeowners from storm risk and contractor games. Learn how our AI tools use Florida-specific data and expert verification to deliver accurate results."
        canonicalUrl="https://itswindowman.com/about"
        jsonLd={[...getAboutPageSchemas(), getBreadcrumbSchema('about')]}
      />
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="container px-4 py-12 space-y-6">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold text-primary">About Its Window Man</p>
            <h1 className="text-3xl sm:text-4xl font-bold">
              Built to protect Florida homeowners from storm risk and contractor games.
            </h1>
            <p className="text-muted-foreground text-lg">
              We combine AI tools, vetted estimators, and a homeowner-first playbook so you can make window decisions with confidence. Every tool routes back to a human who can confirm pricing and book an inspection if you want it.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border p-4 space-y-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Safety First</h2>
              <p className="text-sm text-muted-foreground">Hurricane-grade recommendations plus insurance-ready documentation.</p>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">AI + Human Review</h2>
              <p className="text-sm text-muted-foreground">Scanners surface red flags, then our specialists verify before you decide.</p>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Lead With Value</h2>
              <p className="text-sm text-muted-foreground">We give away the playbooks first. If you like them, book an inspection.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={ROUTES.FREE_ESTIMATE}>Book an Inspection</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={ROUTES.SPEC_CHECKLIST_GUIDE}>Download Spec Checklist</Link>
            </Button>
          </div>
        </section>

        {/* Methodology Section */}
        <section id="methodology" className="py-16 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Our Methodology</h2>
                  <p className="text-muted-foreground">How we generate accurate, trustworthy results</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border space-y-4">
                  <Building className="w-8 h-8 text-primary" />
                  <h3 className="font-semibold text-lg">Florida-Specific Data Sources</h3>
                  <p className="text-muted-foreground text-sm">
                    Our tools are calibrated exclusively for Florida's unique requirements. We incorporate 
                    Miami-Dade County building codes, Florida Building Code High-Velocity Hurricane Zone 
                    (HVHZ) standards, and Florida Power & Light energy rate data.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Miami-Dade County code requirements & NOA database</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Florida Power & Light (FPL) residential energy rates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Verified Florida contractor market averages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>HVHZ compliance requirements</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border space-y-4">
                  <FileText className="w-8 h-8 text-primary" />
                  <h3 className="font-semibold text-lg">Industry Quote Verification</h3>
                  <p className="text-muted-foreground text-sm">
                    We analyze real quotes from Florida contractors to establish accurate pricing benchmarks. 
                    Our AI Scanner cross-references your quote against thousands of verified data points to 
                    identify red flags, bloated pricing, and missing specifications.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Real contractor quote database</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Per-window and per-project cost models</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Installation complexity factors</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-6 rounded-xl bg-primary/5 border border-primary/20">
                <h3 className="font-semibold text-lg mb-3">Calculation Transparency</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Every result our tools generate can be traced back to verifiable data sources. Our Cost Calculator 
                  uses current material costs from manufacturer pricing sheets, labor rates from Florida contractor 
                  surveys, and regional adjustment factors. Our Risk Diagnostic weights each factor based on 
                  insurance industry data and Florida-specific claim statistics.
                </p>
                <Link 
                  to={ROUTES.PROOF} 
                  className="text-primary hover:underline text-sm font-medium"
                >
                  View verified case studies →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Review Board Section */}
        <section id="review-board" className="py-16">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{REVIEW_BOARD.name}</h2>
                  <p className="text-muted-foreground">{REVIEW_BOARD.jobTitle}</p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                <p className="text-muted-foreground mb-6">
                  {REVIEW_BOARD.description} All content on this site, including tool results, 
                  educational guides, and case studies, undergoes expert review before publication.
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {REVIEW_BOARD.credentials.map((credential, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{credential}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Areas of Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_BOARD.knowsAbout.map((topic, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section id="mission" className="py-16 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Our Mission: Transparency</h2>
                  <p className="text-muted-foreground">Why we built the Window Truth Engine</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-muted-foreground">
                  For too long, Florida homeowners have faced a window replacement market stacked against them. 
                  High-pressure sales tactics, inflated quotes, and a lack of transparent pricing have left 
                  homeowners confused, frustrated, and often overpaying by thousands of dollars.
                </p>

                <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
                  <h3 className="font-semibold text-lg mb-3 text-destructive">The Problem We're Solving</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 text-destructive font-bold text-xs">1</span>
                      <span><strong className="text-foreground">Price Gouging:</strong> Some contractors charge 2-3x fair market rates, knowing homeowners can't easily compare.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 text-destructive font-bold text-xs">2</span>
                      <span><strong className="text-foreground">Sales Pressure:</strong> "Today only" discounts and scare tactics push homeowners into hasty decisions.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 text-destructive font-bold text-xs">3</span>
                      <span><strong className="text-foreground">Hidden Specifications:</strong> Critical details about impact ratings, warranties, and installation are often buried or omitted.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                  <h3 className="font-semibold text-lg mb-3 text-primary">Our Solution</h3>
                  <p className="text-muted-foreground mb-4">
                    The Window Truth Engine gives every Florida homeowner free access to the same data, tools, 
                    and playbooks that industry insiders use. We believe transparency is the antidote to 
                    exploitation—when you know what a fair price looks like, you can't be taken advantage of.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link to={ROUTES.TOOLS}>
                      <Button size="sm">Explore Free Tools</Button>
                    </Link>
                    <Link to={ROUTES.PROOF}>
                      <Button size="sm" variant="outline">View Case Studies</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Impact */}
        <CommunityImpact />

        {/* CTA Section */}
        <section className="container px-4 pb-16">
          <ConversionBar
            headline="Need a human sanity check?"
            subheadline="Tap through to your free estimate and we'll pair you with a vetted impact window specialist."
          />
        </section>
      </main>
    </div>
  );
};

export default About;
