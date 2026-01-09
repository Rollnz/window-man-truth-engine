// ============================================
// Quote Builder - AI Result Modal
// DOMPurify is lazy-loaded here to reduce main bundle size
// ============================================

import { X, Loader2, Sparkles } from "lucide-react";
import DOMPurify from 'dompurify';
import type { AiResultModalProps } from "@/types/quote-builder";

export const AiResultModal = ({ isOpen, onClose, title, content, isLoading }: AiResultModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 shadow-2xl rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative animate-in fade-in zoom-in duration-200 border border-slate-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10">
          <X size={24} />
        </button>
        
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
            {isLoading ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <Sparkles className="w-5 h-5 text-blue-600" />}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{isLoading ? "Thinking..." : title}</h3>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-slate-600">
               <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.replace(/\n/g, '<br />'), {
                 ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li', 'ol', 'span'],
               }) }} />
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
          <p className="text-xs text-slate-500 text-center">
            AI-generated content may vary. Use this information as a guide for your negotiations.
          </p>
        </div>
      </div>
    </div>
  );
};
