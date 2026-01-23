// ============================================
// Quote Builder - Item Configurator (Step 3)
// ============================================

import { ArrowRight } from "lucide-react";
import { FieldLabel } from "./FieldLabel";
import { COLOR_OPTIONS, GRID_OPTIONS } from "@/utils/quoteCalculatorConstants";
import type { QuoteBuilderState, StyleOption, SizeOption } from "@/types/quote-builder";

interface ItemConfiguratorProps {
  state: QuoteBuilderState;
  styleValue: number;
  setStyleValue: (v: number) => void;
  sizeValue: number;
  setSizeValue: (v: number) => void;
  colorValue: number;
  setColorValue: (v: number) => void;
  gridValue: number;
  setGridValue: (v: number) => void;
  finishUpgrade: boolean;
  setFinishUpgrade: (v: boolean) => void;
  contingencyFund: boolean;
  setContingencyFund: (v: boolean) => void;
  roomName: string;
  setRoomName: (v: string) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  styleOptions: StyleOption[];
  sizeOptions: SizeOption[];
  addToCart: () => void;
}

export const ItemConfigurator = ({
  state,
  styleValue,
  setStyleValue,
  sizeValue,
  setSizeValue,
  colorValue,
  setColorValue,
  gridValue,
  setGridValue,
  finishUpgrade,
  setFinishUpgrade,
  contingencyFund,
  setContingencyFund,
  roomName,
  setRoomName,
  quantity,
  setQuantity,
  styleOptions,
  sizeOptions,
  addToCart
}: ItemConfiguratorProps) => {
  return (
    <section className={`bg-card rounded-xl border border-border p-6 h-full shadow-lg transition-all duration-300 ${state.basePrice === 0 ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">3</div>
        <h2 className="text-lg font-bold text-foreground">Customize Item</h2>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Style" tooltip="Operation type affects price." />
            <select
              className="w-full bg-input border border-border text-foreground rounded-lg p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
              value={styleValue} onChange={e => setStyleValue(Number(e.target.value))}
            >
              {styleOptions.map(opt => <option key={opt.key} value={opt.mult}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel label="Size" tooltip="Larger openings cost more." />
            <select
              className="w-full bg-input border border-border text-foreground rounded-lg p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
              value={sizeValue} onChange={e => setSizeValue(Number(e.target.value))}
            >
              {sizeOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Frame Color" tooltip="Standard white is cheapest." />
            <select
              className="w-full bg-input border border-border text-foreground rounded-lg p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
              value={colorValue} onChange={e => setColorValue(Number(e.target.value))}
            >
              {COLOR_OPTIONS.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel label="Grids" tooltip="Decorative bars between glass." />
            <select
              className="w-full bg-input border border-border text-foreground rounded-lg p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
              value={gridValue} onChange={e => setGridValue(Number(e.target.value))}
            >
              {GRID_OPTIONS.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-muted hover:border-border transition-all cursor-pointer group">
            <input type="checkbox" className="mt-1 w-4 h-4 text-primary rounded border-border focus:ring-ring" checked={finishUpgrade} onChange={e => setFinishUpgrade(e.target.checked)} />
            <div className="text-sm">
              <span className="font-semibold text-foreground group-hover:text-primary block transition-colors">Premium Finish (+$450)</span>
              <span className="text-muted-foreground text-xs">Stucco patch, paint & interior trim.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-muted hover:border-border transition-all cursor-pointer group">
            <input type="checkbox" className="mt-1 w-4 h-4 text-primary rounded border-border focus:ring-ring" checked={contingencyFund} onChange={e => setContingencyFund(e.target.checked)} />
            <div className="text-sm">
              <span className="font-semibold text-foreground group-hover:text-primary block transition-colors">Wood Rot Fund (+$200)</span>
              <span className="text-muted-foreground text-xs">Refundable if no damage found.</span>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="col-span-2">
            <FieldLabel label="Room Label" tooltip="E.g. Master Bedroom" />
            <input
              type="text"
              placeholder="e.g. Living Room"
              className="w-full bg-input border border-border text-foreground rounded-lg p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
              value={roomName} onChange={e => setRoomName(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel label="Qty" tooltip="Number of identical items" />
            <input
              type="number"
              min="1"
              className="w-full bg-input border border-border text-foreground rounded-lg p-2.5 text-sm text-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
              value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>

        <button
          onClick={addToCart}
          className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>Add to Estimate</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
};