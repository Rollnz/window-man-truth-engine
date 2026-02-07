import { ShieldCheck, Target, Zap, Scale, Eye, Users, BadgeCheck, DollarSign, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';
interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}
function ValueCard({
  icon,
  title,
  description,
  highlight
}: ValueCardProps) {
  return <div className={cn("p-6 rounded-xl border transition-all duration-300 hover:translate-y-[-4px]", highlight ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50" : "bg-card/50 border-border/50 hover:border-border")}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>{icon}</div>
      <h4 className="text-lg font-semibold text-foreground mb-2">{title}</h4><p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>;
}
export function WhoIsWindowManSection() {
  return <section className="py-20 md:py-32 relative bg-[hsl(var(--surface-1))]">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-12"><h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">You Shouldn't Need a Law Degree<span className="block mt-2 text-primary">to Buy Windows.</span></h2><p className="text-lg text-muted-foreground">The window industry runs on a knowledge gap. Contractors know the loopholes. Insurers know the exclusions.<span className="block mt-2 text-foreground font-medium">Homeowners just get the bill.</span></p><p className="text-xl font-semibold text-primary mt-4">Window Man exists to flip that script — and put the power back in your hands.</p></div>
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-card border border-border"><h3 className="text-xl font-semibold text-foreground mb-4">What You're Actually Looking At</h3><p className="text-muted-foreground leading-relaxed mb-4">When you receive a window estimate, you aren't just looking at a price.</p><p className="text-muted-foreground leading-relaxed mb-4">You're looking at a <span className="text-foreground font-medium">legal and technical document</span> designed to protect the company that wrote it — not you.</p><p className="text-muted-foreground leading-relaxed">Most homeowners assume quotes are straightforward: materials, labor, total cost. In reality, the real risk lives in what's missing, what's implied, and what's buried in fine print.</p></div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[hsl(var(--secondary)/0.1)] to-transparent border border-[hsl(var(--secondary)/0.2)] shadow-xl"><h3 className="text-xl font-semibold text-[hsl(var(--secondary))] mb-4">The Conflict of Interest</h3><div className="space-y-4"><div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-[hsl(var(--secondary))] mt-2 flex-shrink-0" /><p className="text-muted-foreground">Contractors are paid to <span className="text-foreground">sell installations</span>.</p></div><div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-[hsl(var(--secondary))] mt-2 flex-shrink-0" /><p className="text-muted-foreground">Insurers are paid to <span className="text-foreground">deny claims</span>.</p></div><div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-[hsl(var(--secondary))] mt-2 flex-shrink-0" /><p className="text-foreground font-medium">No one in the process is paid to protect you from blind spots.</p></div></div><p className="text-xl font-semibold text-foreground mt-6">That's the gap Window Man fills.</p></div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-10"><p className="text-sm font-medium text-primary mb-2">WHAT WINDOW MAN ACTUALLY IS</p><h3 className="text-2xl md:text-3xl font-bold text-foreground">Your Private Market Advocate</h3><p className="text-muted-foreground mt-4 max-w-2xl mx-auto">We use elite-level AI to stress-test window quotes against the same technical standards used by experienced inspectors, insurance adjusters, and seasoned industry professionals.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><ValueCard icon={<ShieldCheck className="w-6 h-6" />} title="Your Agent" description="We act as your agent in a technically hostile market, protecting your interests first." highlight /><ValueCard icon={<Scale className="w-6 h-6" />} title="Market Equalizer" description="A market equalizer in a $3.8B industry where knowledge has always meant power." highlight /><ValueCard icon={<Zap className="w-6 h-6" />} title="Unfair Advantage" description="Your unfair advantage when everything is on the line. You're no longer guessing — you're verifying." highlight /></div>
          <div className="mt-8 text-center"><p className="text-muted-foreground">We don't sell windows. We don't represent brands. We don't work for installers.</p><p className="text-xl font-semibold text-primary mt-2">We work for homeowners.</p></div>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="p-8 md:p-12 rounded-2xl bg-card border border-border">
            <div className="text-center mb-10"><p className="text-sm font-medium text-[hsl(var(--secondary))] mb-2">RADICAL TRANSPARENCY</p><h3 className="text-2xl md:text-3xl font-bold text-foreground">How Window Man Makes Money</h3><p className="text-muted-foreground mt-2">(Why this works in your favor)</p></div>
            <p className="text-center text-lg text-muted-foreground mb-10">Let's remove all ambiguity. The audit is <span className="text-foreground font-semibold">100% free. Period.</span><br />No credit card. No obligation. No upsell.</p>
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/20"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Eye className="w-5 h-5 text-primary" /></div><h4 className="text-lg font-semibold text-foreground">The Free Path</h4></div><p className="text-muted-foreground leading-relaxed">Get your audit. See the risks. Use the data to negotiate with your current contractor.<span className="block mt-2 text-foreground font-medium">It costs you $0, and we stay in your corner.</span></p></div>
              <div className="p-6 rounded-xl bg-[hsl(var(--secondary)/0.05)] border border-[hsl(var(--secondary)/0.2)]"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--secondary)/0.2)] flex items-center justify-center"><Zap className="w-5 h-5 text-[hsl(var(--secondary))]" /></div><h4 className="text-lg font-semibold text-foreground">The Power Move <span className="text-sm font-normal text-muted-foreground">(Optional)</span></h4></div><p className="text-muted-foreground leading-relaxed">If you choose, we'll take your red-flagged project specs — never your personal information — and run them through our vetted partner network. We force top-tier contractors to compete on the same scope, same materials, with better protections.</p></div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-[hsl(var(--secondary)/0.05)] border border-border mb-10"><h4 className="text-lg font-semibold text-foreground mb-4 text-center">How We Win</h4><p className="text-center text-muted-foreground leading-relaxed">If — and only if — a partner beats your best quote with better terms and you choose to switch,<span className="text-foreground font-medium"> the contractor pays us a finder's fee</span>.</p><div className="flex flex-wrap justify-center gap-6 mt-6"><div className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-primary" /><span className="text-sm text-foreground">You get a better deal</span></div><div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-[hsl(var(--secondary))]" /><span className="text-sm text-foreground">We get paid by the pro</span></div><div className="flex items-center gap-2"><Handshake className="w-5 h-5 text-amber-500" /><span className="text-sm text-foreground">The industry gets more honest</span></div></div></div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-[hsl(var(--secondary)/0.1)] border border-primary/20"><p className="text-lg text-muted-foreground mb-2">Your contractor makes more money when you know less.</p><p className="text-2xl font-bold text-foreground">Window Man only succeeds when you know <span className="text-primary">more</span>.</p><p className="text-lg text-[hsl(var(--secondary))] font-medium mt-2">That's why this works.</p></div>
          </div>
        </div>
      </div>
    </section>;
}