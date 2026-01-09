import { Shield, Target, FileText, ClipboardList, Wallet } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/config/navigation';

export interface IntelResource {
  id: string;
  title: string;
  tagline: string;
  category: 'negotiation' | 'claims' | 'education' | 'comparison';
  icon: LucideIcon;
  description: string;
  pageCount: number;
  previewPoints: string[];
  pdfUrl: string;
  recommended?: boolean;
  forVulnerabilityLevel?: 'CRITICAL' | 'MODERATE' | 'LOW';
  bookImageUrl?: string;
  imagePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  landingPageUrl?: string; // Optional dedicated landing page route
}

export const intelResources: IntelResource[] = [
  {
    id: 'defense-kit',
    title: 'The Kitchen Table Defense Kit',
    tagline: 'Negotiation Tactics',
    category: 'negotiation',
    icon: Shield,
    description: 'Counter every high-pressure sales tactic used at your kitchen table. Know exactly what to say when they push "today only" deals.',
    pageCount: 12,
    previewPoints: [
      'The "Today Only" Response Script',
      '5 Questions That Expose Fake Discounts',
      'How to Politely End High-Pressure Pitches',
      'The 48-Hour Rule for Major Purchases',
    ],
    pdfUrl: '#',
    recommended: true,
    forVulnerabilityLevel: 'CRITICAL',
    bookImageUrl: '/images/defense-kit-book.webp',
    imagePosition: 'bottom-right',
    landingPageUrl: '/kitchen-table-guide',
  },
  {
    id: 'sales-tactics',
    title: '11 Contractor Sales Tactics Exposed',
    tagline: 'Industry Secrets',
    category: 'education',
    icon: Target,
    description: 'The playbook contractors use to close deals. Once you see these patterns, you\'ll never fall for them again.',
    pageCount: 18,
    previewPoints: [
      'The "Manager Approval" Theatre',
      'Artificial Urgency Creation',
      'Price Anchoring Explained',
      'The Fake Competitor Quote Game',
    ],
    pdfUrl: '#',
    landingPageUrl: '/sales-tactics-guide',
  },
  {
    id: 'claim-survival',
    title: 'Impact Window Claim Survival System',
    tagline: 'Post-Storm Protocol',
    category: 'claims',
    icon: FileText,
    description: 'What to do in the first 72 hours after storm damage. Document correctly or risk losing your claim.',
    pageCount: 15,
    previewPoints: [
      '72-Hour Documentation Checklist',
      'Photos Your Adjuster Needs',
      'Common Denial Reasons & Rebuttals',
      'Emergency Contractor Vetting Guide',
    ],
    pdfUrl: '#',
    bookImageUrl: '/images/claim-kit-book.webp',
    imagePosition: 'bottom-right',
    landingPageUrl: ROUTES.CLAIM_SURVIVAL,
  },
  {
    id: 'spec-checklist',
    title: 'The Window Buyer\'s Specification Checklist',
    tagline: 'Comparison Guide',
    category: 'comparison',
    icon: ClipboardList,
    description: 'The exact specifications to demand from any contractor. Stop comparing apples to oranges.',
    pageCount: 8,
    previewPoints: [
      'ASTM Ratings Explained Simply',
      'U-Factor vs SHGC: What Matters',
      'Warranty Red Flags',
      'Installation Quality Indicators',
    ],
    pdfUrl: '#',
    bookImageUrl: '/images/spec-checklist-book.webp',
    imagePosition: 'bottom-right',
    landingPageUrl: '/spec-checklist-guide',
  },
  {
    id: 'insurance-savings',
    title: 'Florida Insurance Savings Blueprint',
    tagline: 'Premium Reduction',
    category: 'education',
    icon: Wallet,
    description: 'Maximize your insurance discounts with the right windows and documentation. Up to 20% savings.',
    pageCount: 10,
    previewPoints: [
      'Which Windows Qualify for Discounts',
      'NOA Documentation Requirements',
      'How to Request Premium Recalculation',
      'Stack Multiple Discount Programs',
    ],
    pdfUrl: '#',
    bookImageUrl: '/images/insurance-savings-book.webp',
    imagePosition: 'bottom-right',
    landingPageUrl: '/insurance-savings-guide',
  },
];

export function getResourceById(id: string): IntelResource | undefined {
  return intelResources.find(resource => resource.id === id);
}

export function getResourcesByCategory(category: IntelResource['category']): IntelResource[] {
  return intelResources.filter(resource => resource.category === category);
}
