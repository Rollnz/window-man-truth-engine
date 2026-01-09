// ============================================
// Quote Builder - AI Quick Build Section
// ============================================

import { Wand2, Sparkles, Loader2 } from "lucide-react";

interface AiQuickBuildSectionProps {
  aiInputText: string;
  setAiInputText: (v: string) => void;
  isAiBuilding: boolean;
  handleQuickBuild: () => Promise<void>;
}

export const AiQuickBuildSection = ({ 
  aiInputText, 
  setAiInputText, 
  isAiBuilding, 
  handleQuickBuild 
}: AiQuickBuildSectionProps) => {
  return (
    <section className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl border border-slate-300 p-6 relative overflow-hidden group shadow-lg">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-16 h-16 text-blue-600" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-slate-900 font-bold">Quick Build with AI</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Describe your project in plain English (e.g. "3 bedrooms with 2 windows each and a sliding door").
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Type your project list here..."
            value={aiInputText}
            onChange={(e) => setAiInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickBuild()}
          />
          <button
            onClick={handleQuickBuild}
            disabled={isAiBuilding || !aiInputText.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 disabled:text-slate-400 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
          >
            {isAiBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Build"}
          </button>
        </div>
      </div>
    </section>
  );
};
