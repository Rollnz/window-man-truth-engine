import { ShieldCheck, AlertTriangle, FileText, Scale, Wind, Percent, RefreshCw } from "lucide-react";
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

const pillar = PILLARS['window-risk-and-code'];

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

const stats = [
  { value: "150+ mph", label: "Wind zones across Florida", icon: Wind },
  { value: "45%", label: "Max insurance discount potential", icon: Percent },
  { value: "9,000", label: "Pressure test cycles required", icon: RefreshCw },
];

const contentSections = [
  {
    heading: "Understanding Florida's Hurricane Protection Requirements",
    paragraphs: [
      "Florida has some of the strictest building codes in the nation when it comes to hurricane protection. But navigating these requirements can be confusing, especially with different rules for different regions. This guide breaks down what you actually need to know.",
    ],
    bullets: undefined,
  },
  {
    heading: "The High-Velocity Hurricane Zone (HVHZ)",
    paragraphs: [
      "The HVHZ includes Miami-Dade County, Broward County, and parts of Palm Beach County. If your home is in this zone, your windows must meet the strictest standards:",
    ],
    bullets: [
      "<strong>Large missile impact test:</strong> Withstand a 9-pound 2x4 lumber traveling at 50 fps",
      "<strong>Cyclic pressure test:</strong> Endure 9,000 positive and negative pressure cycles",
      "<strong>Wind pressure resistance:</strong> Meet specific design pressures based on building height and location",
      "<strong>Miami-Dade NOA:</strong> Must have a valid Notice of Acceptance number",
    ],
  },
  {
    heading: "Outside the HVHZ: Florida Building Code Requirements",
    paragraphs: [
      "Homes outside the HVHZ still need hurricane protection, but requirements vary by wind zone. The Florida Building Code divides the state into wind zones based on 3-second gust wind speeds:",
    ],
    bullets: [
      "<strong>110-120 mph zones:</strong> Interior Florida, lower requirements",
      "<strong>130-150 mph zones:</strong> Coastal areas, stricter impact resistance needed",
      "<strong>150+ mph zones:</strong> Keys and exposed coastal areas, near-HVHZ requirements",
    ],
  },
  {
    heading: "What \"Hurricane Ready\" Actually Means",
    paragraphs: [
      "Being code-compliant is the minimum. True hurricane readiness considers:",
    ],
    bullets: [
      "<strong>All openings protected:</strong> Windows, doors, garage doors, skylights",
      "<strong>Consistent protection level:</strong> One weak point can cause catastrophic failure",
      "<strong>Proper installation:</strong> Even the best windows fail if installed incorrectly",
      "<strong>Secondary protection:</strong> Shutters as backup, especially for sliding glass doors",
    ],
  },
  {
    heading: "Insurance Implications",
    paragraphs: [
      "Your protection level directly affects your insurance premiums. A wind mitigation inspection documents your home's features and can unlock significant discounts:",
    ],
    bullets: [
      "Opening protection (impact windows/shutters): <strong>15-45% discount potential</strong>",
      "Roof-to-wall connections: <strong>5-25% discount</strong>",
      "Roof geometry (hip vs gable): <strong>Up to 10% discount</strong>",
      "Secondary water resistance: Additional savings available",
    ],
  },
];

const guides = [
  {
    title: "Spec Checklist Guide",
    description: "Ensure your windows meet all required specifications before purchase.",
    icon: FileText,
    to: ROUTES.SPEC_CHECKLIST_GUIDE,
  },
  {
    title: "Claim Survival Kit",
    description: "Document your protection properly for insurance claims.",
    icon: Scale,
    to: ROUTES.CLAIM_SURVIVAL,
    linkLabel: "Get the Kit",
  },
  {
    title: "Defense Guide",
    description: "Learn comprehensive hurricane defense strategies.",
    icon: ShieldCheck,
    to: ROUTES.DEFENSE,
    linkLabel: "Learn More",
  },
];

const WindowRiskAndCode = () => {
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
        <PillarHeroSection
          icon={ShieldCheck}
          title={pillar.h1}
          description={pillar.description}
          ctas={[
            { label: "Run Risk Diagnostic", to: ROUTES.RISK_DIAGNOSTIC, icon: AlertTriangle },
            { label: "Take Vulnerability Test", to: ROUTES.VULNERABILITY_TEST, icon: ShieldCheck },
          ]}
        />

        <PillarStatBar stats={stats} />

        <PillarContentBlock sections={contentSections} />

        <EvidenceModule
          title="Risk Data You Need to See"
          subtitle="Exposed compliance gaps across Florida homes"
          findings={[
            { title: "62% of Homes Have At Least One Non-Compliant Opening", description: "Building code inspection data reveals that most Florida homes have at least one window or door opening that doesn't meet current hurricane protection requirements.", severity: "critical", icon: AlertTriangle, source: "FL Building Code Inspection Data" },
            { title: "Improper Installation Voids Warranty in 100% of Cases", description: "Every major window manufacturer's warranty terms require certified installation. DIY or unlicensed installs void all coverage — no exceptions.", severity: "warning", icon: ShieldCheck, source: "Manufacturer Warranty Terms" },
          ]}
        />

        <PillarCalloutCard text="One weak point can cause catastrophic failure. Consistent protection across all openings is not optional—it's essential." />

        <MidPageCTA
          heading="Check Your Home's Protection Gaps"
          description="Get a personalized risk assessment based on your home's location, age, and current protection."
          buttonLabel="Run Risk Diagnostic"
          buttonIcon={AlertTriangle}
          to={ROUTES.RISK_DIAGNOSTIC}
          microcopy="Free · No login required · Florida-specific analysis"
        />

        <PillarGuideCards heading="Related Guides" guides={guides} />

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
          description="Get a personalized assessment of your home's hurricane protection and code compliance."
          buttonLabel="Start Risk Diagnostic"
          buttonIcon={AlertTriangle}
          to={pillar.softCTA.link}
          microcopy="Free · No login required · Florida-specific analysis"
        />
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
