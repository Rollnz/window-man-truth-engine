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
    <section className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl border border-slate-300 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">2</div>
          <h2 className="text-lg font-bold text-slate-900">Select Base Grade</h2>
        </div>
        {state.basePrice > 0 && (
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
            Selected: {state.baseName}
          </span>
        )}
      </div>

      <div className="relative">
        {!state.zipCode && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg border border-dashed border-slate-300">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Info size={16} /> Enter Zip Code to unlock pricing
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[300px]">
            {/* Grid Header */}
            <div className="grid grid-cols-4 gap-2 mb-2 text-xs font-semibold text-slate-500 text-center uppercase tracking-wider">
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
                    <div className="text-xs font-bold text-slate-700 flex items-center pl-2">{frame}</div>
                    {rowPrices.map((price, glassIdx) => {
                      const isSelected = state.selectedFrameIndex === frameIdx && state.selectedGlassIndex === glassIdx;
                      const heatColor = getHeatmapColor(price, minPrice, maxPrice);
                      
                      return (
                        <button
                          key={`${frameIdx}-${glassIdx}`}
                          onClick={() => handleSelectCell(frameIdx, glassIdx, price, frame, CONFIG.glassTypes[glassIdx].name)}
                          className={`
                            relative py-3 px-1 rounded-lg text-sm transition-all duration-200 flex flex-col items-center justify-center gap-0.5 border
                            ${isSelected
                              ? 'border-blue-600 shadow-md scale-[1.05] z-10'
                              : 'border-transparent hover:border-slate-300 hover:scale-[1.02] z-0'
                            }
                          `}
                          style={{
                            backgroundColor: isSelected ? '#2563EB' : heatColor,
                            color: isSelected ? 'white' : '#0f172a',
                          }}
                        >
                          <span className="font-bold">
                            {state.isUnlocked ? formatCurrency(price) : '$' + Math.round(price/100) + '00'}
                          </span>
                          <span className="text-[10px] opacity-70">
                            /unit
                          </span>
                          {isSelected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />}
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
