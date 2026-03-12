import windowmanDefaultImg from '@/assets/hero/windowman_truth_report.webp';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { cn } from '@/lib/utils';

interface WindowManFeatureImageProps {
  className?: string;
  src?: string;
  alt?: string;
  aspectRatio?: string;
}

export function WindowManFeatureImage({
  className,
  src = windowmanDefaultImg,
  alt = 'Window Man holding the Truth Report on a phone',
  aspectRatio = '1/1',
}: WindowManFeatureImageProps) {
  return (
    <div className={cn('py-8 flex justify-center', className)}>
      <AnimateOnScroll duration={600} threshold={0.2}>
        <div className="w-72" style={{ aspectRatio }}>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
      </AnimateOnScroll>
    </div>
  );
}
