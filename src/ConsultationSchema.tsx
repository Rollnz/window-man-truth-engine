import { Helmet } from 'react-helmet-async';

/**
 * Render head metadata and structured JSON-LD for the Consultation page.
 *
 * Injects page title, meta tags (description, robots, canonical), Open Graph and Twitter Card metadata,
 * and a JSON-LD script containing a WebPage, Service, FAQPage, and BreadcrumbList graph for the consultation offering.
 *
 * @returns A Helmet element that inserts the Consultation page metadata and JSON-LD into the document head.
 */
export function ConsultationSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      // WebPage Schema
      {
        '@type': 'WebPage',
        '@id': 'https://itswindowguy.com/consultation#webpage',
        'url': 'https://itswindowguy.com/consultation',
        'name': 'Window Quote Strategy Session | Window Man Truth Engine',
        'description': 'Get a 15-minute unbiased review of your window project before you sign anything. Verify pricing, scope, and timelines using real installation data.',
        'isPartOf': {
          '@id': 'https://itswindowguy.com/#website'
        },
        'about': {
          '@id': 'https://itswindowguy.com/consultation#service'
        },
        'primaryImageOfPage': {
          '@type': 'ImageObject',
          'url': 'https://itswindowguy.com/og-consultation.jpg'
        },
        'datePublished': '2025-01-01',
        'dateModified': new Date().toISOString().split('T')[0],
        'inLanguage': 'en-US'
      },
      
      // Service Schema
      {
        '@type': 'Service',
        '@id': 'https://itswindowguy.com/consultation#service',
        'name': 'Window Quote Verification Service',
        'alternateName': 'Truth Engine Strategy Session',
        'description': 'Independent window quote review and project verification service. Our experts analyze your existing quotes against local permit data and installation pricing to ensure accuracy and fairness.',
        'provider': {
          '@type': 'Organization',
          'name': 'Window Man',
          'url': 'https://itswindowguy.com',
          'logo': 'https://itswindowguy.com/logo.png'
        },
        'serviceType': 'Quote Verification',
        'areaServed': {
          '@type': 'State',
          'name': 'Florida',
          'containedIn': 'United States'
        },
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'description': 'Complimentary 15-minute strategy session',
          'availability': 'https://schema.org/InStock'
        },
        'audience': {
          '@type': 'Audience',
          'audienceType': 'Homeowners seeking window replacement quotes'
        },
        'hasOfferCatalog': {
          '@type': 'OfferCatalog',
          'name': 'Window Project Services',
          'itemListElement': [
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': 'Quote Reality Check',
                'description': 'Verification of pricing fairness against local market data'
              }
            },
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': 'Scope & Specification Review',
                'description': 'Verification of window counts, types, and impact ratings'
              }
            },
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': 'Permit & Timeline Analysis',
                'description': 'Local permit timeline estimation and installation scheduling review'
              }
            }
          ]
        }
      },
      
      // FAQ Schema
      {
        '@type': 'FAQPage',
        '@id': 'https://itswindowguy.com/consultation#faq',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'How long is the strategy call?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'The call is 15 minutes. We respect your time and focus only on what matters for your specific project.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Is there any sales pressure?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. Our strategy experts are salaried, not commissioned. Their job is to verify truth, not close sales. Sometimes we confirm your existing quote is fair.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Do I need to have a quote already?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No, but having one helps us provide more specific insights. If you don\'t have a quote yet, we can still discuss timeline, permit requirements, and what to watch for.'
            }
          },
          {
            '@type': 'Question',
            'name': 'What is the Truth Engine?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'The Truth Engine is our database of real permit costs, installation timelines, and local pricing data. We use it to audit quotes against what projects actually cost in your area.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Do I have to choose Window Man after the call?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Absolutely not. The purpose of the call is to give you clarity and certainty about your project—regardless of who you ultimately choose to work with.'
            }
          }
        ]
      },
      
      // BreadcrumbList Schema
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://itswindowguy.com'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Consultation',
            'item': 'https://itswindowguy.com/consultation'
          }
        ]
      }
    ]
  };

  return (
    <Helmet>
      <title>Window Quote Strategy Session | Verify Before You Sign | Window Man</title>
      <meta 
        name="description" 
        content="Get a free 15-minute review of your window project. Our experts verify pricing, scope, and timelines using real Florida installation data. No sales pressure." 
      />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href="https://itswindowguy.com/consultation" />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Window Quote Strategy Session | Window Man Truth Engine" />
      <meta 
        property="og:description" 
        content="A 15-minute call to verify your window quote is fair. No sales pressure. No obligation. Just truth." 
      />
      <meta property="og:url" content="https://itswindowguy.com/consultation" />
      <meta property="og:site_name" content="Window Man" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Window Quote Strategy Session | Window Man" />
      <meta 
        name="twitter:description" 
        content="Get a free 15-minute review of your window project. Verify pricing before you sign." 
      />
      
      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}