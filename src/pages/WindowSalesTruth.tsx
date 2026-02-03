import { Link } from "react-router-dom";
import { Eye, Users, ScanSearch, MessageSquare, ArrowRight } from "lucide-react";
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

const pillar = PILLARS['window-sales-truth'];

const WindowSalesTruth = () => {
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

  // Use centralized pillar schema generator for topical cluster hierarchy
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
        {/* Hero Section */}
        <section className="container px-4 py-12 md:py-16">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Eye className="h-5 w-5" />
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
                <Link to={ROUTES.QUOTE_SCANNER}>
                  <ScanSearch className="mr-2 h-4 w-4" />
                  Scan Your Quote
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={ROUTES.BEAT_YOUR_QUOTE}>
                  <Users className="mr-2 h-4 w-4" />
                  Beat Your Quote
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container px-4 py-8">
          <div className="max-w-4xl space-y-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2>The Psychology Behind Window Sales</h2>
              <p>
                Window companies have perfected the art of in-home sales. Many use psychological 
                techniques designed to create urgency, exploit fear, and close deals before you 
                can think clearly. Understanding these tactics is your first line of defense.
              </p>
              
              <h3>The Most Common Manipulation Tactics</h3>
              
              <h4>1. The "Manager Call" Discount</h4>
              <p>
                The salesperson "calls their manager" to get you a special price that's only 
                available right now. In reality, this is theater—the discount was always available, 
                and the call is often fake or pre-arranged.
              </p>

              <h4>2. Fear-Based Urgency</h4>
              <p>
                "Hurricane season starts next month—installation crews are booked solid." While 
                timing does matter, legitimate companies don't need scare tactics to sell quality 
                products. If the pressure feels manipulative, it probably is.
              </p>

              <h4>3. The "Apples to Oranges" Comparison</h4>
              <p>
                Salespeople often compare their premium product to a competitor's budget line, 
                making the price difference seem justified. Always ask for apples-to-apples specs.
              </p>

              <h4>4. Anchoring With a Fake "Original" Price</h4>
              <p>
                A quote starts at $40,000, then magically drops to $25,000 with "today only" 
                discounts. The $40,000 was never real—it's an anchor to make $25,000 seem like a deal.
              </p>

              <h3>How to Protect Yourself</h3>
              <ul>
                <li><strong>Always get 3+ quotes:</strong> This reveals the real market price</li>
                <li><strong>Request itemized quotes:</strong> Lump sums hide overpricing</li>
                <li><strong>Take 48 hours minimum:</strong> No legitimate deal expires same-day</li>
                <li><strong>Check the NOA numbers:</strong> Verify product certifications independently</li>
                <li><strong>Record the presentation:</strong> Florida is a two-party consent state for calls, but you can take notes</li>
              </ul>

              <h3>What Fair Quotes Look Like</h3>
              <p>
                A legitimate window quote should include:
              </p>
              <ul>
                <li>Itemized pricing for materials, labor, permits, and disposal</li>
                <li>Specific product model numbers and NOA certifications</li>
                <li>Written warranty terms (not just verbal promises)</li>
                <li>Realistic installation timeline</li>
                <li>Clear cancellation policy</li>
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
                  <Eye className="h-5 w-5 text-primary" />
                  Sales Tactics Guide
                </CardTitle>
                <CardDescription>
                  Deep dive into the 11 most common manipulation techniques and how to counter them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.SALES_TACTICS_GUIDE}>
                    Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Kitchen Table Guide
                </CardTitle>
                <CardDescription>
                  Step-by-step playbook for handling in-home sales presentations confidently.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.KITCHEN_TABLE_GUIDE}>
                    Read Guide <ArrowRight className="ml-2 h-4 w-4" />
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
              Upload your quote and our AI will identify pricing anomalies, missing items, and pressure tactics.
            </p>
            <Button asChild size="lg">
              <Link to={pillar.softCTA.link}>
                <ScanSearch className="mr-2 h-4 w-4" />
                Scan Your Quote Now
              </Link>
            </Button>
          </div>
        </section>
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
