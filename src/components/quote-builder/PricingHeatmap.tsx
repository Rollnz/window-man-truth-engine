// ============================================
// Quote Builder - Pricing Heatmap (Step 2)
// ============================================

import { Info } from "lucide-react";
import { CONFIG, getHeatmapColor, formatCurrency } from "@/utils/quoteCalculatorConstants";
import type { QuoteBuilderState } from "@/types/quote-builder";

interface PricingHeatmapProps {
  state: QuoteBuilderState;
  currentPrices: number[][];
  handleSelectCell: (frameIdx: number, glassIdx: number, price: number, frameName: string, glassName: string) => void;
}

export const PricingHeatmap = ({ state, currentPrices, handleSelectCell }: PricingHeatmapProps) => {
  return (
    <section className="bg-card rounded-xl border border-border p-6 shadow-lg transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">2</div>
          <h2 className="text-lg font-bold text-foreground">Select Base Grade</h2>
        </div>
        {state.basePrice > 0 && (
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
            Selected: {state.baseName}
          </span>
        )}
      </div>

      <div className="relative">
        {!state.zipCode && (
          <div className="absolute inset-0 bg-card/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg border border-dashed border-border">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Info size={16} /> Enter Zip Code to unlock pricing
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[300px]">
            {/* Grid Header */}
            <div className="grid grid-cols-4 gap-2 mb-2 text-xs font-semibold text-muted-foreground text-center uppercase tracking-wider">
              <div className="text-left pl-2">Material</div>
              {CONFIG.glassTypes.map((g, i) => <div key={i}>{g.name}</div>)}
            </div>
            
            {/* Grid Rows */}
            <div className="space-y-2">
              {CONFIG.frameMaterials.map((frame, frameIdx) => {
                const rowPrices = currentPrices[frameIdx];
                const minPrice = Math.min(...rowPrices);
                const maxPrice = Math.max(...rowPrices);

                return (
                  <div key={frame} className="grid grid-cols-4 gap-2 items-stretch">
                    <div className="text-xs font-bold text-foreground flex items-center pl-2">{frame}</div>
                    {rowPrices.map((price, glassIdx) => {
                      const isSelected = state.selectedFrameIndex === frameIdx && state.selectedGlassIndex === glassIdx;
                      const heatColor = getHeatmapColor(price, minPrice, maxPrice);
                      
                      return (
                        <button
                          key={`${frameIdx}-${glassIdx}`}
                          onClick={() => handleSelectCell(frameIdx, glassIdx, price, frame, CONFIG.glassTypes[glassIdx].name)}
                          aria-pressed={isSelected}
                          aria-label={`Select ${frame} frame with ${CONFIG.glassTypes[glassIdx].name} glass at ${formatCurrency(price)}`}
                          className={`
                            relative py-3 px-1 rounded-lg text-sm transition-all duration-200 flex flex-col items-center justify-center gap-0.5 border
                            ${isSelected
                              ? 'border-primary shadow-md scale-[1.05] z-10'
                              : 'border-transparent hover:border-border hover:scale-[1.02] z-0'
                            }
                          `}
                          style={{
                            backgroundColor: isSelected ? 'hsl(var(--primary))' : heatColor,
                            color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                          }}
                        >
                          <span className="font-bold">
                            {state.isUnlocked ? formatCurrency(price) : '$' + Math.round(price/100) + '00'}
                          </span>
                          <span className="text-[10px] opacity-70">
                            /unit
                          </span>
                          {isSelected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-background" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};