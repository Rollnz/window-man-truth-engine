// ═══════════════════════════════════════════════════════════════════════════
// PathSelector
// Step 0: "Do you have a quote?" fork question
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Lock, Shield, ArrowRight } from 'lucide-react';
import { PathSelectorProps, AuditPath } from '@/types/audit';
import { trackEvent, trackModalOpen } from '@/lib/gtm';
import { useProjectedQuotes } from '@/hooks/useProjectedQuotes';

/**
 * Path selector for the audit scanner modal.
 * Presents two equal-weight options:
 * - "Yes, I have a quote" → Orange gradient (Path A)
 * - "No, not yet" → Blue outline (Path B)
 */
export function PathSelector({ onSelectPath }: PathSelectorProps) {
  const { total } = useProjectedQuotes();

  // Track modal opened on mount
  useEffect(() => {
    trackModalOpen({ modalName: 'audit_scanner' });
  }, []);

  const handleSelectPath = (path: AuditPath) => {
    trackEvent('audit_path_selected', { path });
    onSelectPath(path);
  };

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      {/* Header */}
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Let's Get Started
        </h2>
        <p className="text-slate-400">
          Do you already have a window quote or estimate?
        </p>
      </div>

      {/* Path Buttons */}
      <div className="space-y-4">
        {/* Path A: Has Quote - Orange CTA */}
        <Button
          onClick={() => handleSelectPath('quote')}
          className="w-full group relative px-6 py-8 text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-900 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="block">Yes, I have a quote</span>
                <span className="block text-sm font-normal opacity-80">
                  Upload for instant AI analysis
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Button>

        {/* Path B: No Quote - Blue Outline */}
        <Button
          onClick={() => handleSelectPath('vault')}
          variant="outline"
          className="w-full group relative px-6 py-8 text-lg font-bold border-2 border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 text-white rounded-xl transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <span className="block">No, not yet</span>
                <span className="block text-sm font-normal text-slate-400">
                  Get free tools to negotiate better
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </Button>
      </div>

      {/* Trust Signal */}
      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Shield className="w-4 h-4 text-emerald-500" />
        <span>100% free • No signup required • Your data stays private</span>
      </div>

      {/* Social Proof */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <p className="text-xs text-slate-500 mb-2">Trusted by Florida homeowners</p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="text-center">
            <span className="block text-lg font-bold text-orange-400">{total.toLocaleString()}+</span>
            <span className="text-slate-500">Quotes scanned</span>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-center">
            <span className="block text-lg font-bold text-emerald-400">$4.2M+</span>
            <span className="text-slate-500">Savings found</span>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-center">
            <span className="block text-lg font-bold text-primary">94%</span>
            <span className="text-slate-500">Find issues</span>
          </div>
        </div>
      </div>
    </div>
  );
}
