// ============================================
// Quote Builder - Hero Section Component
// ============================================

import { ArrowDown } from "lucide-react";
export const QuoteBuilderHero = () => {
  const scrollToCalculator = () => {
    const calculator = document.getElementById("quote-calculator");
    if (calculator) {
      calculator.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  return <section className="relative w-full min-h-[50vh] flex flex-col items-center justify-center bg-white overflow-hidden border-b border-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white" />
      
      <div className="relative z-10 container px-4 mx-auto text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Stop Guessing. <br className="hidden md:block" />
            <span className="text-blue-600">Start Building.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Create a highly transparent impact window cost estimate in minutes. No sales calls, no hidden fees—just real Florida market data.
          </p>
        </div>

        <button onClick={scrollToCalculator} className="group relative inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-orange-200">
          Start My Estimate
          <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
        </button>
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-multiply" />
    </section>;
};