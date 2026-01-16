import { Navbar } from '@/components/home/Navbar';
import { Hero } from '@/components/home/Hero';
import { MascotTransition } from '@/components/home/MascotTransition';
import { UncomfortableTruth } from '@/components/home/UncomfortableTruth';
import { ToolGrid } from '@/components/home/ToolGrid';
import { SocialProof } from '@/components/home/SocialProof';
import { Footer } from '@/components/home/Footer';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';

const Index = () => {
  usePageTracking('homepage');

  const homepageSchema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Window Man Your Hurricane Hero",
      "url": "https://itswindowman.com/",
      "logo": "https://itswindowman.com/icon-512.webp",
      "description": "Free tools to help homeowners get fair window replacement quotes and avoid overpaying.",
      "sameAs": [
        "https://www.facebook.com/its.windowman",
        "https://twitter.com/itswindowman"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-561-468-5571",
        "contactType": "customer service"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Window Man Truth Engine",
      "url": "https://itswindowman.com/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://itswindowman.com/tools?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much do impact windows cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Impact window costs vary from $500-$1,500+ per window depending on size, frame material, and features. Our free calculator helps you get an accurate estimate for your specific project."
          }
        },
        {
          "@type": "Question",
          "name": "How do I know if a window quote is fair?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Use our free Quote Scanner tool to upload your quote and get an instant analysis comparing it to market rates. We identify red flags and hidden fees."
          }
        },
        {
          "@type": "Question",
          "name": "What should I look for in a window replacement quote?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Key items include itemized pricing, window specifications (DP rating, glass type), installation details, warranty terms, and permit information. Our Spec Checklist helps you verify all critical details."
          }
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Free Window Replacement Cost Calculator & Quote Analyzer"
        description="Stop overpaying for windows. Use our free tools to calculate fair prices, analyze quotes, and negotiate with confidence. Trusted by 10,000+ homeowners."
        canonicalUrl="https://itswindowman.com/"
        jsonLd={homepageSchema}
      />
      <Navbar />
      <div className="pt-14"> {/* Padding for fixed navbar */}
        <Hero />
        <MascotTransition />
        <UncomfortableTruth />
        <ToolGrid />
        <SocialProof />
        <Footer />
      </div>
    </div>
  );
};

export default Index;