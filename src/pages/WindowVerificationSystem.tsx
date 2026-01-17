import { Link } from "react-router-dom";
import { CheckCircle, FileSearch, Library, FolderLock, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PILLARS } from "@/config/pillarMapping";
import { ROUTES } from "@/config/navigation";
import { ReviewedByBadge } from "@/components/authority";
import { getReviewBoardSchema } from "@/config/expertIdentity";

const pillar = PILLARS['window-verification-system'];

const WindowVerificationSystem = () => {
  const faqs = [
    {
      question: "How can I verify if a window quote is legitimate?",
      answer: "Start by checking the product's NOA (Notice of Acceptance) number on the Miami-Dade County product search. Verify the contractor's license on MyFloridaLicense.com. Cross-reference pricing with our evidence library of real quotes. Finally, use our AI Scanner to identify red flags and unusual pricing patterns."
    },
    {
      question: "What documents should I request before signing?",
      answer: "Essential documents include: the detailed written quote with itemized pricing, product specification sheets with NOA numbers, contractor license and insurance certificates, warranty documentation (manufacturer and installer), and the permit application. Our Evidence Locker shows examples of proper documentation."
    },
    {
      question: "How do I check if an installer is reputable?",
      answer: "Verify their license status and any complaints through MyFloridaLicense.com. Check BBB ratings and Google reviews. Ask for references from recent local installations. Confirm they pull permits for all work. Our Intel Library contains background on major Florida window companies."
    },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": "https://itswindowman.com/window-verification-system",
    "headline": pillar.h1,
    "description": pillar.description,
    "author": {
      "@type": "Person",
      "@id": "https://itswindowman.com/#expert",
      "name": "WindowMan Review Board",
      "jobTitle": "Florida Impact Window Specialists"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Window Man Your Hurricane Hero",
      "url": "https://itswindowman.com"
    },
    "mainEntityOfPage": "https://itswindowman.com/window-verification-system",
    "datePublished": "2025-01-16",
    "dateModified": "2025-01-16",
    "about": pillar.intent,
    "keywords": pillar.ownsQueries.join(", ")
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://itswindowman.com" },
      { "@type": "ListItem", "position": 2, "name": "Window Verification System", "item": "https://itswindowman.com/window-verification-system" }
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Window Verification System: How to Verify Quotes & Installers Before Signing"
        description={pillar.description}
        canonicalUrl="https://itswindowman.com/window-verification-system"
        jsonLd={[articleSchema, faqSchema, breadcrumbSchema, getReviewBoardSchema()]}
      />
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="container px-4 py-12 md:py-16">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
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
                <Link to={ROUTES.EVIDENCE}>
                  <FileSearch className="mr-2 h-4 w-4" />
                  Browse Evidence Library
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={ROUTES.INTEL}>
                  <Library className="mr-2 h-4 w-4" />
                  View Intel Reports
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container px-4 py-8">
          <div className="max-w-4xl space-y-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2>The Verification Mindset</h2>
              <p>
                In Florida's window replacement industry, trust but verify isn't just good advice—it's 
                essential. Between unlicensed contractors, inflated quotes, and products that don't 
                match their claims, verification is your last line of defense before writing a check.
              </p>
              
              <h3>The Three Pillars of Verification</h3>
              
              <h4>1. Product Verification</h4>
              <p>
                Every legitimate impact window should have verifiable certifications:
              </p>
              <ul>
                <li><strong>Miami-Dade NOA number:</strong> Searchable in the county database</li>
                <li><strong>Florida Product Approval:</strong> Listed in the FL Product Approval database</li>
                <li><strong>ASTM E1996 certification:</strong> Standard impact test compliance</li>
                <li><strong>Design pressure ratings:</strong> Must match your building's requirements</li>
              </ul>
              <p>
                If a salesperson can't provide these numbers, or they don't check out, walk away.
              </p>

              <h4>2. Contractor Verification</h4>
              <p>
                Florida requires window installers to hold specific licenses:
              </p>
              <ul>
                <li><strong>State license:</strong> Verify at MyFloridaLicense.com</li>
                <li><strong>Local licensing:</strong> Some counties require additional registration</li>
                <li><strong>Insurance:</strong> Request certificates of liability and workers' comp</li>
                <li><strong>Permit history:</strong> Check if they consistently pull proper permits</li>
              </ul>

              <h4>3. Quote Verification</h4>
              <p>
                A quote isn't just a price—it's a contract. Verify:
              </p>
              <ul>
                <li><strong>Product specifications:</strong> Match what was discussed</li>
                <li><strong>Installation scope:</strong> Includes all necessary work</li>
                <li><strong>Permit responsibility:</strong> Should be the contractor's job</li>
                <li><strong>Timeline and payment terms:</strong> Never pay in full upfront</li>
                <li><strong>Warranty details:</strong> Both manufacturer and labor warranties</li>
              </ul>

              <h3>Red Flags That Require Deeper Verification</h3>
              <ul>
                <li>Significantly lower prices than competitors (too good = too risky)</li>
                <li>Requests for large upfront deposits (10-30% is normal)</li>
                <li>Reluctance to provide license numbers or references</li>
                <li>Pressure to skip permits "to save money"</li>
                <li>Vague warranty language or verbal-only promises</li>
                <li>No physical business address</li>
              </ul>

              <h3>Using Our Verification Tools</h3>
              <p>
                We've built three interconnected tools to help you verify everything:
              </p>
              <ul>
                <li><strong>Evidence Library:</strong> Real quotes, installation photos, and case studies</li>
                <li><strong>Intel Library:</strong> Company backgrounds, red flag reports, and market data</li>
                <li><strong>Your Vault:</strong> Secure storage for your quotes and documentation</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Assets Section - Pillars link DOWN to subordinate content */}
        <section className="container px-4 py-12 border-t border-border">
          <h2 className="text-2xl font-bold mb-6">Verification Resources</h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-primary" />
                  Evidence Library
                </CardTitle>
                <CardDescription>
                  Real case studies, quotes, and documentation from verified installations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.EVIDENCE}>
                    Browse Cases <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Library className="h-5 w-5 text-primary" />
                  Intel Library
                </CardTitle>
                <CardDescription>
                  Company profiles, market data, and intelligence reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.INTEL}>
                    View Intel <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderLock className="h-5 w-5 text-primary" />
                  Your Vault
                </CardTitle>
                <CardDescription>
                  Secure storage for your quotes, results, and documentation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={ROUTES.VAULT}>
                    Open Vault <ArrowRight className="ml-2 h-4 w-4" />
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
              See real examples of verified installations, pricing, and outcomes from Florida homeowners.
            </p>
            <Button asChild size="lg">
              <Link to={pillar.softCTA.link}>
                <FileSearch className="mr-2 h-4 w-4" />
                Browse Evidence Library
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WindowVerificationSystem;
