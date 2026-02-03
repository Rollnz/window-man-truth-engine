import { Link } from "react-router-dom";
import { ShieldCheck, AlertTriangle, FileText, Scale, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PILLARS } from "@/config/pillarMapping";
import { ROUTES } from "@/config/navigation";
import { ReviewedByBadge, ExitIntentModal } from "@/components/authority";
import { getReviewBoardSchema } from "@/config/expertIdentity";
import { generatePillarSchemaGraph, generateFAQSchema } from "@/lib/seoSchemas/index";

const pillar = PILLARS['window-risk-and-code'];

const WindowRiskAndCode = () => {
  const faqs = [
    {
      question: "Are impact windows required by Florida building code?",
      answer: "It depends on your location. Homes within the High-Velocity Hurricane Zone (HVHZ), which includes Miami-Dade and Broward counties, must have impact-resistant windows or approved hurricane shutters. Other coastal areas may have different requirements. Our Risk Diagnostic can tell you exactly what your home requires."
    },
    {
      question: "What is the difference between Miami-Dade and standard impact ratings?",
      answer: "Miami-Dade certification (HVHZ approved) is the strictest standard, requiring windows to withstand large missile impacts and extreme wind pressures. Standard impact ratings may not meet HVHZ requirements. Always check for the Miami-Dade NOA (Notice of Acceptance) number for the highest protection."
    },
    {
      question: "How do I know if my current windows meet code?",
      answer: "Check your windows for certification labels (usually on the frame or between glass panes). Look for Miami-Dade NOA numbers, Florida Building Code (FBC) approval, or ASTM E1996 certification. Our Vulnerability Test can help you assess your current protection level and identify gaps."
    },
  ];

  // Use centralized pillar schema generator for topical cluster hierarchy
  const pillarSchemaGraph = generatePillarSchemaGraph('window-risk-and-code');
  const faqSchema = generateFAQSchema(faqs);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Window Risk & Code: Florida Hurricane Protection Requirements Explained"
        description={pillar.description}
        canonicalUrl="https://itswindowman.com/window-risk-and-code"
        jsonLd={[pillarSchemaGraph, faqSchema, getReviewBoardSchema()]}
      />
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="container px-4 py-12 md:py-16">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Truth Pillar</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              {pillar.h1}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {pillar.description}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <Link to={ROUTES.RISK_DIAGNOSTIC}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Run Risk Diagnostic
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={ROUTES.VULNERABILITY_TEST}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Take Vulnerability Test
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container px-4 py-8">
          <div className="max-w-4xl space-y-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2>Understanding Florida's Hurricane Protection Requirements</h2>
              <p>
                Florida has some of the strictest building codes in the nation when it comes to 
                hurricane protection. But navigating these requirements can be confusing, especially 
                with different rules for different regions. This guide breaks down what you actually 
                need to know.
              </p>
              
              <h3>The High-Velocity Hurricane Zone (HVHZ)</h3>
              <p>
                The HVHZ includes Miami-Dade County, Broward County, and parts of Palm Beach County. 
                If your home is in this zone, your windows must meet the strictest standards:
              </p>
              <ul>
                <li><strong>Large missile impact test:</strong> Withstand a 9-pound 2x4 lumber traveling at 50 fps</li>
                <li><strong>Cyclic pressure test:</strong> Endure 9,000 positive and negative pressure cycles</li>
                <li><strong>Wind pressure resistance:</strong> Meet specific design pressures based on building height and location</li>
                <li><strong>Miami-Dade NOA:</strong> Must have a valid Notice of Acceptance number</li>
              </ul>

              <h3>Outside the HVHZ: Florida Building Code Requirements</h3>
              <p>
                Homes outside the HVHZ still need hurricane protection, but requirements vary by 
                wind zone. The Florida Building Code divides the state into wind zones based on 
                3-second gust wind speeds:
              </p>
              <ul>
                <li><strong>110-120 mph zones:</strong> Interior Florida, lower requirements</li>
                <li><strong>130-150 mph zones:</strong> Coastal areas, stricter impact resistance needed</li>
                <li><strong>150+ mph zones:</strong> Keys and exposed coastal areas, near-HVHZ requirements</li>
              </ul>

              <h3>What "Hurricane Ready" Actually Means</h3>
              <p>
                Being code-compliant is the minimum. True hurricane readiness considers:
              </p>
              <ul>
                <li><strong>All openings protected:</strong> Windows, doors, garage doors, skylights</li>
                <li><strong>Consistent protection level:</strong> One weak point can cause catastrophic failure</li>
                <li><strong>Proper installation:</strong> Even the best windows fail if installed incorrectly</li>
                <li><strong>Secondary protection:</strong> Shutters as backup, especially for sliding glass doors</li>
              </ul>

              <h3>Insurance Implications</h3>
              <p>
                Your protection level directly affects your insurance premiums. A wind mitigation 
                inspection documents your home's features and can unlock significant discounts:
              </p>
              <ul>
                <li>Opening protection (impact windows/shutters): 15-45% discount potential</li>
                <li>Roof-to-wall connections: 5-25% discount</li>
                <li>Roof geometry (hip vs gable): Up to 10% discount</li>
                <li>Secondary water resistance: Additional savings available</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Guides Section - Pillars link DOWN to guides */}
        <section className="container px-4 py-12 border-t border-border">
          <h2 className="text-2xl font-bold mb-6">Related Guides</h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Spec Checklist Guide
                </CardTitle>
                <CardDescription>
                  Ensure your windows meet all required specifications before purchase.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.SPEC_CHECKLIST_GUIDE}>
                    Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Claim Survival Kit
                </CardTitle>
                <CardDescription>
                  Document your protection properly for insurance claims.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.CLAIM_SURVIVAL}>
                    Get the Kit <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Defense Guide
                </CardTitle>
                <CardDescription>
                  Learn comprehensive hurricane defense strategies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.DEFENSE}>
                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container px-4 py-12 border-t border-border">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-black">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Reviewed By Badge */}
        <section className="container px-4 py-12 border-t border-border">
          <div className="max-w-4xl">
            <ReviewedByBadge />
          </div>
        </section>

        {/* Soft CTA */}
        <section className="container px-4 py-12 border-t border-border">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold">{pillar.softCTA.text}</h2>
            <p className="text-muted-foreground">
              Get a personalized assessment of your home's hurricane protection and code compliance.
            </p>
            <Button asChild size="lg">
              <Link to={pillar.softCTA.link}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Start Risk Diagnostic
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <ExitIntentModal
        sourceTool="window-risk-and-code"
        hasConverted={false}
        resultSummary="Understanding Florida hurricane protection requirements and building codes"
      />
    </div>
  );
};

export default WindowRiskAndCode;
