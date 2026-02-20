import { Eye, Users, ScanSearch, MessageSquare, DollarSign, Shield, Clock } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";

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

const pillar = PILLARS['window-sales-truth'];

const faqs = [
  {
    question: "Are window quotes negotiable?",
    answer: "Absolutely. Most window companies build 30-50% margin into their initial quotes. Common negotiation levers include: seasonal timing (slow season = better deals), cash/financing preferences, competitor quotes as leverage, and asking about available rebates or manufacturer incentives. Our Beat Your Quote tool gives you specific negotiation scripts."
  },
  {
    question: "How do I spot high-pressure sales tactics?",
    answer: "Red flags include: 'Today only' pricing that expires when they leave, refusing to provide written quotes, excessive urgency about storm season, bundling unnecessary upgrades without itemization, and claims that their product is 'exclusive' or 'proprietary.' Our Roleplay Simulator lets you practice responding to these tactics."
  },
  {
    question: "What should I do if a salesperson pressures me to sign immediately?",
    answer: "Never sign under pressure. Florida law gives you a 3-day right to cancel for home solicitation sales over $25. Always request a written quote, take photos of any materials, and use our AI Quote Scanner to analyze the offer before committing."
  },
];

const stats = [
  { value: "30-50%", label: "Built-in margin on initial quotes", icon: DollarSign },
  { value: "3 Days", label: "FL cancellation right", icon: Clock },
  { value: "4+", label: "Common manipulation tactics", icon: Shield },
];

const contentSections = [
  {
    heading: "The Psychology Behind Window Sales",
    paragraphs: [
      "Window companies have perfected the art of in-home sales. Many use psychological techniques designed to create urgency, exploit fear, and close deals before you can think clearly. Understanding these tactics is your first line of defense.",
    ],
    bullets: undefined,
  },
  {
    heading: "The Most Common Manipulation Tactics",
    paragraphs: [
      'The "Manager Call" Discount — The salesperson "calls their manager" to get you a special price that\'s only available right now. In reality, this is theater—the discount was always available, and the call is often fake or pre-arranged.',
      'Fear-Based Urgency — "Hurricane season starts next month—installation crews are booked solid." While timing does matter, legitimate companies don\'t need scare tactics to sell quality products.',
      'The "Apples to Oranges" Comparison — Salespeople often compare their premium product to a competitor\'s budget line, making the price difference seem justified.',
      'Anchoring With a Fake "Original" Price — A quote starts at $40,000, then magically drops to $25,000 with "today only" discounts. The $40,000 was never real.',
    ],
    bullets: undefined,
  },
  {
    heading: "How to Protect Yourself",
    paragraphs: [
      "Follow these rules to stay in control during any sales presentation:",
    ],
    bullets: [
      "<strong>Always get 3+ quotes:</strong> This reveals the real market price",
      "<strong>Request itemized quotes:</strong> Lump sums hide overpricing",
      "<strong>Take 48 hours minimum:</strong> No legitimate deal expires same-day",
      "<strong>Check the NOA numbers:</strong> Verify product certifications independently",
      "<strong>Record the presentation:</strong> Florida is a two-party consent state for calls, but you can take notes",
    ],
  },
  {
    heading: "What Fair Quotes Look Like",
    paragraphs: [
      "A legitimate window quote should include:",
    ],
    bullets: [
      "Itemized pricing for materials, labor, permits, and disposal",
      "Specific product model numbers and NOA certifications",
      "Written warranty terms (not just verbal promises)",
      "Realistic installation timeline",
      "Clear cancellation policy",
    ],
  },
];

const guides = [
  {
    title: "Sales Tactics Guide",
    description: "Deep dive into the 11 most common manipulation techniques and how to counter them.",
    icon: Eye,
    to: ROUTES.SALES_TACTICS_GUIDE,
  },
  {
    title: "Kitchen Table Guide",
    description: "Step-by-step playbook for handling in-home sales presentations confidently.",
    icon: MessageSquare,
    to: ROUTES.KITCHEN_TABLE_GUIDE,
  },
];

const WindowSalesTruth = () => {
  const pillarSchemaGraph = generatePillarSchemaGraph('window-sales-truth');
  const faqSchema = generateFAQSchema(faqs);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Window Sales Truth: How to Spot Manipulation & Negotiate Fair Quotes"
        description={pillar.description}
        canonicalUrl="https://itswindowman.com/window-sales-truth"
        jsonLd={[pillarSchemaGraph, faqSchema, getReviewBoardSchema()]}
      />
      <Navbar />

      <main className="pt-20">
        <PillarHeroSection
          icon={Eye}
          title={pillar.h1}
          description={pillar.description}
          ctas={[
            { label: "Scan Your Quote", to: ROUTES.QUOTE_SCANNER, icon: ScanSearch },
            { label: "Beat Your Quote", to: ROUTES.BEAT_YOUR_QUOTE, icon: Users },
          ]}
        />

        <PillarStatBar stats={stats} />

        <PillarContentBlock sections={contentSections} />

        <PillarCalloutCard text="No legitimate deal expires same-day. If the pressure feels manipulative, it probably is." />

        <PillarGuideCards guides={guides} />

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
          description="Upload your quote and our AI will identify pricing anomalies, missing items, and pressure tactics."
          buttonLabel="Scan Your Quote Now"
          buttonIcon={ScanSearch}
          to={pillar.softCTA.link}
          microcopy="Free · No login required · AI-powered analysis"
        />
      </main>

      <ExitIntentModal
        sourceTool="window-sales-truth"
        hasConverted={false}
        resultSummary="Spotting manipulation tactics and negotiating fair window quotes"
      />
    </div>
  );
};

export default WindowSalesTruth;
