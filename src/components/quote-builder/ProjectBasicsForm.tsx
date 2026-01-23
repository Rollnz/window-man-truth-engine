// ============================================
// Quote Builder - Project Basics Form (Step 1)
// ============================================

import { FieldLabel } from "./FieldLabel";
import { WALL_OPTIONS, CONFIG } from "@/utils/quoteCalculatorConstants";
import type { QuoteBuilderState, ProductType } from "@/types/quote-builder";

interface ProjectBasicsFormProps {
  state: QuoteBuilderState;
  setState: React.Dispatch<React.SetStateAction<QuoteBuilderState>>;
  setStyleValue: (v: number) => void;
}

export const ProjectBasicsForm = ({ state, setState, setStyleValue }: ProjectBasicsFormProps) => {
  return (
    <section className="bg-card rounded-xl border border-border p-6 shadow-lg transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">1</div>
        <h2 className="text-lg font-bold text-foreground">Project Basics</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <FieldLabel label="Product Type" tooltip="Choose the type of opening you are pricing." />
          <select
            className="w-full bg-input border border-border text-foreground text-sm rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background block p-3 transition-colors outline-none"
            value={state.productType}
            onChange={e => {
              const nextProduct = e.target.value as ProductType;
              setState(prev => ({ 
                ...prev, 
                productType: nextProduct, 
                basePrice: 0, 
                baseName: "", 
                selectedFrameIndex: -1, 
                selectedGlassIndex: -1 
              }));
              setStyleValue(1.0);
            }}
          >
            <option value="window">Impact Windows (Standard)</option>
            <option value="slider">Sliding Glass Doors</option>
            <option value="french">French / Swing Doors</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Zip Code" tooltip="Required for wind-load calculation." />
            <input
              type="tel"
              className="w-full bg-input border border-border rounded-lg p-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none transition-colors"
              placeholder="e.g. 33101"
              maxLength={5}
              value={state.zipCode}
              onChange={e => setState(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
            />
          </div>
          <div>
            <FieldLabel label="Wall Type" tooltip="Wood frame requires additional structural work." />
            <select
              className="w-full bg-input border border-border rounded-lg p-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none transition-colors"
              value={state.wallType}
              onChange={e => setState(prev => ({ ...prev, wallType: Number(e.target.value) }))}
            >
              {WALL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
};