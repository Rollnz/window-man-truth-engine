import { Navbar } from '@/components/home/Navbar';
import { Hero } from '@/components/home/Hero';
import {
  LazyMascotTransition,
  LazyUncomfortableTruth,
  LazyToolGrid,
  LazyCommunityImpact,
  LazySocialProof,
  LazyFooter,
} from '@/components/home/LazyHomepageSections';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { getBreadcrumbSchema, getPillarHasPartReferences, generateLocalBusinessSchema } from '@/lib/seoSchemas/index';
import { getReviewBoardSchema } from '@/config/expertIdentity';

const Index = () => {
  usePageTracking('homepage');

  const homepageSchema = [
    // LocalBusiness schema with Florida address (fixes Rich Results error)
    generateLocalBusinessSchema(),
    // Organization schema for brand identity
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://itswindowman.com/#organization",
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
      },
      "knowsAbout": [
        "Florida Building Code",
        "Impact Window Cost Analysis",
        "Hurricane Mitigation",
        "Miami-Dade NOA Certification"
      ],
      "member": getReviewBoardSchema()
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://itswindowman.com/#website",
      "name": "Window Man Truth Engine",
      "url": "https://itswindowman.com/",
      "publisher": {
        "@id": "https://itswindowman.com/#organization"
      },
      "hasPart": getPillarHasPartReferences(),
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
    },
    getReviewBoardSchema()
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Free Window Replacement Cost Calculator & Quote Analyzer"
        description="Stop overpaying for windows. Use our free tools to calculate fair prices, analyze quotes, and negotiate with confidence. Trusted by 10,000+ homeowners."
        canonicalUrl="https://itswindowman.com/"
        jsonLd={[...homepageSchema, getBreadcrumbSchema('home')]}
      />
      <Navbar />
      <div className="pt-14"> {/* Padding for fixed navbar */}
        <Hero />
        <LazyMascotTransition />
        <LazyUncomfortableTruth />
        <LazyToolGrid />
        <LazyCommunityImpact />
        <LazySocialProof />
        <LazyFooter />
      </div>
    </div>
  );
};

export default Index;