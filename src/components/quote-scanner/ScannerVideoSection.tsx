import { useRef, useState, useEffect, useCallback } from 'react';
import { Play } from 'lucide-react';

interface NavigatorConnection {
  saveData?: boolean;
}

function PlayButtonOverlay({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer group"
      aria-label="Play video"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
        <Play className="w-7 h-7 md:w-9 md:h-9 text-foreground ml-1" />
      </div>
    </button>
  );
}

export function ScannerVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.preload = 'auto';
    video.play();
    setShowPlayButton(false);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = (navigator as Navigator & { connection?: NavigatorConnection }).connection;
    const saveData = connection?.saveData === true;

    if (prefersReducedMotion || saveData) {
      setShowPlayButton(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.preload = 'auto';
          video.play().catch(() => setShowPlayButton(true));
          observer.unobserve(wrapper);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-12 md:py-16">
      <div className="container px-4 text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          See the AI Scanner in Action
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Watch how our AI analyzes a real window quote in seconds
        </p>
      </div>
      <div ref={wrapperRef} className="w-full px-4 md:px-8 lg:px-16">
        <div className="relative rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            poster="https://itswindowman-videos.b-cdn.net/scanner-poster.webp"
            width={1920}
            height={1080}
            muted
            loop
            playsInline
            preload="none"
            className="w-full aspect-video object-cover"
            aria-label="AI Quote Scanner demonstration video"
          >
            <source src="https://itswindowman-videos.b-cdn.net/Windowmanscanner.webm" type="video/webm" />
            <source src="https://itswindowman-videos.b-cdn.net/Windowmanscanner.mp4" type="video/mp4" />
          </video>
          {showPlayButton && <PlayButtonOverlay onClick={handlePlay} />}
        </div>
      </div>
    </section>
  );
}
