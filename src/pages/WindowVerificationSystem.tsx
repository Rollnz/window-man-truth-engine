import { CheckCircle, FileSearch, Library, FolderLock, Layers, Search, ShieldCheck, Shield } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";

import { PILLARS } from "@/config/pillarMapping";
import { ROUTES } from "@/config/navigation";
import { ReviewedByBadge, ExitIntentModal } from "@/components/authority";
import { EvidenceModule, MidPageCTA } from "@/components/forensic";
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

const pillar = PILLARS['window-verification-system'];

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

const stats = [
  { value: "3", label: "Verification pillars to check", icon: Layers },
  { value: "NOA", label: "Certification to always verify", icon: Search },
  { value: "100%", label: "Permit compliance required", icon: ShieldCheck },
];

const contentSections = [
  {
    heading: "The Verification Mindset",
    paragraphs: [
      "In Florida's window replacement industry, trust but verify isn't just good advice—it's essential. Between unlicensed contractors, inflated quotes, and products that don't match their claims, verification is your last line of defense before writing a check.",
    ],
    bullets: undefined,
  },
  {
    heading: "Product Verification",
    paragraphs: [
      "Every legitimate impact window should have verifiable certifications. If a salesperson can't provide these numbers, or they don't check out, walk away.",
    ],
    bullets: [
      "<strong>Miami-Dade NOA number:</strong> Searchable in the county database",
      "<strong>Florida Product Approval:</strong> Listed in the FL Product Approval database",
      "<strong>ASTM E1996 certification:</strong> Standard impact test compliance",
      "<strong>Design pressure ratings:</strong> Must match your building's requirements",
    ],
  },
  {
    heading: "Contractor Verification",
    paragraphs: [
      "Florida requires window installers to hold specific licenses:",
    ],
    bullets: [
      "<strong>State license:</strong> Verify at MyFloridaLicense.com",
      "<strong>Local licensing:</strong> Some counties require additional registration",
      "<strong>Insurance:</strong> Request certificates of liability and workers' comp",
      "<strong>Permit history:</strong> Check if they consistently pull proper permits",
    ],
  },
  {
    heading: "Quote Verification",
    paragraphs: [
      "A quote isn't just a price—it's a contract. Verify everything before signing:",
    ],
    bullets: [
      "<strong>Product specifications:</strong> Match what was discussed",
      "<strong>Installation scope:</strong> Includes all necessary work",
      "<strong>Permit responsibility:</strong> Should be the contractor's job",
      "<strong>Timeline and payment terms:</strong> Never pay in full upfront",
      "<strong>Warranty details:</strong> Both manufacturer and labor warranties",
    ],
  },
  {
    heading: "Red Flags That Require Deeper Verification",
    paragraphs: [
      "Watch for these warning signs that something isn't right:",
    ],
    bullets: [
      "Significantly lower prices than competitors (too good = too risky)",
      "Requests for large upfront deposits (10-30% is normal)",
      "Reluctance to provide license numbers or references",
      'Pressure to skip permits "to save money"',
      "Vague warranty language or verbal-only promises",
      "No physical business address",
    ],
  },
];

const guides = [
  {
    title: "Evidence Library",
    description: "Real case studies, quotes, and documentation from verified installations.",
    icon: FileSearch,
    to: ROUTES.EVIDENCE,
    linkLabel: "Browse Cases",
  },
  {
    title: "Intel Library",
    description: "Company profiles, market data, and intelligence reports.",
    icon: Library,
    to: ROUTES.INTEL,
    linkLabel: "View Intel",
  },
  {
    title: "Your Vault",
    description: "Secure storage for your quotes, results, and documentation.",
    icon: FolderLock,
    to: ROUTES.VAULT,
    linkLabel: "Open Vault",
  },
];

const WindowVerificationSystem = () => {
  const pillarSchemaGraph = generatePillarSchemaGraph('window-verification-system');
  const faqSchema = generateFAQSchema(faqs);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Window Verification System: How to Verify Quotes & Installers Before Signing"
        description={pillar.description}
        canonicalUrl="https://itswindowman.com/window-verification-system"
        jsonLd={[pillarSchemaGraph, faqSchema, getReviewBoardSchema()]}
      />
      <Navbar />

      <main className="pt-20">
        <PillarHeroSection
          icon={CheckCircle}
          title={pillar.h1}
          description={pillar.description}
          ctas={[
            { label: "Browse Evidence Library", to: ROUTES.EVIDENCE, icon: FileSearch },
            { label: "View Intel Reports", to: ROUTES.INTEL, icon: Library },
          ]}
        />

        <PillarStatBar stats={stats} />

        <PillarContentBlock sections={contentSections} />

        <EvidenceModule
          title="Verification Intelligence"
          subtitle="What our cross-referencing reveals about the Florida market"
          findings={[
            { title: "41% of Quoted Products Lack Valid NOA Certification", description: "Cross-referencing quoted product numbers against the Miami-Dade Product Approval database reveals that nearly half of products in quotes lack valid certifications.", severity: "critical", icon: FileSearch, source: "Miami-Dade Product Approval DB" },
            { title: "1 in 5 Installers Operating Without Proper License", description: "MyFloridaLicense.com cross-referencing shows 20% of installers quoting jobs either have expired, suspended, or no valid state license.", severity: "warning", icon: Shield, source: "MyFloridaLicense.com Cross-Reference" },
          ]}
        />

        <PillarCalloutCard text="If they can't provide NOA numbers, walk away. Legitimate products always have verifiable certifications." />

        <MidPageCTA
          heading="Verify Before You Sign"
          description="See real examples of verified installations, pricing, and outcomes from Florida homeowners."
          buttonLabel="Browse Evidence Library"
          buttonIcon={FileSearch}
          to={ROUTES.EVIDENCE}
          microcopy="Free · No login required · Real Florida data"
        />

        <PillarGuideCards heading="Verification Resources" guides={guides} />

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
          description="See real examples of verified installations, pricing, and outcomes from Florida homeowners."
          buttonLabel="Browse Evidence Library"
          buttonIcon={FileSearch}
          to={pillar.softCTA.link}
          microcopy="Free · No login required · Real Florida data"
        />
      </main>

      <ExitIntentModal
        sourceTool="window-verification-system"
        hasConverted={false}
        resultSummary="Verifying window quotes and installers before signing"
      />
    </div>
  );
};

export default WindowVerificationSystem;
