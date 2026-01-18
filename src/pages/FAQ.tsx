import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ConversionBar } from "@/components/conversion/ConversionBar";
import { ROUTES } from "@/config/navigation";
import { getGuidePageSchemas, getBreadcrumbSchema } from "@/lib/seoSchemas/index";

const faqs = [
  {
    question: "Is the estimate really free?",
    answer: "Yes. We price-check your project and flag add-ons contractors usually hide. If you want, we'll also schedule a no-pressure inspection.",
  },
  {
    question: "What if I already have a quote?",
    answer: "Upload it to the scanner. We'll identify red flags, compare specs, and build a negotiation script for you.",
  },
  {
    question: "Can I just download the spec checklist?",
    answer: "Absolutely. Grab the Window Buyer's Specification Checklist and if you need a contractor later, we'll match you with one who fits your home and budget.",
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="Frequently Asked Questions"
        description="Get quick answers about our free window replacement tools, quote analysis, and how to work with contractors. Each answer includes actionable next steps."
        canonicalUrl="https://itswindowman.com/faq"
        jsonLd={[...getGuidePageSchemas('faq'), getBreadcrumbSchema('faq')]}
      />
      <Navbar />

      <main className="pt-20">
        <section className="container px-4 py-12 space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold text-primary">FAQ</p>
            <h1 className="text-3xl sm:text-4xl font-bold">Quick answers, with next steps baked in.</h1>
            <p className="text-muted-foreground">
              Every answer points to an action—book an inspection if you want hands-on help, or download a resource if you'd rather DIY.
            </p>
          </div>

          <Accordion type="single" collapsible className="bg-card border border-border rounded-xl">
            {faqs.map((item, index) => (
              <AccordionItem key={item.question} value={`item-${index + 1}`} className="border-b last:border-none">
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <p>{item.answer}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link to={ROUTES.FREE_ESTIMATE}>Book an Inspection</Link>
                    </Button>
                    <Button asChild size="sm" variant="secondary-action">
                      <Link to={ROUTES.SPEC_CHECKLIST_GUIDE}>Download Spec Checklist</Link>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="container px-4 pb-16">
          <ConversionBar
            headline="Still unsure? Let's run the numbers together."
            subheadline="Hop into a free estimate to confirm pricing and next steps for your home."
          />
        </section>
      </main>
    </div>
  );
};

export default FAQ;