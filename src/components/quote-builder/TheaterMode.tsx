// ============================================
// Quote Builder - Theater Mode (Loading Overlay)
// ============================================

import { Loader2 } from "lucide-react";
import type { TheaterModeProps } from "@/types/quote-builder";

export const TheaterMode = ({ isActive, message, subtext }: TheaterModeProps) => {
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="text-center p-8 relative">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6 relative z-10" />
        <div className="text-2xl font-bold text-slate-900 mb-2 relative z-10">{message}</div>
        <div className="text-slate-500 text-lg relative z-10">{subtext}</div>
      </div>
    </div>
  );
};
