import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { photoSteps } from '@/data/claimSurvivalData';
import { useRef, useState } from 'react';

interface PhotoStepperProps {
  onUploadClick: (docId: string) => void;
}

export function PhotoStepper({ onUploadClick }: PhotoStepperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = scrollRef.current.offsetWidth * 0.85;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(newIndex, photoSteps.length - 1));
  };

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.offsetWidth * 0.85;
    scrollRef.current.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {photoSteps.map((step, index) => (
          <Card 
            key={step.id} 
            className="flex-none w-[85%] snap-center p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Step {index + 1} of {photoSteps.length}</span>
                <h3 className="font-semibold text-sm">{step.title}</h3>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {step.description}
            </p>

            <ul className="space-y-2 mb-4">
              {step.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onUploadClick(`photo-${step.id}`)}
            >
              <Camera className="mr-2 h-4 w-4" />
              Upload Photos
            </Button>
          </Card>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {photoSteps.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === activeIndex ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
