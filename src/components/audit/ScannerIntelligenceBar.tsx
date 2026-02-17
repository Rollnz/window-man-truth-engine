import { ShieldCheck, Calculator, FileWarning, Clock } from 'lucide-react';

interface IntelligenceBadge {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const INTELLIGENCE_BADGES: IntelligenceBadge[] = [
{
  icon: <ShieldCheck className="w-6 h-6" />,
  title: 'HVHZ Compliance Check',
  description: 'Verifying Florida High-Velocity Hurricane Zone ratings'
},
{
  icon: <Calculator className="w-6 h-6" />,
  title: 'Labor/Material Split',
  description: "Uncovering hidden markups in 'bundled' line items"
},
{
  icon: <FileWarning className="w-6 h-6" />,
  title: 'Contract Trap Detection',
  description: "Scanning for 'Subject to Remeasure' and price-escalation clauses"
},
{
  icon: <Clock className="w-6 h-6" />,
  title: 'Warranty Gap Analysis',
  description: "Identifying hidden labor exclusions in 'Lifetime' promises"
}];


function IntelligenceCard({ badge }: {badge: IntelligenceBadge;}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/20 bg-[#193258]">
      <div className="text-orange-500 flex-shrink-0 mt-0.5">
        {badge.icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white mb-1">
          {badge.title}
        </h3>
        <p className="text-xs text-[#efefef] leading-relaxed">
          {badge.description}
        </p>
      </div>
    </div>);

}

export function ScannerIntelligenceBar() {
  return (
    <section className="relative bg-slate-900/80 backdrop-blur-sm border-y border-slate-800/50 py-6 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-orange-500/5" />
      
      <div className="container relative px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INTELLIGENCE_BADGES.map((badge) =>
          <IntelligenceCard key={badge.title} badge={badge} />
          )}
        </div>
      </div>

      {/* Bottom highlight line */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>
    </section>);

}