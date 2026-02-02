import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  TrendingDown, 
  Shield, 
  Handshake,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function BeatOrValidateSection() {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container relative px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge 
            variant="outline" 
            className="mb-6 px-4 py-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            The No-Lose Proposition
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            We Don't Just Grade the Homework.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              We Fix the Grade.
            </span>
          </h2>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Every scan ends with you winning. Period.
          </p>
        </div>

        {/* Fork in the Road */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          
          {/* Path A: The Validator */}
          <Card className="relative bg-gradient-to-br from-emerald-950/50 to-slate-900/50 border-emerald-500/20 p-8 overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full" />
            
            <div className="relative">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>

              {/* Badge */}
              <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Scenario A
              </Badge>

              <h3 className="text-2xl font-bold text-white mb-3">
                The Validator
              </h3>

              <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                Your quote is solid. We give you a{' '}
                <span className="text-emerald-400 font-semibold">"Verified Fair"</span> badge.
                Sign with confidence knowing you aren't being gouged.
              </p>

              <ul className="space-y-3">
                {[
                  'Independent verification you can trust',
                  'Peace of mind before signing',
                  'Proof to show skeptical family members',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Result badge */}
              <div className="mt-8 pt-6 border-t border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-emerald-500" />
                  <span className="text-emerald-400 font-semibold">You win: Certainty</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Path B: The Negotiator */}
          <Card className="relative bg-gradient-to-br from-cyan-950/50 to-slate-900/50 border-cyan-500/20 p-8 overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full" />
            
            <div className="relative">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/25 group-hover:scale-110 transition-transform">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>

              {/* Badge */}
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                Scenario B
              </Badge>

              <h3 className="text-2xl font-bold text-white mb-3">
                The Negotiator
              </h3>

              <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                We find fluff. We don't just tell you—
                <span className="text-cyan-400 font-semibold">we fight it</span>.
                We use the data to negotiate a lower price or offer a superior alternative.
              </p>

              <ul className="space-y-3">
                {[
                  'AI-generated negotiation scripts',
                  'Line-by-line price breakdown',
                  'Better offer from our contractor network',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Result badge */}
              <div className="mt-8 pt-6 border-t border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <Handshake className="w-6 h-6 text-cyan-500" />
                  <span className="text-cyan-400 font-semibold">You win: Savings</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Center connector visual */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="w-20 h-20 bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center shadow-xl">
            <span className="text-2xl font-bold text-white">OR</span>
          </div>
        </div>

        {/* Bottom Message */}
        <div className="text-center">
          <Card className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-6 bg-slate-900/80 border-slate-700/50 backdrop-blur-sm">
            <div className="text-left">
              <p className="text-white font-semibold text-lg">
                Either way, you leave with certainty.
              </p>
              <p className="text-slate-400">
                Cost to you: <span className="text-emerald-400 font-bold">$0.00</span>
              </p>
            </div>
            <ArrowRight className="w-6 h-6 text-cyan-400 hidden sm:block" />
            <Badge className="bg-emerald-500 text-white border-0 px-4 py-2 text-sm">
              100% Free Forever
            </Badge>
          </Card>
        </div>
      </div>
    </section>
  );
}
