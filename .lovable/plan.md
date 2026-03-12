

## Plan: Create WindowManFeatureImage Component (1/1 Aspect Ratio)

### 1. Copy asset

`user-uploads://windowman_with_truth_report_on_the_phone_trans.webp` → `src/assets/hero/windowman_truth_report.webp`

### 2. Create `src/components/brand/WindowManFeatureImage.tsx`

```tsx
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
```

Key details: `aspectRatio` defaults to `'1/1'` matching the 500×500 asset. The `w-72` container gets its height automatically from the 1:1 ratio. `object-contain` ensures no distortion. `AnimateOnScroll` handles `will-change` lifecycle.

### 3. Edit `src/pages/Signup.tsx`

Add import and insert `<WindowManFeatureImage className="lg:hidden" />` between line 466 (`</section>`) and line 468 (PowerToolFlow wrapper).

