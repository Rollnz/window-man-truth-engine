import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StickyCTAProps {
  onConsultation: () => void;
  isModalOpen: boolean;
}

export function StickyCTA({ onConsultation, isModalOpen }: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Only show on mobile and when not covered by modal
  if (!isMobile || !isVisible || isModalOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 animate-fade-in">
      <Button 
        onClick={onConsultation}
        variant="high-contrast"
        className="w-full py-6 text-base shadow-lg"
      >
        <Phone className="w-5 h-5 mr-2" />
        Open My Own Case File
      </Button>
    </div>
  );
}
