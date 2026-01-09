import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Shield, Target, GitCompare } from 'lucide-react';

const faqItems = [
  {
    id: 'tactical',
    icon: Shield,
    title: 'Tactical Asset Protection',
    content: 'Your Fair Price analysis is negotiation ammunition. Syncing anchors your data in a secure, private dashboard so it\'s ready whenever a salesperson tries to corner you.',
  },
  {
    id: 'operational',
    icon: Target,
    title: 'Operational Readiness',
    content: 'Grant your consultant read-only access to your specific quote analysis for a surgical, data-driven conversation instead of a generic sales pitch.',
  },
  {
    id: 'strategic',
    icon: GitCompare,
    title: 'Strategic Comparison',
    content: 'Your Vault allows you to stack multiple quotes side-by-side. Compare every estimate you receive to ensure you never overpay for hidden \'marketing fees.\'',
  },
];

export function WhyVaultFAQ() {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Why the Vault?
      </h4>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item) => (
          <AccordionItem key={item.id} value={item.id} className="border-border/50">
            <AccordionTrigger className="text-left hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium text-foreground">{item.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pl-8">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
