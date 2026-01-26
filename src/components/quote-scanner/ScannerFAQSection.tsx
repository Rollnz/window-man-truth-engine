import { RefObject } from 'react';
import { ChevronDown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
const faqs = [{
  question: "Is my quote data private?",
  answer: "Absolutely. Your uploaded quote is analyzed in real-time and never stored permanently. We don't share your data with contractors or third parties. Your privacy is our priority."
}, {
  question: "What file types can I upload?",
  answer: "We support JPG, PNG, and PDF files up to 10MB. For best results, make sure the text is clearly visible and the image isn't blurry or cropped."
}, {
  question: "How accurate is the AI analysis?",
  answer: "Our AI is trained on thousands of window quotes and can identify common red flags with high accuracy. However, we always recommend a human review for final decisions. Think of it as your first line of defense."
}, {
  question: "What if my quote looks fine - will you still find issues?",
  answer: "Even 'clean' quotes often have subtle issues: vague installation scope, missing warranty terms, or inflated labor rates. Our AI looks for things you might not think to check."
}, {
  question: "Do I need to give my email to use this?",
  answer: "You can scan your quote for free. We'll ask for your email only to unlock the full detailed report with negotiation tools and personalized recommendations."
}, {
  question: "Can the AI read handwritten quotes?",
  answer: "Our AI works best with typed/printed quotes. Handwritten estimates may have lower accuracy. If possible, request a typed version from your contractor."
}];
interface ScannerFAQSectionProps {
  uploadRef?: RefObject<HTMLDivElement>;
}
export function ScannerFAQSection({
  uploadRef
}: ScannerFAQSectionProps) {
  const handleScrollToUpload = () => {
    if (uploadRef?.current) {
      uploadRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    } else {
      // Fallback: scroll to top of page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  return <section className="py-12 md:py-16">
      <div className="container px-4 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about the AI Quote Scanner
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {faqs.map((faq, idx) => <AccordionItem key={idx} value={`faq-${idx}`} className="border border-border/50 rounded-lg px-4 bg-card/50">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="text-sm font-semibold md:text-lg text-black">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>)}
        </Accordion>

        {/* CTA Button */}
        <div className="text-center mt-8">
          <Button onClick={handleScrollToUpload} size="lg" className="gap-2">
            <Upload className="w-4 h-4" />
            Ready to Scan Your Quote?
          </Button>
        </div>
      </div>
    </section>;
}