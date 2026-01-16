import { Camera, Calendar, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QuoteUploadDropzone } from './QuoteUploadDropzone';
import { trackEvent } from '@/lib/gtm';

interface QuoteCheckerSectionProps {
  onUploadSuccess: (fileId: string, filePath: string) => void;
  onOpenBookingModal: () => void;
}

export const QuoteCheckerSection = ({ 
  onUploadSuccess, 
  onOpenBookingModal 
}: QuoteCheckerSectionProps) => {
  const { toast } = useToast();

  const handleTextClick = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    trackEvent('cta_click', {
      action: 'text_quote',
      section: 'quote_checker',
      device: isMobile ? 'mobile' : 'desktop'
    });

    if (isMobile) {
      window.location.href = "sms:555-GLASS?body=CHECK";
    } else {
      toast({
        title: "📱 Text 555-GLASS",
        description: "Text us the word CHECK along with a photo of your quote to start your review!",
      });
    }
  };

  const handleBookClick = () => {
    trackEvent('cta_click', {
      action: 'book_call',
      section: 'quote_checker'
    });
    onOpenBookingModal();
  };

  return (
    <section className="relative py-20 bg-background overflow-hidden">
      {/* Ambient Background Glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">📋</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Beat Your Quote
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let Window Man Try to Beat Your Quote. Gain leverage over your contractor, keep them honest. You've got nothing to lose.
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          
          {/* Card 1: Text Quote */}
          <div className="bg-card rounded-2xl p-8 border border-border flex flex-col items-start hover:border-primary/30 transition-colors h-full">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-xl">📸</span> Text Photo of Quote
            </h3>
            <p className="text-muted-foreground mb-8 leading-relaxed text-sm flex-grow">
              Snap a photo and text it to{' '}
              <span className="text-primary font-bold">555-GLASS</span> with the word{' '}
              <span className="text-primary font-bold">CHECK</span>.
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold py-6 bg-transparent transition-all"
              onClick={handleTextClick}
            >
              Text Quote Now
            </Button>
          </div>

          {/* Card 2: Upload Quote (Featured) */}
          <div 
            className="bg-card rounded-2xl p-8 border-2 border-primary flex flex-col items-start relative md:-translate-y-6 z-10 h-full"
            style={{
              boxShadow: '0 0 30px hsl(var(--primary) / 0.15)'
            }}
          >
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-xl">📤</span> Upload Quote Here
              </h3>
              <div className="bg-primary text-primary-foreground text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider">
                Most Popular
              </div>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
              Drop a PDF or image. We'll analyze it and get back to you within 24 hours with a detailed breakdown.
            </p>
            
            {/* Embedded Upload Dropzone */}
            <div className="w-full flex-grow">
              <QuoteUploadDropzone
                onSuccess={onUploadSuccess}
                sourcePage="quote-checker-section"
                className="min-h-[180px]"
              />
            </div>
          </div>

          {/* Card 3: Book Call */}
          <div className="bg-card rounded-2xl p-8 border border-border flex flex-col items-start hover:border-emerald-500/30 transition-colors h-full">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-4 leading-tight">
              <span className="text-xl mr-2">📞</span> Book Quote Check
            </h3>
            <p className="text-muted-foreground mb-8 leading-relaxed text-sm flex-grow">
              Pick any 10-minute slot. I'll review your quote live, point out traps, and suggest negotiation moves.
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-auto border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold py-6 bg-transparent transition-all"
              onClick={handleBookClick}
            >
              Book Call
            </Button>
          </div>
        </div>

        {/* Ghost Mode Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Ghost className="w-4 h-4" />
            Ghost User Mode: Browse tools anonymously. No info required until you're ready.
          </p>
        </div>
      </div>
    </section>
  );
};
