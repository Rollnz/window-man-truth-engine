import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Phone, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/navigation';
import { trackEvent } from '@/lib/gtm';
import type { LeadSegment } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Segment-specific content
// ═══════════════════════════════════════════════════════════════════════════

interface SegmentContent {
  title: string;
  body: string;
  primaryCta: { label: string; icon: React.ReactNode; action: 'upload' | 'pdf' | 'pdf-phone' };
  secondaryCta?: { label: string; icon: React.ReactNode; action: 'consultation' | 'pdf' | 'remind' };
  accentColor: string;
}

const SEGMENT_CONTENT: Record<LeadSegment, SegmentContent> = {
  HOT: {
    title: "You're in the negotiation window.",
    body: "You have a quote, a timeline, and the decision power. Let us help you make sure you're not leaving money on the table.",
    primaryCta: {
      label: 'Upload My Quote for Personal Audit',
      icon: <Upload className="w-4 h-4 mr-2" />,
      action: 'upload',
    },
    secondaryCta: {
      label: 'Schedule a 10-Minute Strategy Call',
      icon: <Phone className="w-4 h-4 mr-2" />,
      action: 'consultation',
    },
    accentColor: 'text-red-600',
  },
  WARM: {
    title: "Let's make sure you're prepared.",
    body: "You're getting close. A few smart moves now will save you thousands when the quote arrives.",
    primaryCta: {
      label: 'Get My Quote Audited (Free)',
      icon: <Upload className="w-4 h-4 mr-2" />,
      action: 'upload',
    },
    secondaryCta: {
      label: 'Download the 7 Red Flags Guide',
      icon: <Download className="w-4 h-4 mr-2" />,
      action: 'pdf',
    },
    accentColor: 'text-orange-500',
  },
  NURTURE: {
    title: "You're early \u2014 that's good.",
    body: "Most homeowners who plan ahead save 15-30% on their window project. We'll keep you armed with the right info.",
    primaryCta: {
      label: 'Download the 7 Red Flags Guide',
      icon: <Download className="w-4 h-4 mr-2" />,
      action: 'pdf',
    },
    secondaryCta: {
      label: 'Remind Me When I Have a Quote',
      icon: <ArrowRight className="w-4 h-4 mr-2" />,
      action: 'remind',
    },
    accentColor: 'text-yellow-600',
  },
  LOW: {
    title: "We'll keep you prepared.",
    body: "When you're ready to move forward, we'll be here to make sure you don't overpay.",
    primaryCta: {
      label: 'Keep the Guide on My Phone',
      icon: <Download className="w-4 h-4 mr-2" />,
      action: 'pdf-phone',
    },
    accentColor: 'text-muted-foreground',
  },
};

const PDF_URL = '/downloads/7-red-flags-cheatsheet.pdf';

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface LeadResultScreenProps {
  segment: LeadSegment;
  leadId: string;
  firstName: string;
  leadScore: number;
  onClose: () => void;
  ctaSource?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function LeadResultScreen({
  segment,
  leadId,
  firstName,
  leadScore,
  onClose,
  ctaSource,
}: LeadResultScreenProps) {
  const navigate = useNavigate();
  const content = SEGMENT_CONTENT[segment];

  const handleCtaClick = (action: string, ctaLabel: string) => {
    // Fire GTM event with segment context
    const eventName =
      action === 'upload'
        ? 'SubmitApplication'
        : action === 'consultation'
        ? 'Schedule'
        : 'cta_click';

    trackEvent(eventName, {
      lead_id: leadId,
      lead_segment: segment,
      lead_score: leadScore,
      cta_label: ctaLabel,
      cta_action: action,
      source: ctaSource || 'prequote-v2',
    });

    onClose();

    switch (action) {
      case 'upload':
        navigate(`${ROUTES.QUOTE_SCANNER}?lead=${leadId}#upload`);
        break;
      case 'consultation':
        navigate(ROUTES.CONSULTATION);
        break;
      case 'pdf':
      case 'pdf-phone':
        window.open(PDF_URL, '_blank');
        break;
      case 'remind':
        // Phase 2: replace with proper reminder flow
        // For now, navigate to consultation as soft fallback
        navigate(ROUTES.CONSULTATION);
        break;
    }
  };

  return (
    <div className="p-6 sm:p-8 text-center">
      {/* Segment badge */}
      <div className="mb-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
            segment === 'HOT'
              ? 'bg-red-100 text-red-700'
              : segment === 'WARM'
              ? 'bg-orange-100 text-orange-700'
              : segment === 'NURTURE'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {segment === 'HOT'
            ? 'Ready to Act'
            : segment === 'WARM'
            ? 'Almost Ready'
            : segment === 'NURTURE'
            ? 'Planning Ahead'
            : 'Early Stage'}
        </span>
      </div>

      {/* Title */}
      <h2
        className={`text-xl font-bold mb-2 ${content.accentColor}`}
        aria-live="polite"
      >
        {firstName ? `${firstName}, ` : ''}
        {content.title}
      </h2>

      {/* Body */}
      <p className="text-muted-foreground mb-6">{content.body}</p>

      {/* CTAs */}
      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={() =>
            handleCtaClick(content.primaryCta.action, content.primaryCta.label)
          }
        >
          {content.primaryCta.icon}
          {content.primaryCta.label}
        </Button>

        {content.secondaryCta && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              handleCtaClick(
                content.secondaryCta!.action,
                content.secondaryCta!.label
              )
            }
          >
            {content.secondaryCta.icon}
            {content.secondaryCta.label}
          </Button>
        )}
      </div>
    </div>
  );
}
