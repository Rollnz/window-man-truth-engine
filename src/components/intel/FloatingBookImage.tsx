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
  const positionClasses = {
    'top-right': '-top-6 -right-6',
    'top-left': '-top-6 -left-6',
    'bottom-right': '-bottom-4 -right-4',
    'bottom-left': '-bottom-4 -left-4',
  };

  return (
    <>
      {/* Desktop/Tablet: Floating position */}
      <div 
        className={`
          absolute ${positionClasses[position]} z-10
          hidden sm:block
          w-24 md:w-28 lg:w-32
          transition-all duration-300 ease-out
          group-hover:scale-110 group-hover:rotate-3
        `}
      >
        <img 
          src={imageUrl} 
          alt={alt}
          className="w-full h-auto animate-glow-pulse"
        />
      </div>

      {/* Mobile: Corner tuck with reduced opacity */}
      <div 
        className={`
          absolute bottom-2 right-2 z-0
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