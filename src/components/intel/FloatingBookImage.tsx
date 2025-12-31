import { useState, useRef } from 'react';

interface FloatingBookImageProps {
  imageUrl: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  alt: string;
}

export function FloatingBookImage({ 
  imageUrl, 
  position = 'bottom-right',
  alt 
}: FloatingBookImageProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    'top-right': '-top-6 -right-6',
    'top-left': '-top-6 -left-6',
    'bottom-right': '-bottom-4 -right-4',
    'bottom-left': '-bottom-4 -left-4',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate tilt based on mouse position relative to center
    const tiltX = ((e.clientY - centerY) / (rect.height / 2)) * -15;
    const tiltY = ((e.clientX - centerX) / (rect.width / 2)) * 15;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <>
      {/* Desktop/Tablet: Floating position with parallax */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`
          absolute ${positionClasses[position]} z-20
          hidden sm:block
          w-24 md:w-28 lg:w-32
          animate-fade-in [animation-delay:300ms] opacity-0
        `}
        style={{ perspective: '500px' }}
      >
        <img 
          src={imageUrl} 
          alt={alt}
          className="w-full h-auto animate-glow-pulse"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x || tilt.y ? 1.1 : 1})`,
            transition: 'transform 0.15s ease-out',
          }}
        />
      </div>

      {/* Mobile: Hidden - book is now centered in ResourceCard */}
    </>
  );
}