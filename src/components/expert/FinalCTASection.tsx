import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinalCTASectionProps {
  onScrollToTop: () => void;
}

export function FinalCTASection({ onScrollToTop }: FinalCTASectionProps) {
  return (
    <section className="py-16 px-4 bg-background">
      <div className="container mx-auto max-w-2xl text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          Ready to Get the <span className="text-primary">Truth?</span>
        </h2>
        <p className="text-muted-foreground mb-8">
          Stop guessing and start getting real answers about your window project.
        </p>
        <Button
          variant="cta"
          size="lg"
          onClick={onScrollToTop}
          className="gap-2"
        >
          <ArrowUp className="h-5 w-5" />
          Scroll Up & Ask an Expert
        </Button>
      </div>
    </section>
  );
}
