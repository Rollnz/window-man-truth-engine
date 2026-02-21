import { useRef, useCallback } from 'react';
import { Camera, Calendar, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { trackEvent } from '@/lib/gtm';

interface QuoteCheckerSectionProps {
  onFileSelect: (file: File) => void;
  onOpenBookingModal: () => void;
}

export const QuoteCheckerSection = ({
  onFileSelect,
  onOpenBookingModal
}: QuoteCheckerSectionProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        description: "Text us the word CHECK along with a photo of your quote to start your review!"
      });
    }
  };

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = '';
  }, [onFileSelect]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleBookClick = () => {
    trackEvent('cta_click', {
      action: 'book_call',
      section: 'quote_checker'
    });
    onOpenBookingModal();
  };

  return (
    <section className="relative py-20 overflow-hidden" style={{ backgroundColor: '#0A0F14' }}>
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(67, 147, 219, 0.08) 0%, transparent 70%)'
      }} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl">📋</span>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#FFFFFF' }}>
                Beat Your Quote
              </h2>
            </div>
            <p className="text-xl max-w-2xl mx-auto text-primary-foreground" style={{ color: '#94a3b8' }}>
              Let Window Man Try to Beat Your Quote. Gain leverage over your contractor, keep them honest. You've got nothing to lose.
            </p>
          </div>
        </AnimateOnScroll>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          
          {/* Card 1: Text Quote */}
          <AnimateOnScroll delay={100} className="order-2 md:order-1">
            <div className="rounded-2xl p-8 flex flex-col items-start transition-colors h-full" style={{
              backgroundColor: '#0f0f0f',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(67, 147, 219, 0.3)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(67, 147, 219, 0.1)' }}>
                <Camera className="w-6 h-6" style={{ color: '#4393DB' }} />
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                <span className="text-xl">📸</span> Text Photo of Quote
              </h3>
              <p className="mb-8 leading-relaxed text-sm flex-grow" style={{ color: '#94a3b8' }}>
                Snap a photo and text it to{' '}
                <span className="font-bold" style={{ color: '#4393DB' }}>555-GLASS</span> with the word{' '}
                <span className="font-bold" style={{ color: '#4393DB' }}>CHECK</span>.
              </p>
              <Button variant="outline" className="w-full mt-auto font-bold py-6 bg-transparent transition-all" style={{
                borderColor: '#4393DB',
                color: '#4393DB'
              }} onClick={handleTextClick} onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4393DB';
                e.currentTarget.style.color = '#FFFFFF';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4393DB';
              }}>
                Text Quote Now
              </Button>
            </div>
          </AnimateOnScroll>

          {/* Card 2: Upload Quote (Featured) */}
          <AnimateOnScroll delay={0} className="order-1 md:order-2">
            <div className="rounded-2xl p-8 flex flex-col items-start relative md:-translate-y-6 z-10 h-full" style={{
              backgroundColor: '#0f0f0f',
              border: '2px solid #4393DB',
              boxShadow: '0 0 30px rgba(67, 147, 219, 0.15)'
            }}>
              <div className="flex flex-col gap-2 w-full mb-4">
                <div className="text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider whitespace-nowrap self-start" style={{
                  backgroundColor: '#4393DB',
                  color: '#FFFFFF'
                }}>
                  Most Popular
                </div>
                <h3 className="text-xl font-bold flex items-center gap-2 whitespace-nowrap" style={{ color: '#FFFFFF' }}>
                  <span className="text-xl">📤</span> Upload Quote Here
                </h3>
              </div>
              <p className="mb-6 leading-relaxed text-sm" style={{ color: '#94a3b8' }}>
                Drop a PDF or image. Our AI will analyze it instantly and reveal hidden fees, missing items, and your safety score.
              </p>
              
              {/* Direct file select button instead of embedded dropzone */}
              <div className="w-full flex-grow flex flex-col justify-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  aria-label="Upload contractor quote" />

                <Button
                  className="w-full font-bold py-6 transition-all"
                  style={{ backgroundColor: '#4393DB', color: '#FFFFFF' }}
                  onClick={handleUploadClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3580c2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#4393DB';
                  }}>

                  <Upload className="w-5 h-5 mr-2" />
                  Upload Quote Now
                </Button>
                <p className="text-center text-xs mt-2" style={{ color: '#64748b' }}>
                  PDF, JPG, PNG • Max 6MB
                </p>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Card 3: Book Call */}
          <AnimateOnScroll delay={200} className="order-3">
            <div className="rounded-2xl p-8 flex flex-col items-start transition-colors h-full" style={{
              backgroundColor: '#0f0f0f',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <Calendar className="w-6 h-6" style={{ color: '#22c55e' }} />
              </div>
              <h3 className="text-xl font-bold mb-4 leading-tight" style={{ color: '#FFFFFF' }}>
                <span className="text-xl mr-2">📞</span> Book Quote Check
              </h3>
              <p className="mb-8 leading-relaxed text-sm flex-grow" style={{ color: '#94a3b8' }}>
                Pick any 10-minute slot. I'll review your quote live, point out traps, and suggest negotiation moves.
              </p>
              <Button variant="outline" className="w-full mt-auto font-bold py-6 bg-transparent transition-all" style={{
                borderColor: '#22c55e',
                color: '#22c55e'
              }} onClick={handleBookClick} onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#22c55e';
                e.currentTarget.style.color = '#FFFFFF';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#22c55e';
              }}>
                Book Call
              </Button>
            </div>
          </AnimateOnScroll>
        </div>

        {/* Ghost Mode Footer */}
        <AnimateOnScroll delay={300}>
          <div className="text-center mt-12">
            
          </div>
        </AnimateOnScroll>
      </div>
    </section>);

};