import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'warning' | 'success';
  className?: string;
}

export function QuickActionCard({
  title,
  description,
  href,
  icon,
  badge,
  badgeVariant = 'default',
  className,
}: QuickActionCardProps) {
  return (
    <Link to={href}>
      <Card className={cn(
        'group cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {badge !== undefined && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    badgeVariant === 'default' && 'bg-muted text-muted-foreground',
                    badgeVariant === 'warning' && 'bg-amber-500/20 text-amber-600',
                    badgeVariant === 'success' && 'bg-green-500/20 text-green-600'
                  )}
                >
                  {badge}
                </span>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
