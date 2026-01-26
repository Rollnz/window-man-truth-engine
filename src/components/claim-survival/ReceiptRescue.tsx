import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { FolderSearch, CheckCircle, ChevronRight } from 'lucide-react';
import { receiptRescueItems } from '@/data/claimSurvivalData';
import aiBrainIcon from '@/assets/ai-brain-icon.png';

export function ReceiptRescue() {
  return (
    <div className="container px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
          <FolderSearch className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Lost Document Recovery</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Can't find your paperwork? Here's how to recover the documents you need.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto p-4">
        <Accordion type="single" collapsible className="w-full">
          {receiptRescueItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <FolderSearch className="w-4 h-4 text-primary shrink-0" />
                  <span>{item.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 mb-4">
                  {item.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      {/* CTA - Click to Call */}
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground mb-3">
          Need help finding your window documentation?
        </p>
        <a href="tel:+15614685571">
          <button 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#2cbff9' }}
          >
            <img src={aiBrainIcon} alt="" className="w-5 h-5" />
            Ask WindowMan AI
            <ChevronRight className="h-4 w-4" />
          </button>
        </a>
      </div>
    </div>
  );
}