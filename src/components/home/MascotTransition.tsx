import { useState, useEffect, useRef } from 'react';
import mascotImage from '@/assets/its-window-man.webp';

export const MascotTransition = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Show speech bubble after mascot animation completes
          setTimeout(() => setShowBubble(true), 800);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative py-12 md:py-16 overflow-hidden bg-background"
    >
      <div className="container mx-auto px-4 flex flex-col items-center">
        {/* Mascot with slide-up animation */}
        <div 
          className={`relative transition-all duration-700 ease-out ${
            isVisible 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-24 opacity-0'
          }`}
        >
          {/* Speech bubble */}
          <div 
            className={`absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full z-10 transition-all duration-500 ${
              showBubble 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-75'
            }`}
          >
            <div className="relative bg-card border border-border rounded-2xl px-6 py-3 shadow-lg">
              <p className="text-foreground font-semibold text-lg md:text-xl whitespace-nowrap">
                Sam Glass Here, Welcome!
              </p>
              {/* Speech bubble tail */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-border" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-card" />
              </div>
            </div>
          </div>

          {/* Mascot image - below fold, lazy loaded */}
          <img 
            src={mascotImage} 
            alt="Sam Glass - Its Window Man mascot" 
            className="w-48 md:w-64 lg:w-72 h-auto drop-shadow-2xl"
            loading="lazy"
            decoding="async"
            width={288}
            height={288}
          />
        </div>
      </div>
    </section>
  );
};
