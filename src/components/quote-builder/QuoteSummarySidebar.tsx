// ============================================
// Quote Builder - Quote Summary Sidebar
// ============================================

import { 
  Shield, Info, X, Calendar, Phone, 
  Sparkles, Mail, MessageSquare, TrendingUp 
} from "lucide-react";
import { formatCurrency } from "@/utils/quoteCalculatorConstants";
import type { CartItem, QuoteBuilderState } from "@/types/quote-builder";

interface QuoteSummarySidebarProps {
  state: QuoteBuilderState;
  cart: CartItem[];
  subtotal: number;
  permitFee: number;
  grandTotal: number;
  removeFromCart: (id: number) => void;
  startGeneration: () => Promise<void>;
  handleAiAction: (action: string) => Promise<void>;
}

export const QuoteSummarySidebar = ({
  state,
  cart,
  subtotal,
  permitFee,
  grandTotal,
  removeFromCart,
  startGeneration,
  handleAiAction
}: QuoteSummarySidebarProps) => {
  return (
    <div className="sticky top-24 space-y-6">
      {/* Trust Report / Cart */}
      <section className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl shadow-lg border border-slate-300 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <h2 className="text-slate-700 font-bold text-sm tracking-wide uppercase flex items-center gap-2">
            <Shield size={16} className="text-blue-600" />
            Trust Report
          </h2>
          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">{cart.length} Items</span>
        </div>
        
        <div className="p-0">
          {cart.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
                <Info size={24} className="opacity-50" />
              </div>
              <p className="text-sm">Your estimate is empty.</p>
              <p className="text-xs mt-1">Configure items to see costs.</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors group relative">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-800 text-sm truncate pr-4">{item.name}</span>
                    <span className="font-mono text-sm text-blue-600 font-medium">
                      {state.isUnlocked ? formatCurrency(item.total) : '$-,--'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-1">{item.desc}</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider">
                    <span>Qty: {item.qty}</span>
                    <span>•</span>
                    <span>{item.details.split(',')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-3">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Materials & Labor</span>
            <span>{state.isUnlocked ? formatCurrency(subtotal) : '$-,--'}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">Permits (~2%) <Info size={10} /></span>
            <span>{state.isUnlocked ? formatCurrency(permitFee) : '$-,--'}</span>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
            <span className="text-sm font-bold text-slate-600">Total Estimate</span>
            <span className={`text-xl font-bold ${state.isUnlocked ? 'text-blue-600' : 'text-slate-400 blur-[4px]'}`}>
              {formatCurrency(grandTotal)}
            </span>
          </div>
          
          {!state.isUnlocked ? (
            <button
              onClick={startGeneration}
              disabled={cart.length === 0}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg shadow-md transition-all text-sm mt-2"
            >
              Unlock Price & Save
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button className="flex items-center justify-center gap-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded text-xs shadow-sm transition-colors">
                <Phone size={12} /> Call Now
              </button>
              <button className="flex items-center justify-center gap-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs shadow-sm transition-colors">
                <Calendar size={12} /> Book Site Visit
              </button>
            </div>
          )}
        </div>
      </section>

      {/* AI Tools */}
      <div className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl border border-slate-300 p-4 shadow-lg">
        <h3 className="text-slate-800 font-bold text-sm mb-3 flex items-center gap-2">
          <span><Sparkles className="w-4 h-4 text-blue-600" /></span>
          AI Assistant ✨
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAiAction("analyze")}
            className={`px-3 py-2 rounded text-xs font-semibold text-center transition-all border flex items-center justify-center gap-1 ${state.isUnlocked ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}
          >
            <Sparkles size={12} /> Analyze Quote {state.isUnlocked ? '' : '🔒'}
          </button>
          <button
            onClick={() => handleAiAction("email")}
            className={`px-3 py-2 rounded text-xs font-semibold text-center transition-all border flex items-center justify-center gap-1 ${state.isUnlocked ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}
          >
            <Mail size={12} /> Draft Email {state.isUnlocked ? '' : '🔒'}
          </button>
          <button
            onClick={() => handleAiAction("script")}
            className={`px-3 py-2 rounded text-xs font-semibold text-center transition-all border flex items-center justify-center gap-1 ${state.isUnlocked ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}
          >
            <MessageSquare size={12} /> Gotcha Script {state.isUnlocked ? '' : '🔒'}
          </button>
          <button
            onClick={() => handleAiAction("roi")}
            className={`px-3 py-2 rounded text-xs font-semibold text-center transition-all border flex items-center justify-center gap-1 ${state.isUnlocked ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}
          >
            <TrendingUp size={12} /> ROI Projector {state.isUnlocked ? '' : '🔒'}
          </button>
        </div>
      </div>
    </div>
  );
};
