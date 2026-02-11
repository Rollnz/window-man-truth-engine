import { useRef, useState, useEffect, useMemo } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/gtm';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useIsMobile } from '@/hooks/use-mobile';

const REVIEWS = [
  {
    id: 1,
    name: "Maria G.",
    location: "Miami, FL",
    platform: "Google Review",
    platformIcon: "🔍",
    stars: 5.0,
    headline: "He told me what to say before I even booked a quote.",
    body: "Window Man coached me before I talked to any contractors, gave me a checklist of questions, and helped me avoid a $45k upsell.",
    savings: "Saved $12,400 vs. first quote",
    avatarUrl: "https://i.pravatar.cc/200?img=47",
  },
  {
    id: 2,
    name: "Carlos R.",
    location: "Tampa, FL",
    platform: "Google Review",
    platformIcon: "🔍",
    stars: 5.0,
    headline: "Finally someone who explains windows without the sales pitch.",
    body: "I was about to sign a contract for $38k. Window Man showed me where they were overcharging and I got the same job done for $24k.",
    savings: "Saved $14,000 vs. first quote",
    avatarUrl: "https://i.pravatar.cc/200?img=12",
  },
  {
    id: 3,
    name: "Jennifer L.",
    location: "Orlando, FL",
    platform: "Google Review",
    platformIcon: "🔍",
    stars: 5.0,
    headline: "The quote scanner caught things I never would have noticed.",
    body: "Three contractors, three wildly different prices. Window Man helped me understand why and negotiate the best deal.",
    savings: "Saved $8,200 vs. first quote",
    avatarUrl: "https://i.pravatar.cc/200?img=5",
  },
  {
    id: 4,
    name: "Robert M.",
    location: "Fort Lauderdale, FL",
    platform: "Google Review",
    platformIcon: "🔍",
    stars: 5.0,
    headline: "Worth every minute of my time.",
    body: "I uploaded my quote and within minutes knew exactly what questions to ask. The contractor dropped their price by $6k on the spot.",
    savings: "Saved $6,000 vs. first quote",
    avatarUrl: "https://i.pravatar.cc/200?img=68",
  },
  {
    id: 5,
    name: "Patricia S.",
    location: "Jacksonville, FL",
    platform: "Google Review",
    platformIcon: "🔍",
    stars: 5.0,
    headline: "My husband thought I was crazy. Now he's a believer.",
    body: "We were ready to pay $52k for impact windows. Window Man's analysis showed us the contractor was double-charging for permits and installation.",
    savings: "Saved $18,500 vs. first quote",
    avatarUrl: "https://i.pravatar.cc/200?img=26",
  },
  {
    id: 6,
    name: "David K.",
    location: "Naples, FL",
    platform: "Google Review",
    platformIcon: "🔍",
    stars: 5.0,
    headline: "Like having a contractor friend who doesn't want to sell you anything.",
    body: "Honest advice, no agenda. He actually told me my second quote was fair and to go with them. That trust is priceless.",
    savings: "Validated fair pricing",
    avatarUrl: "https://i.pravatar.cc/200?img=59",
  },
];

interface TestimonialCardsProps {
  variant?: 'default' | 'dark';
  className?: string;
}

export function TestimonialCards({ variant = 'default', className }: TestimonialCardsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [hasTrackedInteraction, setHasTrackedInteraction] = useState(false);
  
  const isMobile = useIsMobile();
  
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  
  // Autoplay plugin - only on desktop and when reduced motion is not preferred
  const autoplayPlugin = useMemo(() => {
    if (isMobile || prefersReducedMotion) return [];
    return [
      Autoplay({
        delay: 5000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    ];
  }, [isMobile, prefersReducedMotion]);

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          
          // Trigger slide-up animation
          if (!hasAnimated) {
            setHasAnimated(true);
          }
          
          // Track impression once
          if (!hasTrackedImpression) {
            setHasTrackedImpression(true);
            trackEvent('testimonial_section_view', {
              variant,
              timestamp: Date.now(),
            });
          }
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [variant, hasTrackedImpression, hasAnimated]);

  const handleCarouselInteraction = () => {
    if (!hasTrackedInteraction) {
      setHasTrackedInteraction(true);
      trackEvent('testimonial_carousel_interaction', {
        variant,
        timestamp: Date.now(),
      });
    }
  };

  // Variant-based styling
  const isDark = variant === 'dark';
  
  const sectionClasses = cn(
    "py-16 md:py-24 px-4",
    isDark ? "bg-slate-950" : "bg-background",
    className
  );

  const cardClasses = cn(
    "p-6 h-full transition-all duration-300",
    isDark 
      ? "bg-slate-900/80 border-slate-700/50 hover:border-emerald-500/30" 
      : "bg-card border-border hover:border-primary/40"
  );

  const textClasses = isDark ? "text-white" : "text-foreground";
  const mutedClasses = isDark ? "text-slate-400" : "text-muted-foreground";

  // Placeholder while lazy loading
  if (!isInView) {
    return (
      <section 
        ref={sectionRef} 
        className={cn("py-16 md:py-24 px-4 min-h-[500px]", isDark ? "bg-slate-950" : "bg-background")}
        aria-label="Testimonials loading"
      />
    );
  }

  return (
    <section 
      ref={sectionRef} 
      className={cn(
        sectionClasses,
        "transition-all duration-700 ease-out",
        hasAnimated 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-8"
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge 
            variant="outline" 
            className={cn(
              "mb-4 px-3 py-1",
              isDark ? "border-emerald-500/30 text-emerald-400" : "border-primary/30 text-primary"
            )}
          >
            ⭐ Verified Homeowner Reviews
          </Badge>
          
          <h2 className={cn(
            "text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight",
            textClasses
          )}>
            Real Savings.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Real Homeowners.
            </span>
          </h2>
          
          <p className={cn("text-lg max-w-2xl mx-auto", mutedClasses)}>
            Florida homeowners trust Window Man to expose overpriced quotes and validate fair deals.
          </p>
        </div>

        {/* Carousel */}
        <div 
          className="relative px-4 md:px-12"
          onMouseDown={handleCarouselInteraction}
          onTouchStart={handleCarouselInteraction}
        >
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            plugins={autoplayPlugin}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {REVIEWS.map((review) => (
                <CarouselItem 
                  key={review.id} 
                  className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <Card className={cardClasses}>
                    {/* Avatar + Name + Location */}
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className={cn(
                        "h-12 w-12 border-2",
                        isDark ? "border-emerald-500/30" : "border-primary/30"
                      )}>
                        <AvatarImage src={review.avatarUrl} alt={review.name} />
                        <AvatarFallback className={isDark ? "bg-slate-800 text-white" : ""}>
                          {review.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={cn("font-semibold", textClasses)}>{review.name}</p>
                        <p className={cn("text-sm", mutedClasses)}>{review.location}</p>
                      </div>
                      <span className="ml-auto text-lg" title={review.platform}>
                        {review.platformIcon}
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "w-4 h-4 fill-current",
                            isDark ? "text-emerald-400" : "text-primary"
                          )} 
                        />
                      ))}
                      <span className={cn("text-sm ml-2", mutedClasses)}>
                        {review.stars.toFixed(1)}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className={cn("font-bold text-lg mb-2 leading-tight", textClasses)}>
                      "{review.headline}"
                    </h3>

                    {/* Body */}
                    <p className={cn("text-sm mb-4 leading-relaxed", mutedClasses)}>
                      {review.body}
                    </p>

                    {/* Savings Badge */}
                    <div className={cn(
                      "flex items-center gap-2 pt-3 border-t",
                      isDark ? "border-slate-700/50" : "border-border"
                    )}>
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                        isDark 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : "bg-primary/10 text-primary"
                      )}>
                        <span className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          isDark ? "bg-emerald-400" : "bg-primary"
                        )} />
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{review.savings}</span>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselPrevious 
              className={cn(
                "-left-2 md:-left-12 h-8 w-8",
                isDark 
                  ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" 
                  : ""
              )}
            />
            <CarouselNext 
              className={cn(
                "-right-2 md:-right-12 h-8 w-8",
                isDark 
                  ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" 
                  : ""
              )}
            />
          </Carousel>
        </div>
      </div>
    </section>
  );
}

export default TestimonialCards;
