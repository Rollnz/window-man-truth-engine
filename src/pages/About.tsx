import { useEffect, useState } from "react";
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
import { ROUTES } from "@/config/navigation";
import { getAboutPageSchemas, getBreadcrumbSchema } from "@/lib/seoSchemas/index";
import { REVIEW_BOARD } from "@/config/expertIdentity";
import { ConsultationBookingModal } from "@/components/conversion/ConsultationBookingModal";
import { useSessionData } from "@/hooks/useSessionData";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

const heroCards = [
  { icon: ShieldCheck, title: "Safety First", desc: "Hurricane-grade recommendations plus insurance-ready documentation." },
  { icon: Sparkles, title: "AI + Human Review", desc: "Scanners surface red flags, then our specialists verify before you decide." },
  { icon: Target, title: "Lead With Value", desc: "We give away the playbooks first. If you like them, book an inspection." },
];

const About = () => {
  const { hash } = useLocation();
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const { sessionData } = useSessionData();

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
        <section className="relative overflow-hidden bg-[hsl(var(--surface-1))] border-b border-border/30">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/6 rounded-full blur-3xl" />
          </div>
          <div className="container px-4 py-12 space-y-6 relative z-10">
            <div className="max-w-3xl space-y-4">
              <AnimateOnScroll duration={500}>
                <p className="text-sm font-semibold text-primary">About Its Window Man</p>
              </AnimateOnScroll>
              <AnimateOnScroll duration={600} delay={100}>
                <h1 className="display-h1 text-lift text-3xl sm:text-4xl font-bold">
                  Built to protect Florida homeowners from storm risk and contractor games.
                </h1>
              </AnimateOnScroll>
              <AnimateOnScroll duration={600} delay={200}>
                <p className="text-muted-foreground text-lg">
                  We combine AI tools, vetted estimators, and a homeowner-first playbook so you can make window decisions with confidence. Every tool routes back to a human who can confirm pricing and book an inspection if you want it.
                </p>
              </AnimateOnScroll>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {heroCards.map((card, index) => {
                const CardIcon = card.icon;
                return (
                  <AnimateOnScroll key={index} delay={index * 120} duration={600}>
                    <div className="rounded-xl bg-card backdrop-blur-sm border border-border/20 p-4 space-y-2 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                      <CardIcon className="h-5 w-5 text-primary" />
                      <h2 className="font-semibold">{card.title}</h2>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>

            <AnimateOnScroll duration={600} delay={400}>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setShowConsultationModal(true)}>Book an Inspection</Button>
                <Button asChild variant="outline">
                  <Link to={ROUTES.SPEC_CHECKLIST_GUIDE}>Download Spec Checklist</Link>
                </Button>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Methodology Section */}
        <section id="methodology" className="py-16 bg-[hsl(var(--surface-2))]">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <AnimateOnScroll duration={600}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FlaskConical className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Our Methodology</h2>
                    <p className="text-muted-foreground">How we generate accurate, trustworthy results</p>
                  </div>
                </div>
              </AnimateOnScroll>

              <div className="grid md:grid-cols-2 gap-6">
                <AnimateOnScroll duration={700} delay={100}>
                  <div className="p-6 rounded-xl bg-card backdrop-blur-sm border border-border/20 space-y-4 shadow-lg">
                    <Building className="w-8 h-8 text-primary" />
                    <h3 className="font-semibold text-lg">Florida-Specific Data Sources</h3>
                    <p className="text-muted-foreground text-sm">
                      Our tools are calibrated exclusively for Florida's unique requirements. We incorporate 
                      Miami-Dade County building codes, Florida Building Code High-Velocity Hurricane Zone 
                      (HVHZ) standards, and Florida Power & Light energy rate data.
                    </p>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Miami-Dade County code requirements & NOA database",
                        "Florida Power & Light (FPL) residential energy rates",
                        "Verified Florida contractor market averages",
                        "HVHZ compliance requirements",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimateOnScroll>

                <AnimateOnScroll duration={700} delay={220}>
                  <div className="p-6 rounded-xl bg-card backdrop-blur-sm border border-border/20 space-y-4 shadow-lg">
                    <FileText className="w-8 h-8 text-primary" />
                    <h3 className="font-semibold text-lg">Industry Quote Verification</h3>
                    <p className="text-muted-foreground text-sm">
                      We analyze real quotes from Florida contractors to establish accurate pricing benchmarks. 
                      Our AI Scanner cross-references your quote against thousands of verified data points to 
                      identify red flags, bloated pricing, and missing specifications.
                    </p>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Real contractor quote database",
                        "Per-window and per-project cost models",
                        "Installation complexity factors",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimateOnScroll>
              </div>

              <AnimateOnScroll duration={700} delay={300}>
                <div className="mt-6 p-6 rounded-xl bg-primary/5 border border-primary/20 shadow-lg backdrop-blur-sm">
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
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* Review Board Section */}
        <section id="review-board" className="py-16 bg-[hsl(var(--surface-1))]">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <AnimateOnScroll duration={600}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{REVIEW_BOARD.name}</h2>
                    <p className="text-muted-foreground">{REVIEW_BOARD.jobTitle}</p>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll duration={700} delay={100}>
                <div className="p-6 rounded-xl bg-card backdrop-blur-sm border border-border/20 shadow-xl">
                  <p className="text-muted-foreground mb-6">
                    {REVIEW_BOARD.description} All content on this site, including tool results, 
                    educational guides, and case studies, undergoes expert review before publication.
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {REVIEW_BOARD.credentials.map((credential, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 backdrop-blur-sm"
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
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section id="mission" className="py-16 bg-[hsl(var(--surface-2))]">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <AnimateOnScroll duration={600}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Scale className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Our Mission: Transparency</h2>
                    <p className="text-muted-foreground">Why we built the Window Truth Engine</p>
                  </div>
                </div>
              </AnimateOnScroll>

              <div className="space-y-6">
                <AnimateOnScroll duration={600} delay={100}>
                  <p className="text-muted-foreground">
                    For too long, Florida homeowners have faced a window replacement market stacked against them. 
                    High-pressure sales tactics, inflated quotes, and a lack of transparent pricing have left 
                    homeowners confused, frustrated, and often overpaying by thousands of dollars.
                  </p>
                </AnimateOnScroll>

                <AnimateOnScroll duration={700} delay={200}>
                  <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20 shadow-lg backdrop-blur-sm">
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
                </AnimateOnScroll>

                <AnimateOnScroll duration={700} delay={300}>
                  <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 shadow-lg backdrop-blur-sm">
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
                </AnimateOnScroll>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ConsultationBookingModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        onSuccess={() => setShowConsultationModal(false)}
        sessionData={sessionData}
        sourceTool="consultation"
      />
    </div>
  );
};

export default About;
