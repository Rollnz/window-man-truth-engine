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
    <section className="py-12 md:py-16 bg-slate-50 dark:bg-zinc-950/60">
      <div className="container px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
            What a Legitimate Quote Should Include
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Before signing, make sure your quote has these essential elements. 
            Missing items = leverage for negotiation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Good Signs */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              What to Look For
            </h3>
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg",
                    // Light mode: clean white card
                    "bg-white border border-emerald-200 shadow-sm",
                    // Dark mode: glassmorphism
                    "dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:shadow-none"
                  )}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-zinc-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Red Flags */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Common Red Flags
            </h3>
            <div className="space-y-2">
              {redFlags.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg",
                    // Light mode: clean white card with rose accent
                    "bg-white border border-rose-200 shadow-sm",
                    // Dark mode: glassmorphism with rose tint
                    "dark:bg-rose-500/10 dark:border-rose-500/30 dark:shadow-none"
                  )}
                >
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-zinc-300">{item.text}</span>
                </div>
              ))}
            </div>
            
            {/* CTA */}
            <div className="pt-4">
              <Button
                onClick={handleScrollToUpload}
                className={cn(
                  "w-full gap-2",
                  // Light mode: solid rose
                  "bg-rose-600 text-white hover:bg-rose-700 border-0",
                  // Dark mode: transparent with glow
                  "dark:bg-rose-500/20 dark:text-rose-300 dark:border dark:border-rose-500/40",
                  "dark:hover:bg-rose-500/30"
                )}
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
