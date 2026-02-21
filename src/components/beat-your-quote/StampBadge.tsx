interface StampBadgeProps {
  children: React.ReactNode;
  variant?: 'red' | 'cyan';
  className?: string;
}

export function StampBadge({ children, variant = 'red', className = '' }: StampBadgeProps) {
  const variantStyles = {
    red: 'border-red-500/60 bg-red-950/40 text-red-400',
    cyan: 'border-tools-truth-engine/60 bg-tools-truth-engine/10 text-tools-truth-engine'
  };

  return (
    <div
      className={`
        inline-block px-4 py-2 border-2
        transform -rotate-3
        ${variantStyles[variant]}
        ${className}
      `}>

      <span className="text-sm font-mono tracking-declassified uppercase font-bold text-sidebar-primary">
        {children}
      </span>
    </div>);

}