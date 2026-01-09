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
    <section className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl border border-slate-300 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
        <h2 className="text-lg font-bold text-slate-900">Project Basics</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <FieldLabel label="Product Type" tooltip="Choose the type of opening you are pricing." />
          <select
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors outline-none"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. 33101"
              maxLength={5}
              value={state.zipCode}
              onChange={e => setState(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
            />
          </div>
          <div>
            <FieldLabel label="Wall Type" tooltip="Wood frame requires additional structural work." />
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
