import { useSectionTracking } from '@/hooks/useSectionTracking';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';

export function FairPriceImageSection() {
  const sectionRef = useSectionTracking('fair_price_image');

  return (
    <section ref={sectionRef} className="py-12 md:py-16 bg-[hsl(var(--surface-1))]">
      <div className="container px-4">
        <AnimateOnScroll duration={700}>
          <div className="max-w-md mx-auto">
            <img
              src={new URL('@/assets/know-your-fair-price.webp', import.meta.url).href}
              alt="Know your fair price for your home — compare your quote to the fair market price and save thousands"
              loading="lazy"
              decoding="async"
              className="w-full h-auto rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20"
            />
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
