import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqItems } from '@/data/specChecklistData';
import { trackEvent } from '@/lib/gtm';

const FAQSection: React.FC = () => {
  const handleFaqOpen = (question: string) => {
    trackEvent('faq_opened', { question_text: question.slice(0, 50) });
  };

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Common Questions About the Audit System
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((faq, i) => (
            <AccordionItem 
              key={i} 
              value={`faq-${i}`}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
              <AccordionTrigger 
                className="px-6 py-4 hover:no-underline hover:bg-muted/50 text-left"
                onClick={() => handleFaqOpen(faq.question)}
              >
                <span className="font-medium text-foreground pr-4">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
