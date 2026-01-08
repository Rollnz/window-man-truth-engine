import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingEmailButtonProps {
  onClick: () => void;
}

export function FloatingEmailButton({ onClick }: FloatingEmailButtonProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = pageHeight - scrollPosition;
      
      // Hide when within 200px of the bottom
      setIsVisible(distanceFromBottom > 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
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
