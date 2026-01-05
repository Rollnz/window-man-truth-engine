import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTracking } from '@/hooks/usePageTracking';

export default function Accessibility() {
  usePageTracking('legal-accessibility');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">Accessibility Statement</h1>
        <p className="text-muted-foreground mb-8">Last Updated: [Insert Date]</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Window Truth Engine is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Conformance Status</h2>
            <p className="text-muted-foreground">
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. These guidelines explain how to make web content more accessible for people with disabilities and user-friendly for everyone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Measures to Support Accessibility</h2>
            <p className="text-muted-foreground mb-3">Window Truth Engine takes the following measures to ensure accessibility:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Include accessibility as part of our mission statement and development process.</li>
              <li>Provide continual accessibility training for our development team.</li>
              <li>Assign clear accessibility goals and responsibilities.</li>
              <li>Use semantic HTML and ARIA landmarks where appropriate.</li>
              <li>Ensure sufficient color contrast ratios throughout the site.</li>
              <li>Support keyboard navigation for all interactive elements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Compatibility with Browsers and Assistive Technology</h2>
            <p className="text-muted-foreground">
              Our website is designed to be compatible with recent versions of major browsers (Chrome, Firefox, Safari, Edge) and common assistive technologies including screen readers (JAWS, NVDA, VoiceOver).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Technical Specifications</h2>
            <p className="text-muted-foreground">
              The accessibility of Window Truth Engine relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>HTML5</li>
              <li>CSS3</li>
              <li>WAI-ARIA</li>
              <li>JavaScript</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Feedback and Contact Information</h2>
            <p className="text-muted-foreground mb-3">
              We welcome your feedback on the accessibility of Window Truth Engine. Please let us know if you encounter accessibility barriers:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong className="text-foreground">Email:</strong> [Insert Support Email]</li>
              <li><strong className="text-foreground">Response Time:</strong> We aim to respond to accessibility feedback within 5 business days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Limitations and Alternatives</h2>
            <p className="text-muted-foreground">
              Despite our best efforts to ensure accessibility, there may be some limitations. If you find an issue, please contact us and we will work to provide an accessible alternative or assist you in completing your tasks through an alternative method.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Assessment Approach</h2>
            <p className="text-muted-foreground mb-3">
              Window Truth Engine assessed the accessibility of this site by the following approaches:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Self-evaluation using automated accessibility testing tools</li>
              <li>Manual testing with keyboard navigation</li>
              <li>Screen reader testing with NVDA and VoiceOver</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
