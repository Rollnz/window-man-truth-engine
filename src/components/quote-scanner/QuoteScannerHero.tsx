import { ScanSearch } from 'lucide-react';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';

export function QuoteScannerHero() {
  return (
    <>
      {/* Inline keyframes for X-Ray reveal effect */}
      <style>{`
        @keyframes xray-reveal {
          0%     { clip-path: inset(0 0 0 0); }
          80%    { clip-path: inset(100% 0 0 0); }
          80.01%, 100% { clip-path: inset(0 0 0 0); }
        }
        @keyframes xray-line {
          0%     { top: 0%; }
          80%    { top: 100%; }
          80.01%, 100% { top: 0%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .xray-top-layer, .xray-scan-line {
            animation: none !important;
          }
        }
      `}</style>

      <section className="relative py-16 md:py-24 overflow-hidden min-h-[420px] md:min-h-[500px]">
        {/* Bottom Layer: Warnings / X-Ray (always visible, revealed by clip) */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/images/hero/warnings_xray.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
          }}
          aria-hidden="true"
        />

        {/* Top Layer: Frosted Window (animated clip-path masks it away) */}
        <div
          className="xray-top-layer absolute inset-0 z-[10]"
          style={{
            backgroundImage: 'url(/images/hero/window_background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: 'xray-reveal 10s linear infinite',
            willChange: 'clip-path',
          }}
          aria-hidden="true"
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 z-[20] bg-black/40" aria-hidden="true" />

        {/* Red scan line */}
        <div
          className="xray-scan-line absolute left-0 right-0 z-[30] h-[2px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
            boxShadow: '0 0 20px #ef4444, 0 0 40px #ef444480',
            animation: 'xray-line 10s linear infinite',
            top: '0%',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-[40] container px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <ShimmerBadge className="mb-6" />

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                <ScanSearch className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Is Your Window Quote Fair?{' '}
              <span className="text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                AI Analysis in 60 Seconds
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              Stop guessing. Upload a photo of your contractor's quote and let our AI flag hidden risks,
              missing scope, and overpricing — in seconds.
            </p>

            {/* Before/After context line */}
            <p className="text-sm text-orange-400 font-bold tracking-wide uppercase drop-shadow-md">
              See what our AI finds in seconds ↓
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
