import { CheckCircle } from 'lucide-react';

interface RemainsBreakdownProps {
  materials: number;
  labor: number;
  permit: number;
  realPrice: number;
  totalBloat: number;
  bloatPercentage: number;
  isVisible: boolean;
}

export function RemainsBreakdown({ 
  materials, 
  labor, 
  permit, 
  realPrice, 
  totalBloat,
  bloatPercentage,
  isVisible 
}: RemainsBreakdownProps) {
  return (
    <div className={`
      space-y-8 transition-all duration-700
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
    `}>
      {/* What Remains Card */}
      <div className="relative p-6 rounded-lg border-2 border-green-500/60 bg-green-950/20">
        {/* Verified Stamp */}
        <div className="absolute -top-3 -right-2 px-3 py-1 bg-green-500 text-black text-xs font-bold 
                        uppercase tracking-wider rounded transform rotate-3">
          VERIFIED
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <h4 className="text-lg font-bold text-green-400 uppercase tracking-wide font-mono">
            What Remains
          </h4>
        </div>
        
        {/* Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-white">
            <span>Materials</span>
            <span className="font-mono">${materials.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>Labor</span>
            <span className="font-mono">${labor.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>Permit</span>
            <span className="font-mono">${permit.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-green-500/30 my-4" />
        
        {/* Real Price */}
        <div className="flex justify-between items-baseline">
          <span className="text-green-400 font-medium">Your Real Price</span>
          <span className="text-3xl font-bold text-green-400 font-mono">
            ${realPrice.toLocaleString()}
          </span>
        </div>
        
        {/* Tagline */}
        <p className="text-center text-sm text-white/90 italic mt-4">
          "That's it. That's what windows actually cost."
        </p>
      </div>
      
      {/* Total Bloat Eliminated Summary */}
      <div className="p-6 rounded-lg border border-tools-truth-engine/30 bg-tools-truth-engine/5 text-center">
        <div className="text-sm text-white mb-2">Total Bloat Eliminated</div>
        <div className="text-4xl font-bold text-tools-truth-engine font-mono mb-2">
          ${totalBloat.toLocaleString()}
        </div>
        <p className="text-sm text-white">
          That's <span className="text-tools-truth-engine font-medium">{bloatPercentage}%</span> of your quote going to people who never touch a window.
        </p>
      </div>
    </div>
  );
}
