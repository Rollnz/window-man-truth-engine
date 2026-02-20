import { DollarSign, TrendingUp, Calculator, BarChart3, FileCheck, Zap, Clock, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PILLARS } from "@/config/pillarMapping";
import { ROUTES } from "@/config/navigation";
import { ReviewedByBadge, ExitIntentModal } from "@/components/authority";
import { getReviewBoardSchema } from "@/config/expertIdentity";
import { generatePillarSchemaGraph, generateFAQSchema } from "@/lib/seoSchemas/index";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import {
  PillarHeroSection,
  PillarStatBar,
  PillarContentBlock,
  PillarCalloutCard,
  PillarGuideCards,
  PillarCTASection,
} from "@/components/pillar";

const pillar = PILLARS['window-cost-truth'];

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

const stats = [
  { value: "$1,200+/yr", label: "Energy waste with budget windows", icon: Zap },
  { value: "40-60%", label: "Hidden cost gap over 10 years", icon: TrendingUp },
  { value: "25-30yr", label: "Premium window lifespan", icon: Clock },
];

const contentSections = [
  {
    heading: "The Hidden Economics of Window Replacement",
    paragraphs: [
      "Most Florida homeowners focus on the sticker price when shopping for impact windows. But the upfront cost is often less than half the total investment. Understanding the true 10-year cost requires examining energy efficiency, insurance savings, maintenance, and replacement cycles.",
      "Budget windows typically use thinner glass, inferior frames, and lower-quality seals. While they meet minimum code requirements, they fail faster, leak more energy, and may not qualify for the insurance discounts that premium windows command.",
    ],
    bullets: [
      "Higher monthly energy bills (<strong>20-40% more AC usage</strong>)",
      "Earlier replacement needs (<strong>10-15 year lifespan vs 25-30 years</strong>)",
      "Missed insurance discounts (<strong>$500-2,000+ annually</strong>)",
      "Lower resale value contribution",
    ],
  },
  {
    heading: "The Florida-Specific Cost Equation",
    paragraphs: [
      "Living in Florida adds unique cost factors that mainland calculators miss:",
    ],
    bullets: [
      "<strong>Hurricane insurance discounts:</strong> Impact windows can reduce premiums by 15-45%",
      "<strong>Cooling costs:</strong> Low-E coatings reduce solar heat gain by up to 70%",
      "<strong>Code requirements:</strong> Miami-Dade rated windows are required in high-velocity hurricane zones",
      "<strong>Salt air degradation:</strong> Coastal installations need corrosion-resistant materials",
    ],
  },
  {
    heading: "What the Quote Doesn't Tell You",
    paragraphs: [
      "Most window quotes are intentionally incomplete. Common exclusions that add thousands to your final bill:",
    ],
    bullets: [
      "Permit fees and inspections ($200-800)",
      "Structural repairs required for proper installation",
      "Interior trim and finishing work",
      "Disposal of old windows and debris",
      "Hurricane shutters or additional protection if code requires it",
    ],
  },
];

const guides = [
  {
    title: "Insurance Savings Guide",
    description: "Learn how to maximize your insurance discounts with the right window certifications.",
    icon: FileCheck,
    to: ROUTES.INSURANCE_SAVINGS_GUIDE,
  },
  {
    title: "Fair Price Quiz",
    description: "Understand what you should actually pay based on your specific window needs.",
    icon: TrendingUp,
    to: ROUTES.FAIR_PRICE_QUIZ,
    linkLabel: "Take the Quiz",
  },
];

const WindowCostTruth = () => {
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
        <PillarHeroSection
          icon={DollarSign}
          title={pillar.h1}
          description={pillar.description}
          ctas={[
            { label: "Calculate Your True Cost", to: ROUTES.COST_CALCULATOR, icon: Calculator },
            { label: "Compare Window Tiers", to: ROUTES.COMPARISON, icon: BarChart3 },
          ]}
        />

        <PillarStatBar stats={stats} />

        <PillarContentBlock sections={contentSections} />

        <PillarCalloutCard text="Budget windows cost 2-3x more over a decade when you factor in energy waste, early replacement, and missed insurance discounts." />

        <PillarGuideCards guides={guides} />

        {/* FAQ Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <AnimateOnScroll duration={600}>
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-8">
                  Frequently Asked Questions
                </h2>
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
            </AnimateOnScroll>
          </div>
        </section>

        {/* Reviewed By Badge */}
        <section className="py-12 md:py-16 bg-card/30">
          <div className="container px-4">
            <AnimateOnScroll duration={600}>
              <div className="max-w-4xl mx-auto">
                <ReviewedByBadge />
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        <PillarCTASection
          heading={pillar.softCTA.text}
          description="Get a personalized cost analysis based on your home, location, and window needs."
          buttonLabel="Run Cost Calculator"
          buttonIcon={Calculator}
          to={pillar.softCTA.link}
          microcopy="Free · No login required · Results in 60 seconds"
        />
      </main>

      <ExitIntentModal
        sourceTool="window-cost-truth"
        hasConverted={false}
        resultSummary="Understanding the true 10-year cost of impact windows in Florida"
      />
    </div>
  );
};

export default WindowCostTruth;
