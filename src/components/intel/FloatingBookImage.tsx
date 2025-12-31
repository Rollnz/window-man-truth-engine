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
  const [shinePosition, setShinePosition] = useState(50);
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
    
    // Calculate shine position (0-100 based on mouse X position)
    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
    
    setTilt({ x: tiltX, y: tiltY });
    setShinePosition(shineX);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setShinePosition(50);
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
        <div 
          className="relative"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x || tilt.y ? 1.1 : 1})`,
            boxShadow: tilt.x || tilt.y 
              ? `${-tilt.y * 0.5}px ${tilt.x * 0.5}px 15px rgba(0,0,0,0.3), ${-tilt.y * 0.3}px ${tilt.x * 0.3}px 30px rgba(0,0,0,0.2)`
              : '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
            borderRadius: '4px',
          }}
        >
          <img 
            src={imageUrl} 
            alt={alt}
            className="w-full h-auto animate-glow-pulse rounded-sm"
          />
          
          {/* Shine/glare overlay */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-sm overflow-hidden"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              backgroundPosition: `${shinePosition}% 0`,
              mixBlendMode: 'overlay',
              transition: 'background-position 0.15s ease-out',
            }}
          />
        </div>
      </div>

      {/* Mobile: Corner tuck with reduced opacity */}
      <div 
        className={`
          absolute bottom-2 right-2 z-10
          sm:hidden
          w-16 opacity-30
          pointer-events-none
        `}
      >
        <img 
          src={imageUrl} 
          alt=""
          aria-hidden="true"
          className="w-full h-auto"
        />
      </div>
    </>
  );
}