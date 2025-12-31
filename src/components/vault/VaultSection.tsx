import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface VaultSectionProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  isEmpty?: boolean;
  emptyState?: {
    message: string;
    ctaText: string;
    ctaPath: string;
  };
}

export function VaultSection({ 
  title, 
  description, 
  icon, 
  children, 
  isEmpty, 
  emptyState 
}: VaultSectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isEmpty && emptyState ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              {icon}
            </div>
            <p className="text-muted-foreground mb-4">{emptyState.message}</p>
            <Button asChild>
              <Link to={emptyState.ctaPath}>
                {emptyState.ctaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
