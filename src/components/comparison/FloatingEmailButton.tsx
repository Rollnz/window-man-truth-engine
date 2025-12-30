import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingEmailButtonProps {
  onClick: () => void;
}

export function FloatingEmailButton({ onClick }: FloatingEmailButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
      <Button
        onClick={onClick}
        size="lg"
        className="glow-sm shadow-lg"
      >
        <Mail className="w-4 h-4 mr-2" />
        Email Me This Comparison
      </Button>
    </div>
  );
}
