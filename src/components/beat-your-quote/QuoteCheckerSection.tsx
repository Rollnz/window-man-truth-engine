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
    <section 
      className="relative py-20 overflow-hidden"
      style={{ backgroundColor: '#0A0F14' }}
    >
      {/* Ambient Background Glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(67, 147, 219, 0.08) 0%, transparent 70%)'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">📋</span>
            <h2 
              className="text-3xl md:text-4xl font-bold"
              style={{ color: '#FFFFFF' }}
            >
              Beat Your Quote
            </h2>
          </div>
          <p 
            className="text-xl max-w-2xl mx-auto"
            style={{ color: '#94a3b8' }}
          >
            Let Window Man Try to Beat Your Quote. Gain leverage over your contractor, keep them honest. You've got nothing to lose.
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          
          {/* Card 1: Text Quote */}
          <div 
            className="rounded-2xl p-8 flex flex-col items-start transition-colors h-full"
            style={{ 
              backgroundColor: '#0f0f0f',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(67, 147, 219, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: 'rgba(67, 147, 219, 0.1)' }}
            >
              <Camera className="w-6 h-6" style={{ color: '#4393DB' }} />
            </div>
            <h3 
              className="text-xl font-bold mb-4 flex items-center gap-2"
              style={{ color: '#FFFFFF' }}
            >
              <span className="text-xl">📸</span> Text Photo of Quote
            </h3>
            <p 
              className="mb-8 leading-relaxed text-sm flex-grow"
              style={{ color: '#94a3b8' }}
            >
              Snap a photo and text it to{' '}
              <span className="font-bold" style={{ color: '#4393DB' }}>555-GLASS</span> with the word{' '}
              <span className="font-bold" style={{ color: '#4393DB' }}>CHECK</span>.
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-auto font-bold py-6 bg-transparent transition-all"
              style={{ 
                borderColor: '#4393DB', 
                color: '#4393DB',
              }}
              onClick={handleTextClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4393DB';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4393DB';
              }}
            >
              Text Quote Now
            </Button>
          </div>

          {/* Card 2: Upload Quote (Featured) */}
          <div 
            className="rounded-2xl p-8 flex flex-col items-start relative md:-translate-y-6 z-10 h-full"
            style={{ 
              backgroundColor: '#0f0f0f',
              border: '2px solid #4393DB',
              boxShadow: '0 0 30px rgba(67, 147, 219, 0.15)'
            }}
          >
            <div className="flex items-center justify-between w-full mb-4">
              <h3 
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: '#FFFFFF' }}
              >
                <span className="text-xl">📤</span> Upload Quote Here
              </h3>
              <div 
                className="text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider"
                style={{ backgroundColor: '#4393DB', color: '#FFFFFF' }}
              >
                Most Popular
              </div>
            </div>
            <p 
              className="mb-6 leading-relaxed text-sm"
              style={{ color: '#94a3b8' }}
            >
              Drop a PDF or image. We'll analyze it and get back to you within 24 hours with a detailed breakdown.
            </p>
            
            {/* Embedded Upload Dropzone - Compact Mode */}
            <div className="w-full flex-grow">
              <QuoteUploadDropzone
                onSuccess={onUploadSuccess}
                sourcePage="quote-checker-section"
                compact
              />
            </div>
          </div>

          {/* Card 3: Book Call */}
          <div 
            className="rounded-2xl p-8 flex flex-col items-start transition-colors h-full"
            style={{ 
              backgroundColor: '#0f0f0f',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
            >
              <Calendar className="w-6 h-6" style={{ color: '#22c55e' }} />
            </div>
            <h3 
              className="text-xl font-bold mb-4 leading-tight"
              style={{ color: '#FFFFFF' }}
            >
              <span className="text-xl mr-2">📞</span> Book Quote Check
            </h3>
            <p 
              className="mb-8 leading-relaxed text-sm flex-grow"
              style={{ color: '#94a3b8' }}
            >
              Pick any 10-minute slot. I'll review your quote live, point out traps, and suggest negotiation moves.
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-auto font-bold py-6 bg-transparent transition-all"
              style={{ 
                borderColor: '#22c55e', 
                color: '#22c55e',
              }}
              onClick={handleBookClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#22c55e';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#22c55e';
              }}
            >
              Book Call
            </Button>
          </div>
        </div>

        {/* Ghost Mode Footer */}
        <div className="text-center mt-12">
          <p 
            className="text-sm flex items-center justify-center gap-2"
            style={{ color: '#94a3b8' }}
          >
            <Ghost className="w-4 h-4" />
            Ghost User Mode: Browse tools anonymously. No info required until you're ready.
          </p>
        </div>
      </div>
    </section>
  );
};
