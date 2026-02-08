import { RefObject, useState } from 'react';
import { 
  // Section headers
  CheckCircle, 
  XCircle,
  // General UI
  Upload, 
  ChevronDown,
  // "What to Look For" icons
  Shield,
  Wind,
  Factory,
  Hammer,
  FileText,
  ShieldCheck,
  CalendarClock,
  Undo2,
  // "Red Flags" icons
  HelpCircle,
  PackageX,
  Timer,
  AlertTriangle,
  Receipt,
  Trash2,
  Gauge,
  ShieldAlert,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/gtm';

interface ChecklistItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

const checklistItems: ChecklistItem[] = [
  {
    title: 'Impact rating clearly stated (e.g., Large Missile)',
    description: "Florida code requires specific ratings (like 'Large Missile Level D') for hurricane zones. Without this explicit rating, your windows may not pass inspection or qualify for insurance discounts.",
    icon: Shield,
  },
  {
    title: 'Design pressure specified per opening',
    description: "This number (e.g., +50/-50) defines the exact wind force the window can withstand. It must match the specific wind zone requirements of your home's location.",
    icon: Wind,
  },
  {
    title: 'Product manufacturer and model identified',
    description: "Generic terms like 'Impact Window' aren't enough. You need the exact brand and model (e.g., 'PGT WinGuard') to verify performance specs and product approvals.",
    icon: Factory,
  },
  {
    title: 'Detailed installation scope (removal, disposal, etc.)',
    description: "A vague 'install included' leaves room for shortcuts. The quote should specify bucking, anchoring, waterproofing, and debris removal to ensure a code-compliant install.",
    icon: Hammer,
  },
  {
    title: 'Permit fees included or listed separately',
    description: "Permits are mandatory for structural work. If fees aren't listed, you might be stuck paying them later, or worse—the contractor might be planning to skip the permit entirely.",
    icon: FileText,
  },
  {
    title: 'Warranty terms (product + labor) clearly defined',
    description: "Manufacturer warranties cover the product, but who covers the work? Ensure the contractor explicitly states how long their labor and workmanship is guaranteed (e.g., 5 years).",
    icon: ShieldCheck,
  },
  {
    title: 'Payment schedule with milestones',
    description: "Never pay 100% upfront. A legitimate schedule ties payments to completed steps (e.g., Deposit, Measurement, Delivery, Final Inspection) to protect your leverage.",
    icon: CalendarClock,
  },
  {
    title: 'Notice of Right to Cancel included',
    description: "Florida law grants a 3-day 'cooling-off' period for home improvement contracts signed in your home. This mandatory disclosure protects you from high-pressure sales.",
    icon: Undo2,
  },
];

const redFlags: ChecklistItem[] = [
  {
    title: 'Vague "installation included" without details',
    description: "This catch-all phrase often hides sub-standard materials. It usually allows them to skip critical finish work like stucco repair, drywall patching, or painting.",
    icon: HelpCircle,
  },
  {
    title: 'No specific product models or specs',
    description: "If they won't name the window, you can't check its ratings. This is often a bait-and-switch tactic to swap in cheaper, lower-quality builder-grade windows later.",
    icon: PackageX,
  },
  {
    title: 'Pressure to sign same-day for "special pricing"',
    description: "Legitimate pricing is based on material costs, not timelines. 'Sign now or the price doubles' is a manipulation tactic designed to stop you from comparing quotes.",
    icon: Timer,
  },
  {
    title: 'Missing permit or inspection mentions',
    description: "Unpermitted work is illegal, uninsurable, and can force you to tear out the windows later. If they say 'you don't need a permit' for window replacement, run.",
    icon: AlertTriangle,
  },
  {
    title: 'Lump Sum Pricing (No Breakdown)',
    description: "Bundling everything into one big number ('$25,000 for everything') prevents you from seeing overcharged line items or verifying that you aren't paying for phantom services.",
    icon: Receipt,
  },
  {
    title: 'Hidden "Disposal" or "Admin" Fees',
    description: "Some quotes leave out disposal costs, hitting you with a surprise bill for hauling away your old windows. Ensure 'removal and disposal' is explicitly written.",
    icon: Trash2,
  },
  {
    title: 'Missing Design Pressure Ratings',
    description: "Design pressure determines if the window can actually withstand hurricane-force winds in your specific zone. Without this spec, you have no way to verify code compliance.",
    icon: Gauge,
  },
  {
    title: 'Vague Warranty Coverage (Labor vs. Product)',
    description: "Contractors often hide that their labor warranty is much shorter than the product warranty. Demand separate durations for product, labor, and seal failure coverage.",
    icon: ShieldAlert,
  },
];

interface QuoteSafetyChecklistProps {
  uploadRef?: RefObject<HTMLDivElement>;
}

export function QuoteSafetyChecklist({ uploadRef }: QuoteSafetyChecklistProps) {
  // Initialize with first red flag expanded by default
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => 
    new Set(['red-0'])
  );

  const handleScrollToUpload = () => {
    if (uploadRef?.current) {
      uploadRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleItem = (id: string, title: string, section: 'good' | 'red') => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      const isExpanding = !next.has(id);
      
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      
      // CRO: Track which items users are curious about
      if (isExpanding) {
        console.log(`📊 Checklist Expand: [${section}] "${title}"`);
        trackEvent('checklist_item_expand', {
          section: section,
          item_title: title,
          item_id: id,
        });
      }
      
      return next;
    });
  };

  const toggleAllItems = (section: 'good' | 'red', items: ChecklistItem[]) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      const allExpanded = items.every((_, idx) => next.has(`${section}-${idx}`));
      
      if (allExpanded) {
        items.forEach((_, idx) => next.delete(`${section}-${idx}`));
      } else {
        items.forEach((_, idx) => next.add(`${section}-${idx}`));
      }
      return next;
    });
  };

  const allGoodExpanded = checklistItems.every((_, idx) => 
    expandedItems.has(`good-${idx}`)
  );
  const allRedExpanded = redFlags.every((_, idx) => 
    expandedItems.has(`red-${idx}`)
  );

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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                What to Look For
              </h3>
              <button
                onClick={() => toggleAllItems('good', checklistItems)}
                className="text-xs text-slate-500 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {allGoodExpanded ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
            <div className="space-y-2">
              {checklistItems.map((item, idx) => {
                const itemId = `good-${idx}`;
                const isExpanded = expandedItems.has(itemId);
                const ItemIcon = item.icon;
                
                return (
                  <div
                    key={itemId}
                    className={cn(
                      "rounded-lg overflow-hidden",
                      "bg-white border border-emerald-200 shadow-sm",
                      "dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:shadow-none"
                    )}
                  >
                    <button
                      onClick={() => toggleItem(itemId, item.title, 'good')}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left",
                        "hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-colors"
                      )}
                      aria-expanded={isExpanded}
                    >
                      <ItemIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-300">
                        {item.title}
                      </span>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} />
                    </button>
                    
                    <div className={cn(
                      "grid transition-all duration-200",
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}>
                      <div className="overflow-hidden">
                        <div className={cn(
                          "px-3 pb-3 pt-2 border-t",
                          "bg-slate-50 border-emerald-100",
                          "dark:bg-zinc-900/50 dark:border-emerald-500/20"
                        )}>
                          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Red Flags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                Common Red Flags
              </h3>
              <button
                onClick={() => toggleAllItems('red', redFlags)}
                className="text-xs text-slate-500 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                {allRedExpanded ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
            <div className="space-y-2">
              {redFlags.map((item, idx) => {
                const itemId = `red-${idx}`;
                const isExpanded = expandedItems.has(itemId);
                const ItemIcon = item.icon;
                
                return (
                  <div
                    key={itemId}
                    className={cn(
                      "rounded-lg overflow-hidden",
                      "bg-white border border-rose-200 shadow-sm",
                      "dark:bg-rose-500/10 dark:border-rose-500/30 dark:shadow-none"
                    )}
                  >
                    <button
                      onClick={() => toggleItem(itemId, item.title, 'red')}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left",
                        "hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-colors"
                      )}
                      aria-expanded={isExpanded}
                    >
                      <ItemIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-300">
                        {item.title}
                      </span>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} />
                    </button>
                    
                    <div className={cn(
                      "grid transition-all duration-200",
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}>
                      <div className="overflow-hidden">
                        <div className={cn(
                          "px-3 pb-3 pt-2 border-t",
                          "bg-slate-50 border-rose-100",
                          "dark:bg-zinc-900/50 dark:border-rose-500/20"
                        )}>
                          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* CTA */}
            <div className="pt-4">
              <Button
                onClick={handleScrollToUpload}
                className={cn(
                  "w-full gap-2",
                  "bg-rose-600 text-white hover:bg-rose-700 border-0",
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
