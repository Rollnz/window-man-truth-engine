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
    <section className="bg-card rounded-xl border border-border p-6 relative overflow-hidden group shadow-lg transition-colors duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-16 h-16 text-primary" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-5 h-5 text-primary" />
          <h3 className="text-foreground font-bold">Quick Build with AI</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Describe your project in plain English (e.g. "3 bedrooms with 2 windows each and a sliding door").
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none transition-all"
            placeholder="Type your project list here..."
            value={aiInputText}
            onChange={(e) => setAiInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickBuild()}
          />
          <button
            onClick={handleQuickBuild}
            disabled={isAiBuilding || !aiInputText.trim()}
            className="bg-secondary hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground text-secondary-foreground px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
          >
            {isAiBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Build"}
          </button>
        </div>
      </div>
    </section>
  );
};