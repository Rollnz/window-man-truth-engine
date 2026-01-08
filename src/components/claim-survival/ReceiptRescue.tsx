import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderSearch, CheckCircle, ArrowRight } from 'lucide-react';
import { receiptRescueItems } from '@/data/claimSurvivalData';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/navigation';

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

      {/* CTA */}
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground mb-3">
          Need help finding your window documentation?
        </p>
        <Link to={ROUTES.EXPERT}>
          <Button variant="outline">
            Ask Windowman AI
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}