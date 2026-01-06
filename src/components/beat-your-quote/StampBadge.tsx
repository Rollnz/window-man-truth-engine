interface StampBadgeProps {
  children: React.ReactNode;
  variant?: 'red' | 'cyan';
  className?: string;
}

export function StampBadge({ children, variant = 'red', className = '' }: StampBadgeProps) {
  const variantStyles = {
    red: 'border-red-500/60 bg-red-950/40 text-red-400',
    cyan: 'border-[#00D4FF]/60 bg-[#00D4FF]/10 text-[#00D4FF]'
  };

  return (
    <div 
      className={`
        inline-block px-4 py-2 border-2 
        transform -rotate-3
        ${variantStyles[variant]}
        ${className}
      `}
    >
      <span className="text-sm font-mono tracking-[0.2em] uppercase font-bold">
        {children}
      </span>
    </div>
  );
}
