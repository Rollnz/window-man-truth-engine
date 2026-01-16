import { cn } from '@/lib/utils';

interface LeadAvatarProps {
  firstName: string | null;
  lastName: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LeadAvatar({ firstName, lastName, size = 'md', className }: LeadAvatarProps) {
  const getInitials = () => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {getInitials()}
    </div>
  );
}
