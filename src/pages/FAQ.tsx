import { useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ConversionBar } from "@/components/conversion/ConversionBar";
import { ROUTES } from "@/config/navigation";
import { getGuidePageSchemas, getBreadcrumbSchema } from "@/lib/seoSchemas/index";
import { ConsultationBookingModal } from "@/components/conversion/ConsultationBookingModal";
import { useSessionData } from "@/hooks/useSessionData";
import impactTruthClipboardImage from "@/assets/impact_truth_clipboard_1-2.webp";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Can this actually save me money, or is that just marketing?",
    answer:
      "It's a fair question, and here's the honest answer: the savings are real because the overcharging is real. The average homeowner in South Florida gets their first impact window quote with zero context for what's actually fair — no market benchmark, no itemized breakdown, no way to know if the $22,000 number they're staring at reflects actual material and labor costs or a healthy dose of \"let's see what they'll pay.\" Our AI closes that information gap instantly. It cross-references your quote against current Florida market pricing data and flags the specific line items where you're being charged above fair market value. The $8,000 average savings figure isn't a made-up marketing number — it's what happens when homeowners walk back into contractor conversations armed with actual data instead of gut feelings. Some people save more. Some save less. But almost nobody who scans their quote pays full price afterward.",
  },
  {
    question: "What happens if my contractor finds out I scanned their quote?",
    answer:
      "Nothing happens — and that's the point. The scan is completely private. Your contractor has no way of knowing you used it, and you're under zero obligation to tell them. That said, here's something worth sitting with: if you did tell a contractor you ran an independent analysis of their quote and they got defensive or upset about it, that reaction would tell you everything you need to know. A contractor who is confident in their pricing and their workmanship welcomes scrutiny. The ones who don't want you looking too closely are usually the ones with something to hide. So while the scan is discreet by design, even the hypothetical of telling your contractor is a useful filter.",
  },
  {
    question: "What's the difference between a quote that looks professional and one that's actually safe to sign?",
    answer:
      "This is the most important question a homeowner can ask, and unfortunately most people never think to ask it. A professional-looking quote — clean layout, company letterhead, itemized sections, the works — can still be a dangerous document to sign. The danger isn't in how it looks. It's in what's missing. A safe impact window contract in Florida needs to include the exact NOA (Notice of Acceptance) number for every product being installed, because that number is what proves the window is approved for hurricane use in your specific county. It needs to clearly state who is pulling the permits, who is paying for inspections, and what happens if the scope of work changes. It needs per-opening pricing, not a bundled total that makes it impossible to know what you're actually paying for each window. When those things are absent, it doesn't matter how professional the quote looks — you're signing a document that leaves you exposed. The AI scan checks for every one of those items specifically, because a contractor's marketing budget has no bearing on whether their contract protects you.",
  },
  {
    question: "What if I've already been burned by a contractor before — will this actually protect me?",
    answer:
      "If you've been through a bad experience — overcharged, ghosted after deposit, installed windows that didn't pass inspection, whatever the story — then you already know something most homeowners only learn the hard way: the danger usually wasn't obvious until it was too late. That's not a failure of your judgment. It's a structural problem. Homeowners go into these transactions with almost no information, and contractors go in with years of experience knowing exactly what language to use and what details to leave vague. The scan exists to close that gap permanently. It doesn't rely on whether the contractor seems trustworthy, whether they have good reviews, or whether the salesperson was charming. It looks at the actual document and evaluates it against a fixed standard. The things that burned you before — vague payment terms, missing permit language, no warranty documentation — are exactly what the scan is calibrated to catch. You don't have to trust your gut again. You can trust the evidence.",
  },
  {
    question: "Why would Window Man do this for free? What's the catch?",
    answer:
      "There's no catch, but there is a business model, and you deserve to know what it is. Window Man earns revenue by connecting homeowners who have been through the scan process with vetted, pre-screened contractors in our network. That's it. No advertising, no selling your information to random companies, no bait-and-switch. Here's why this model actually works in your favor: our incentive is only to make that introduction when we genuinely believe it's a good match for you. If we send you to a bad contractor, we lose your trust and our reputation. So the free scan isn't a loss leader designed to upsell you into something — it's the actual product, because a homeowner who feels protected and informed is the only kind of homeowner who will ever trust us enough to use our contractor network. The business only works if the free part is genuinely valuable.",
  },
  {
    question: "How is this different from just asking a friend who knows about windows?",
    answer:
      "Your friend with industry knowledge is a genuinely valuable resource, and we're not going to pretend otherwise. But there are a few things your friend can't do that the scan can. Your friend has opinions formed from their own experience; the AI has pattern-matched across hundreds of Florida quotes and knows what current Palm Beach County pricing looks like right now, not two years ago. Your friend probably can't look up a specific NOA number to verify that a product is actually rated for your county's wind load requirements. And most importantly, your friend is giving you their best guess on a document they're reviewing quickly as a favor, without a structured framework for what to look for. The scan applies the same rigorous checklist to every single quote, every single time, with no fatigue and no guessing. Think of it less as replacing your friend and more as giving your friend a professional-grade diagnostic tool to work with.",
  },
  {
    question: "What if my quote looks normal but something still feels off?",
    answer:
      "Trust that feeling — it exists for a reason. Most homeowners who have been in a high-pressure sales situation can sense when something isn't right, even when they can't put their finger on exactly what it is. Maybe the price dropped suspiciously fast when you pushed back. Maybe the salesperson was evasive about permit details. Maybe the warranty sounded great but the language in the contract was vague. That dissonance between what you heard and what you're reading is your instinct doing its job. The scan gives you a way to turn that instinct into evidence. It will either surface the specific problem you were sensing — a missing specification, a red-flag contract clause, a pricing anomaly — or it will give you the documented reassurance that the quote is actually solid and your anxiety was just the normal stress of a big purchase. Either outcome is valuable. The worst thing you can do with that feeling is ignore it and sign anyway.",
  },
];

const FAQ = () => {
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const { sessionData } = useSessionData();

  const quickLinks = useMemo(
    () => [
      {
        title: "Upload your quote",
        description: "Run the AI scanner now and get red flags, missing specs, and pricing insights in minutes.",
        href: ROUTES.QUOTE_SCANNER,
        cta: "Start quote scan",
      },
      {
        title: "Create your free account",
        description: "Save scans, compare contractor options, and keep all quote evidence in one place.",
        href: ROUTES.SIGNUP,
        cta: "Create free account",
      },
      {
        title: "Need human help?",
        description: "Book a no-pressure consultation for strategy, verification, and next-step guidance.",
        action: () => setShowConsultationModal(true),
        cta: "Book consultation",
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="FAQ: Impact Window Quotes, Pricing, and AI Scan Questions"
        description="Get clear answers about quote scanning, privacy, pricing savings, and how Window Man helps homeowners avoid overpaying."
        canonicalUrl="https://itswindowman.com/faq"
        jsonLd={[...getGuidePageSchemas("faq"), getBreadcrumbSchema("faq")]}
      />
      <Navbar />

      <main className="pt-20">
        <section className="container px-4 py-12 md:py-16 space-y-8">
          <div className="grid gap-8 items-center lg:grid-cols-[1.1fr,0.9fr]">
            <div className="max-w-4xl space-y-4">
              <p className="text-sm font-semibold text-primary">FAQ</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Real homeowner questions. Straight answers. Clear next steps.</h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl">
                This page is built to help you make a safer, smarter decision before signing a window contract. Read answers, then take action with a free quote scan or account setup.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg">
                  <Link to={ROUTES.QUOTE_SCANNER}>Upload Quote to Scan</Link>
                </Button>
                <Button asChild size="lg" variant="secondary-action">
                  <Link to={ROUTES.SIGNUP}>Create Free Account</Link>
                </Button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm bg-slate-950/90">
              {/* Overlay improves text readability over the hero image on all screen sizes. */}
              <img
                src={impactTruthClipboardImage}
                alt="Window quote analysis interface highlighting detected issues and verified checks"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <p className="text-white text-sm md:text-base font-semibold">To get the truth, you must offer the truth.</p>
                <p className="mt-1 text-xs md:text-sm text-white/80">Private AI review. No contractor notifications. Data-backed pricing and contract risk checks.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickLinks.map((item) => (
              <article key={item.title} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {item.href ? (
                  <Button asChild size="sm" className="w-full md:w-auto">
                    <Link to={item.href}>{item.cta}</Link>
                  </Button>
                ) : (
                  <Button size="sm" className="w-full md:w-auto" onClick={item.action}>
                    {item.cta}
                  </Button>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="container px-4 pb-10 md:pb-14">
          <div className="rounded-2xl border border-border bg-card p-2 md:p-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((item, index) => (
                <AccordionItem key={item.question} value={`item-${index + 1}`} className="border-b px-3 md:px-6 last:border-none">
                  <AccordionTrigger className="text-left text-base md:text-lg font-semibold">{item.question}</AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm md:text-base leading-relaxed text-muted-foreground">
                    <p>{item.answer}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button asChild size="sm">
                        <Link to={ROUTES.QUOTE_SCANNER}>Scan My Quote</Link>
                      </Button>
                      <Button asChild size="sm" variant="secondary-action">
                        <Link to={ROUTES.SIGNUP}>Create Free Account</Link>
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="container px-4 pb-16 space-y-4">
          <ConversionBar
            headline="Don't guess on a five-figure decision."
            subheadline="Upload your quote for a private AI scan, then create your free account to store results and compare offers side by side."
            primaryCtaLabel="Upload Quote"
            primaryCtaHref={ROUTES.QUOTE_SCANNER}
            helperText="Private by design. No pressure. Keep control of every next step."
          />
          <div className="flex justify-center">
            <Button asChild size="lg" variant="secondary-action">
              <Link to={ROUTES.SIGNUP}>Create Free Account</Link>
            </Button>
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

export default FAQ;
