import { AlertTriangle } from 'lucide-react';

interface BloatCardProps {
  title: string;
  percentage: number;
  amount: number;
  description: string;
  isVisible: boolean;
  isDissolving?: boolean;
  delay?: number;
}

export function BloatCard({ title, percentage, amount, description, isVisible, isDissolving = false, delay = 0 }: BloatCardProps) {
  // Three states: hidden -> visible -> dissolved
  const getStateClasses = () => {
    if (isDissolving) {
      return 'opacity-0 scale-95 blur-sm translate-y-0 pointer-events-none';
    }
    if (isVisible) {
      return 'opacity-100 translate-y-0 scale-100 blur-0';
    }
    return 'opacity-0 translate-y-8 scale-100 blur-0 pointer-events-none';
  };

  return (
    <div 
      className={`
        relative p-6 rounded-lg border-2 border-red-500/60 bg-red-950/20
        transition-all ease-out
        ${isDissolving ? 'duration-600' : 'duration-700'}
        ${getStateClasses()}
      `}
      style={{ transitionDelay: isDissolving ? '0ms' : `${delay}ms` }}
    >
      {/* Warning Icon */}
      <AlertTriangle className="absolute top-4 right-4 w-6 h-6 text-red-400" />
      
      {/* Title with Percentage */}
      <div className="flex items-baseline gap-3 mb-2">
        <h4 className="text-lg font-bold text-red-400 uppercase tracking-wide font-mono">
          {title}
        </h4>
        <span className="text-sm text-red-300/70">({percentage}%)</span>
      </div>
      
      {/* Amount */}
      <div className="text-3xl font-bold text-white mb-3 font-mono">
        ${amount.toLocaleString()}
      </div>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed pr-8">
        {description}
      </p>
    </div>
  );
}
