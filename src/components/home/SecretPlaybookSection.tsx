import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldOff, FileQuestion, FileWarning, Calculator, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
interface RiskCardProps {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
}
function RiskCard({
  number,
  title,
  subtitle,
  description,
  icon,
  iconColor
}: RiskCardProps) {
  return <div className="group relative p-6 rounded-xl bg-card transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg border-2 border-primary">
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg">{number}</div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", iconColor)}>{icon}</div>
      <h4 className="text-lg font-semibold text-foreground mb-1">{title}</h4><p className="text-sm font-medium text-[hsl(var(--secondary))] mb-3">{subtitle}</p><p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>;
}
export function SecretPlaybookSection() {
  const risks = [{
    title: 'The Scope Gap',
    subtitle: 'The Hidden Back-Bill',
    description: "Our AI unearths what's quietly excluded — permits, debris removal, stucco or drywall repair — the \"missing middle\" that often becomes a $2,000+ surprise once work begins.",
    icon: <Calculator className="w-6 h-6 text-[hsl(var(--secondary))]" />,
    iconColor: "bg-[hsl(var(--secondary)/0.1)]"
  }, {
    title: 'Code-Compliance Traps',
    subtitle: 'The Insurance Killer',
    description: '"Impact-rated" is marketing language. Our AI verifies whether the Design Pressure actually meets the legal requirements for your exact zip code — the difference between passing inspection and losing coverage.',
    icon: <ShieldOff className="w-6 h-6 text-red-500" />,
    iconColor: "bg-red-500/10"
  }, {
    title: 'Paper Warranties',
    subtitle: 'The Man-in-a-Van Risk',
    description: "We expose labor exclusions and short warranty terms that vanish if the installer disappears. If something fails in year three, are you protected — or on your own?",
    icon: <FileQuestion className="w-6 h-6 text-amber-500" />,
    iconColor: "bg-amber-500/10"
  }, {
    title: 'Risk-Shifting Clauses',
    subtitle: 'The Bait-and-Switch',
    description: "We neutralize fine-print clauses that allow substitutions, delays, or cost increases without your consent.",
    icon: <FileWarning className="w-6 h-6 text-purple-500" />,
    iconColor: "bg-purple-500/10"
  }, {
    title: 'The Ignorance Tax',
    subtitle: 'Price Fairness',
    description: "We benchmark your quote against real local market data. Are you paying fair value — or a quiet 30% premium because no one expected you to check?",
    icon: <AlertTriangle className="w-6 h-6 text-primary" />,
    iconColor: "bg-primary/10"
  }];
  return <section className="py-20 md:py-32 relative bg-gradient-to-b from-[hsl(210,28%,96.8%)] to-[hsl(32,24%,97.2%)] overflow-hidden isolate pattern-dots">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[radial-gradient(circle,hsl(var(--secondary)/0.05)_0%,transparent_70%)]" /><div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16"><div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--secondary)/0.1)] border border-[hsl(var(--secondary)/0.2)] mb-6"><Sparkles className="w-4 h-4 text-[hsl(var(--secondary))]" /><span className="text-sm font-medium text-[hsl(var(--secondary))]">The AI Advantage</span></div><h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">The "Secret Playbook" Hidden<span className="block mt-2 text-[hsl(var(--secondary))]">Inside Your Quote</span></h2><p className="text-lg text-muted-foreground">Contractors don't usually lie — they just omit.<br />Our AI de-codes the silent risks that turn a good-looking estimate into a financial nightmare.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">{risks.map((risk, index) => <RiskCard key={risk.title} number={index + 1} title={risk.title} subtitle={risk.subtitle} description={risk.description} icon={risk.icon} iconColor={risk.iconColor} />)}</div>
        <div className="max-w-3xl mx-auto mb-12"><div className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-[hsl(var(--secondary)/0.05)] border border-primary/20"><h3 className="text-xl md:text-2xl font-bold text-foreground text-center mb-6">The Confidence Shift</h3><p className="text-lg text-muted-foreground text-center mb-4">With this report, you don't go back to a contractor asking questions.</p><p className="text-xl text-foreground font-semibold text-center mb-6">You go back with <span className="text-primary">answers</span>.</p><p className="text-lg text-muted-foreground text-center">You become the most informed person in the room — and the power dynamic changes instantly.</p><div className="mt-8 p-4 rounded-xl bg-background/50 border border-border/50"><p className="text-sm text-muted-foreground text-center italic">Individually, these are technicalities. <span className="text-foreground font-medium">Together, they are your leverage.</span></p></div></div></div>
        <div className="text-center"><Button asChild size="lg" variant="cta" className="group"><Link to="/sample-report">View a Real Sample AI Report<ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" /></Link></Button><p className="mt-3 text-sm text-muted-foreground">See exactly how this intelligence looks before you upload anything.</p></div>
      </div>
    </section>;
}