/**
 * ToolFAQSection - PRD-Compliant Visible FAQ Component
 * 
 * Features:
 * - Visible FAQ accordion that matches JSON-LD schema exactly
 * - PRD answer format: Direct Answer → Elaboration → Tool CTA → Evidence Link
 * - Links UP to parent pillar per SEO Linking Law
 * - Mobile-responsive design
 */

import { Link } from 'react-router-dom';
import { HelpCircle, ArrowRight, ExternalLink } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getParentPillar } from '@/config/pillarMapping';

interface FAQ {
  question: string;
  answer: string;
  toolCTA?: {
    text: string;
    href: string;
  };
  evidenceId?: string;
}

interface ToolFAQSectionProps {
  toolPath: string;
  faqs: FAQ[];
  title?: string;
  description?: string;
}

export function ToolFAQSection({
  toolPath,
  faqs,
  title = "Frequently Asked Questions",
  description,
}: ToolFAQSectionProps) {
  const parentPillar = getParentPillar(toolPath);

  return (
    <section className="py-12 md:py-16 bg-muted/30 border-y border-border">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-background border border-border rounded-lg px-4 md:px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium text-base md:text-lg pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-0">
                  <div className="space-y-4 text-muted-foreground">
                    {/* Direct Answer + Elaboration */}
                    <p className="leading-relaxed">{faq.answer}</p>

                    {/* Tool CTA (if provided) */}
                    {faq.toolCTA && (
                      <Link
                        to={faq.toolCTA.href}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors text-sm"
                      >
                        <ArrowRight className="w-4 h-4" />
                        {faq.toolCTA.text}
                      </Link>
                    )}

                    {/* Evidence Link (if provided) */}
                    {faq.evidenceId && (
                      <Link
                        to={`/evidence?case=${faq.evidenceId}`}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Verified by Case #{faq.evidenceId}
                      </Link>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Upward Pillar Link */}
          {parentPillar && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Part of the{' '}
                <Link
                  to={parentPillar.url}
                  className="text-primary hover:underline font-medium"
                >
                  {parentPillar.title}
                </Link>{' '}
                authority pillar
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
