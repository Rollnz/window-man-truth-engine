/**
 * ToolFAQSection - PRD-Compliant Visible FAQ Component
 * 
 * Features:
 * - Visible FAQ accordion that matches JSON-LD schema exactly
 * - PRD answer format: Direct Answer → Elaboration → Tool CTA → Evidence Link
 * - Links UP to parent pillar per SEO Linking Law
 * - Mobile-responsive design
 * - Dossier variant for dark pages like /beat-your-quote
 */

import { Link } from 'react-router-dom';
import { HelpCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getParentPillar } from '@/config/pillarMapping';
import { cn } from '@/lib/utils';
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
  variant?: 'default' | 'dossier' | 'gradient';
}
export function ToolFAQSection({
  toolPath,
  faqs,
  title = "Frequently Asked Questions",
  description,
  variant = 'default'
}: ToolFAQSectionProps) {
  const parentPillar = getParentPillar(toolPath);
  const isDossier = variant === 'dossier';
  const isGradient = variant === 'gradient';
  return <section className={cn("py-12 md:py-16 border-y", isDossier ? "bg-[#0A0F14] border-white/10" : "bg-muted/30 border-border")}>
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className={cn("text-center mb-8 rounded-xl py-6 px-4", isDossier && "bg-[#3E8FDA]")}>
            <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4", isDossier ? "bg-white/20 border border-white/30" : "bg-primary/10 border border-primary/20")}>
              <HelpCircle className={cn("w-6 h-6", isDossier ? "text-white" : "text-primary")} />
            </div>
            <h2 className={cn("text-2xl md:text-3xl font-bold mb-2", isDossier ? "text-white" : "")}>{title}</h2>
            {description && <p className={cn(isDossier ? "text-white/90" : "text-muted-foreground")}>{description}</p>}
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => <AccordionItem key={index} value={`faq-${index}`} className={cn("rounded-lg px-4 md:px-6", isDossier ? "bg-white/5 border border-white/10 data-[state=open]:border-[#3E8FDA]/50" : "", isGradient ? "[background:var(--accordion)] border border-primary/20 data-[state=open]:border-primary/50" : "", !isDossier && !isGradient ? "bg-background border border-border data-[state=open]:border-primary/30" : "")}>
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className={cn("font-medium text-base md:text-lg pr-4", isDossier || isGradient ? "text-white" : "")}>
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-0">
                  <div className={cn("space-y-4", isDossier ? "text-white/85" : "", isGradient ? "text-white" : "", !isDossier && !isGradient ? "text-muted-foreground" : "")}>
                    {/* Direct Answer + Elaboration */}
                    <p className="leading-relaxed">{faq.answer}</p>

                    {/* Tool CTA (if provided) */}
                    {faq.toolCTA && <Link to={faq.toolCTA.href} className="inline-flex items-center gap-2 font-medium text-sm text-[#f5e9bc] hover:text-[#f5e9bc]">
                        <ArrowRight className="w-4 h-4" />
                        {faq.toolCTA.text}
                      </Link>}

                    {/* Evidence Link (if provided) */}
                    {faq.evidenceId && <Link to={`/evidence?case=${faq.evidenceId}`} className={cn("inline-flex items-center gap-1.5 text-xs transition-colors", isDossier ? "text-white/60 hover:text-[#3E8FDA]" : "", isGradient ? "text-white/80 hover:text-white" : "", !isDossier && !isGradient ? "text-muted-foreground/80 hover:text-primary" : "")}>
                        <ExternalLink className="w-3 h-3" />
                        Verified by Case #{faq.evidenceId}
                      </Link>}
                  </div>
                </AccordionContent>
              </AccordionItem>)}
          </Accordion>

          {/* Upward Pillar Link */}
          {parentPillar && <div className="mt-8 text-center">
              <p className={cn("text-sm mb-2", isDossier ? "text-white/80" : "text-muted-foreground")}>
                Part of the{' '}
                <Link to={parentPillar.url} className={cn("hover:underline font-medium", isDossier ? "text-white" : "text-primary")}>
                  {parentPillar.title}
                </Link>{' '}
                authority pillar
              </p>
            </div>}
        </div>
      </div>
    </section>;
}