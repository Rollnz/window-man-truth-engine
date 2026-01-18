import { Link } from "react-router-dom";
import { DollarSign, TrendingUp, Calculator, BarChart3, FileCheck, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PILLARS } from "@/config/pillarMapping";
import { ROUTES } from "@/config/navigation";
import { ReviewedByBadge, ExitIntentModal } from "@/components/authority";
import { getReviewBoardSchema } from "@/config/expertIdentity";
import { generatePillarSchemaGraph, generateFAQSchema } from "@/lib/seoSchemas";

const pillar = PILLARS['window-cost-truth'];

const WindowCostTruth = () => {
  const faqs = [
    {
      question: "Why do cheap windows often cost more in the long run?",
      answer: "Lower-quality windows typically have shorter lifespans (10-15 years vs 25-30 years for premium), higher energy loss (increasing AC bills by 20-40%), and may not qualify for insurance discounts. When you factor in replacement costs, energy waste, and missed savings, budget windows often cost 2-3x more over a decade."
    },
    {
      question: "What hidden costs should I watch for in window quotes?",
      answer: "Common hidden costs include: permit fees ($200-800), structural repairs discovered during installation, trim and finishing work, debris removal, and code-required upgrades. Always ask for an itemized quote and clarify what's included. Use our AI Quote Scanner to identify missing line items."
    },
    {
      question: "How do I calculate the true 10-year cost of impact windows?",
      answer: "True cost = Purchase price + Installation + Energy costs over 10 years - Insurance savings - Energy savings - Potential resale value increase. Our Cost Calculator runs this analysis automatically using Florida-specific data."
    },
  ];

  // Use centralized pillar schema generator for topical cluster hierarchy
  const pillarSchemaGraph = generatePillarSchemaGraph('window-cost-truth');
  const faqSchema = generateFAQSchema(faqs);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Window Cost Truth: What Impact Windows Really Cost Over 10 Years in Florida"
        description={pillar.description}
        canonicalUrl="https://itswindowman.com/window-cost-truth"
        jsonLd={[pillarSchemaGraph, faqSchema, getReviewBoardSchema()]}
      />
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="container px-4 py-12 md:py-16">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <DollarSign className="h-5 w-5" />
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
                <Link to={ROUTES.COST_CALCULATOR}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Your True Cost
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={ROUTES.COMPARISON}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Compare Window Tiers
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container px-4 py-8">
          <div className="max-w-4xl space-y-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2>The Hidden Economics of Window Replacement</h2>
              <p>
                Most Florida homeowners focus on the sticker price when shopping for impact windows. 
                But the upfront cost is often less than half the total investment. Understanding the 
                true 10-year cost requires examining energy efficiency, insurance savings, maintenance, 
                and replacement cycles.
              </p>
              
              <h3>Why "Cheap" Windows Are Expensive</h3>
              <p>
                Budget windows typically use thinner glass, inferior frames, and lower-quality seals. 
                While they meet minimum code requirements, they fail faster, leak more energy, and 
                may not qualify for the insurance discounts that premium windows command.
              </p>
              <p>
                Our data shows that homeowners who choose the lowest-price option often spend 40-60% 
                more over 10 years when factoring in:
              </p>
              <ul>
                <li>Higher monthly energy bills (20-40% more AC usage)</li>
                <li>Earlier replacement needs (10-15 year lifespan vs 25-30 years)</li>
                <li>Missed insurance discounts ($500-2,000+ annually)</li>
                <li>Lower resale value contribution</li>
              </ul>

              <h3>The Florida-Specific Cost Equation</h3>
              <p>
                Living in Florida adds unique cost factors that mainland calculators miss:
              </p>
              <ul>
                <li><strong>Hurricane insurance discounts:</strong> Impact windows can reduce premiums by 15-45%</li>
                <li><strong>Cooling costs:</strong> Low-E coatings reduce solar heat gain by up to 70%</li>
                <li><strong>Code requirements:</strong> Miami-Dade rated windows are required in high-velocity hurricane zones</li>
                <li><strong>Salt air degradation:</strong> Coastal installations need corrosion-resistant materials</li>
              </ul>

              <h3>What the Quote Doesn't Tell You</h3>
              <p>
                Most window quotes are intentionally incomplete. Common exclusions that add thousands to your final bill:
              </p>
              <ul>
                <li>Permit fees and inspections ($200-800)</li>
                <li>Structural repairs required for proper installation</li>
                <li>Interior trim and finishing work</li>
                <li>Disposal of old windows and debris</li>
                <li>Hurricane shutters or additional protection if code requires it</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Guides Section - Pillars link DOWN to guides */}
        <section className="container px-4 py-12 border-t border-border">
          <h2 className="text-2xl font-bold mb-6">Related Guides</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Insurance Savings Guide
                </CardTitle>
                <CardDescription>
                  Learn how to maximize your insurance discounts with the right window certifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.INSURANCE_SAVINGS_GUIDE}>
                    Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Fair Price Quiz
                </CardTitle>
                <CardDescription>
                  Understand what you should actually pay based on your specific window needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.FAIR_PRICE_QUIZ}>
                    Take the Quiz <ArrowRight className="ml-2 h-4 w-4" />
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
                  <AccordionContent className="text-muted-foreground">
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
              Get a personalized cost analysis based on your home, location, and window needs.
            </p>
            <Button asChild size="lg">
              <Link to={pillar.softCTA.link}>
                <Calculator className="mr-2 h-4 w-4" />
                Run Cost Calculator
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />

      <ExitIntentModal
        sourceTool="window-cost-truth"
        hasConverted={false}
        resultSummary="Understanding the true 10-year cost of impact windows in Florida"
      />
    </div>
  );
};

export default WindowCostTruth;
