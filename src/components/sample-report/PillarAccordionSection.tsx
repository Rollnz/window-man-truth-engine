import { useState } from 'react';
import { ShieldCheck, FileText, DollarSign, ScrollText, Award, ChevronDown, AlertTriangle, MessageSquare } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { useSectionTracking } from '@/hooks/useSectionTracking';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';

interface PillarData { id: string; name: string; score: number; icon: typeof ShieldCheck; checks: string[]; hiddenRisk: string; financialConsequence: string; whatToAsk: string; }

const pillarData: PillarData[] = [
  { id: 'safety-code', name: 'Safety & Code Match', score: 78, icon: ShieldCheck, checks: ['Design Pressure (DP) rating verified for zip code', 'Miami-Dade NOA or Florida Product Approval confirmed', 'Large Missile Impact certification present', 'Installation method matches code requirements'], hiddenRisk: "If DP rating doesn't match your wind zone, insurance claims can be denied even after a legitimate storm event.", financialConsequence: '$5,000 - $25,000+ in uninsured damage or full replacement', whatToAsk: '"Can you provide the NOA number and confirm the DP rating meets code for my specific zip code?"' },
  { id: 'install-clarity', name: 'Install & Scope Clarity', score: 42, icon: FileText, checks: ['Permits explicitly included or excluded', 'Debris removal scope defined', 'Stucco/drywall repair after installation', 'Trim and caulking specifications'], hiddenRisk: 'Missing scope items become change orders after the deposit. "We didn\'t include permits" is a $1,500 surprise.', financialConsequence: '$1,500 - $4,000 in unexpected charges', whatToAsk: '"Is everything in this quote truly all-inclusive? What happens if we need stucco repair or permits aren\'t included?"' },
  { id: 'price-fairness', name: 'Price Fairness', score: 39, icon: DollarSign, checks: ['Line item pricing vs. lump sum', 'Per-window cost vs. market rates', 'Labor markup reasonableness', 'Material specification matching price tier'], hiddenRisk: 'Lump-sum pricing hides inflated margins. You may be paying 30% more than neighbors for identical work.', financialConsequence: '$3,000 - $8,000+ in overpayment', whatToAsk: '"Can you break this down by window? What\'s the per-unit cost for materials vs. labor?"' },
  { id: 'fine-print', name: 'Fine Print Transparency', score: 55, icon: ScrollText, checks: ['Material substitution clauses', 'Schedule/delay liability', 'Payment milestone fairness', 'Cancellation terms'], hiddenRisk: '"Equivalent materials" clauses allow cheaper substitutions without consent. Your premium windows become value-tier.', financialConsequence: '$2,000 - $5,000 in product value loss', whatToAsk: '"Does this contract allow material substitutions? What are my options if there\'s a delay?"' },
  { id: 'warranty-value', name: 'Warranty Value', score: 71, icon: Award, checks: ['Manufacturer warranty length and coverage', 'Labor warranty duration', 'Warranty transferability', 'Exclusions and conditions'], hiddenRisk: 'A 1-year labor warranty means year-two leaks are your problem. Small installers may not exist in 5 years.', financialConsequence: '$1,000 - $3,000 in out-of-pocket repairs', whatToAsk: '"What happens if there\'s a seal failure in year three? Will you still be in business and honor this warranty?"' },
];

function PillarAccordion({ pillar, isOpen, onToggle }: { pillar: PillarData; isOpen: boolean; onToggle: () => void }) {
  const Icon = pillar.icon;
  const scoreColor = pillar.score >= 70 ? 'text-primary' : pillar.score >= 50 ? 'text-amber-500' : 'text-[hsl(var(--secondary))]';
  const scoreBgColor = pillar.score >= 70 ? 'bg-primary/10' : pillar.score >= 50 ? 'bg-amber-500/10' : 'bg-[hsl(var(--secondary)/0.1)]';

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-lg shadow-black/5 dark:shadow-black/15 hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 md:gap-4">
          <div className={`w-10 h-10 rounded-lg ${scoreBgColor} flex items-center justify-center`}><Icon className={`w-5 h-5 ${scoreColor}`} /></div>
          <div className="text-left"><h3 className="font-semibold text-foreground">{pillar.name}</h3><p className={`text-sm font-medium ${scoreColor}`}>{pillar.score}/100</p></div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[600px]' : 'max-h-0'}`}>
        <div className={`p-4 md:p-6 pt-0 space-y-6 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div><h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />What We Check</h4><ul className="space-y-2">{pillar.checks.map((check, i) => (<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />{check}</li>))}</ul></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[hsl(var(--secondary)/0.05)] border border-[hsl(var(--secondary)/0.2)]"><h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[hsl(var(--secondary))]" />Hidden Risk</h4><p className="text-sm text-muted-foreground">{pillar.hiddenRisk}</p><p className="text-sm font-semibold text-[hsl(var(--secondary))] mt-2">Potential Cost: {pillar.financialConsequence}</p></div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20"><h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" />What to Ask</h4><p className="text-sm text-muted-foreground italic">{pillar.whatToAsk}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PillarAccordionSection() {
  const sectionRef = useSectionTracking('pillar_accordion');
  const [openPillar, setOpenPillar] = useState<string | null>('safety-code');
  const handleToggle = (pillarId: string) => { const newState = openPillar === pillarId ? null : pillarId; setOpenPillar(newState); if (newState) trackEvent('sample_report_accordion_expand', { pillar_id: pillarId }); };

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-[hsl(var(--surface-1))]">
      <div className="container px-4">
        <AnimateOnScroll duration={600}>
          <div className="max-w-3xl mx-auto text-center mb-12"><h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">Deep Dive: The 5 Pillars</h2><p className="text-lg text-muted-foreground">Each pillar represents a critical area where quotes hide risk. Expand to see what we check, the hidden dangers, and exactly what to ask your contractor.</p></div>
        </AnimateOnScroll>
        <div className="max-w-3xl mx-auto space-y-4">
          {pillarData.map((pillar, index) => (
            <AnimateOnScroll key={pillar.id} delay={index * 120} duration={700}>
              <PillarAccordion pillar={pillar} isOpen={openPillar === pillar.id} onToggle={() => handleToggle(pillar.id)} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
