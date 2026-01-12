import { RefObject } from 'react';
import { CheckCircle, XCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const checklistItems = [
  { text: 'Impact rating clearly stated (e.g., Large Missile)', good: true },
  { text: 'Design pressure specified per opening', good: true },
  { text: 'Product manufacturer and model identified', good: true },
  { text: 'Detailed installation scope (removal, disposal, etc.)', good: true },
  { text: 'Permit fees included or listed separately', good: true },
  { text: 'Warranty terms (product + labor) clearly defined', good: true },
  { text: 'Payment schedule with milestones', good: true },
  { text: 'Notice of Right to Cancel included', good: true },
];

const redFlags = [
  { text: 'Vague "installation included" without details', good: false },
  { text: 'No specific product models or specs', good: false },
  { text: 'Pressure to sign same-day for "special pricing"', good: false },
  { text: 'Missing permit or inspection mentions', good: false },
];

interface QuoteSafetyChecklistProps {
  uploadRef?: RefObject<HTMLDivElement>;
}

export function QuoteSafetyChecklist({ uploadRef }: QuoteSafetyChecklistProps) {
  const handleScrollToUpload = () => {
    if (uploadRef?.current) {
      uploadRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 md:py-16 bg-muted/20">
      <div className="container px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            What a Legitimate Quote Should Include
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Before signing, make sure your quote has these essential elements. 
            Missing items = leverage for negotiation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Good Signs */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5" />
              What to Look For
            </h3>
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Red Flags */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-rose-500 flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5" />
              Common Red Flags
            </h3>
            <div className="space-y-2">
              {redFlags.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card border border-rose-500/20"
                >
                  <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
            
            {/* CTA */}
            <div className="pt-4">
              <Button
                onClick={handleScrollToUpload}
                variant="outline"
                className="w-full gap-2 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
              >
                <Upload className="w-4 h-4" />
                Scan Your Quote for Red Flags
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
