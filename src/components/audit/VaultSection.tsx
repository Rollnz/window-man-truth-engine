import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Shield,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Download,
  Calculator,
  MessageSquare,
  Smartphone,
  KeyRound,
  Fingerprint,
} from 'lucide-react';

const VAULT_LOOT = [
  { icon: FileText, title: 'AI Quote History', description: 'Your audits are encrypted and stored here. Never re-upload the same quote twice.', badge: 'Encrypted', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { icon: Download, title: 'Kitchen Table Defense Kit', description: 'Downloadable PDF: How to survive high-pressure sales pitches from pushy contractors.', badge: 'PDF Guide', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { icon: Calculator, title: 'Fair Price Calculator', description: 'Real-time market rates for your specific zip code. Know the fair price before you negotiate.', badge: 'Live Data', badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { icon: MessageSquare, title: 'Negotiation Scripts', description: 'Exactly what to say to drop a quote by 15%. Word-for-word scripts that work.', badge: '$497 Value', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
];

export function VaultSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % VAULT_LOOT.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-20 md:py-28 bg-slate-950 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-cyan-500/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-500/50 animate-pulse" />
      
      {/* Vault background image */}
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: 'url(/images/audit/vault-bg.png)', backgroundSize: 'contain', backgroundPosition: 'center right', backgroundRepeat: 'no-repeat' }}
      />

      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      <div className="container relative px-4 mx-auto max-w-7xl">
        <div className="flex justify-center mb-8">
          <Badge className="bg-slate-800/80 text-cyan-400 border-cyan-500/30 px-4 py-2">
            <Lock className="w-4 h-4 mr-2" />
            Secure Access Required
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: Value Prop */}
          <div className={cn("transition-all duration-700", isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8")}>
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
              <div className="relative w-16 h-16 bg-slate-900 border-2 border-cyan-500/50 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
              Your Private{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400">WindowMan Vault</span>
            </h2>

            <p className="text-lg md:text-xl text-slate-300 mb-6 leading-relaxed">
              This isn't a dashboard. It's your <span className="text-cyan-400 font-semibold">Digital Fortress</span> for sensitive financial data. Your AI Audits, negotiation scripts, and market intelligence — encrypted and ready when you need them.
            </p>

            <p className="text-slate-400 mb-8">
              The average window replacement sales cycle is <span className="text-white font-semibold">1-3 months</span>. Your Vault keeps everything organized so you can make the right decision on your timeline — not theirs.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Your Data Never Shared</span>
              </div>
            </div>

            <div className="space-y-4">
              <Link to="/vault">
                <Button size="lg" className="group relative bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300">
                  <KeyRound className="w-5 h-5 mr-3" />
                  Claim Your Vault Access
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 rounded-full px-4 py-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">SMS Verification Required</span>
                </div>
                <span className="text-xs text-slate-500">For your security</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Loot Grid */}
          <div className={cn("transition-all duration-700 delay-200", isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8")}>
            <Card className="relative bg-slate-900/80 border-cyan-500/30 p-6 md:p-8 overflow-hidden">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Vault Inventory</h3>
                    <p className="text-xs text-slate-500">Your Arsenal Awaits</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">4 Items</Badge>
              </div>

              <div className="space-y-4">
                {VAULT_LOOT.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pulseIndex === index;
                  
                  return (
                    <div key={index} className={cn("relative group p-4 rounded-xl border transition-all duration-500", isActive ? "bg-slate-800/80 border-cyan-500/50 shadow-lg shadow-cyan-500/10" : "bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50")}>
                      {index < VAULT_LOOT.length - 1 && (
                        <div className={cn("absolute left-7 top-full w-0.5 h-4 transition-colors duration-500", isActive ? "bg-cyan-500/50" : "bg-slate-700/50")} />
                      )}

                      <div className="flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500", isActive ? "bg-cyan-500/20 border border-cyan-500/50" : "bg-slate-700/50 border border-slate-600/50")}>
                          <Icon className={cn("w-5 h-5 transition-colors duration-500", isActive ? "text-cyan-400" : "text-slate-400")} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                            <Badge className={cn("text-[10px] px-2 py-0", item.badgeColor)}>{item.badge}</Badge>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
                        </div>

                        <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Free forever. No credit card.</span>
                  </div>
                  <div className="text-xs text-slate-500">2,847 users this week</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-slate-900/80 border border-slate-700/50 rounded-full px-6 py-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <p className="text-sm text-slate-400">
              <span className="text-amber-400 font-semibold">Already scanned a quote?</span>{' '}
              Your results are waiting in the Vault. Don't lose them.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </section>
  );
}
