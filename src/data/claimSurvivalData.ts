import { FileText, Camera, Receipt, Shield, Clock, AlertTriangle, Home, HardHat } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface ClaimDocument {
  id: string;
  title: string;
  icon: LucideIcon;
  whatItProves: string;
  whyClaimsFail: string;
  helperTip: string;
  acceptedFormats: string[];
}

export interface PhotoStep {
  id: string;
  title: string;
  description: string;
  items: string[];
}

export interface TimelineNode {
  hour: string;
  title: string;
  action: string;
  critical: boolean;
}

export interface ClaimMistake {
  id: string;
  title: string;
  consequence: string;
}

// The 7 Critical Documents
export const claimDocuments: ClaimDocument[] = [
  {
    id: 'purchase-invoice',
    title: 'Original Purchase Invoice',
    icon: Receipt,
    whatItProves: 'Establishes the date of purchase, exact product specifications, and what you actually paid.',
    whyClaimsFail: 'Adjusters reject claims when homeowners can\'t prove what was originally installed or when it was purchased.',
    helperTip: 'Check your email for the original receipt. Most window companies send digital copies.',
    acceptedFormats: ['PDF', 'JPG', 'PNG'],
  },
  {
    id: 'installation-contract',
    title: 'Installation Contract',
    icon: FileText,
    whatItProves: 'Documents the scope of work, materials used, and contractor commitments.',
    whyClaimsFail: 'Without this, insurers can claim improper installation voided coverage.',
    helperTip: 'This is the signed agreement with your contractor. Different from the invoice.',
    acceptedFormats: ['PDF', 'JPG', 'PNG'],
  },
  {
    id: 'noa-certificate',
    title: 'NOA Certificate (Notice of Acceptance)',
    icon: Shield,
    whatItProves: 'Proves your windows meet Florida Building Code for hurricane protection.',
    whyClaimsFail: 'Insurance companies often deny claims for windows without valid NOA documentation.',
    helperTip: 'Your contractor should have provided this. You can also search the Miami-Dade NOA database.',
    acceptedFormats: ['PDF', 'JPG', 'PNG'],
  },
  {
    id: 'permit-record',
    title: 'Building Permit Record',
    icon: Home,
    whatItProves: 'Shows the installation was inspected and approved by local authorities.',
    whyClaimsFail: 'Unpermitted work can void both warranty and insurance coverage entirely.',
    helperTip: 'Contact your local building department or check their online portal.',
    acceptedFormats: ['PDF', 'JPG', 'PNG'],
  },
  {
    id: 'warranty-document',
    title: 'Manufacturer Warranty',
    icon: FileText,
    whatItProves: 'Defines what defects and damage are covered by the manufacturer.',
    whyClaimsFail: 'Many homeowners discover warranty exclusions only after filing a claim.',
    helperTip: 'Usually included in your closing paperwork or product registration email.',
    acceptedFormats: ['PDF', 'JPG', 'PNG'],
  },
  {
    id: 'pre-storm-photos',
    title: 'Pre-Storm Condition Photos',
    icon: Camera,
    whatItProves: 'Establishes the condition of your windows before any damage occurred.',
    whyClaimsFail: 'Without before photos, adjusters can claim pre-existing damage.',
    helperTip: 'Check your phone photos from move-in day or any home improvement projects.',
    acceptedFormats: ['JPG', 'PNG', 'HEIC'],
  },
  {
    id: 'post-storm-photos',
    title: 'Post-Storm Damage Photos',
    icon: Camera,
    whatItProves: 'Documents the extent and nature of storm damage for your claim.',
    whyClaimsFail: 'Poor quality or incomplete photos lead to underpaid claims.',
    helperTip: 'Take photos immediately after the storm, before any cleanup or repairs.',
    acceptedFormats: ['JPG', 'PNG', 'HEIC'],
  },
];

// Photo Documentation Steps
export const photoSteps: PhotoStep[] = [
  {
    id: 'exterior',
    title: 'Exterior: 4 Elevations',
    description: 'Photograph each side of your home showing all windows.',
    items: [
      'Front elevation (street view)',
      'Back elevation (yard view)',
      'Left side elevation',
      'Right side elevation',
    ],
  },
  {
    id: 'closeups',
    title: 'Close-ups: Damage Details',
    description: 'Get within 3 feet of any visible damage.',
    items: [
      'Cracks in glass or frame',
      'Broken seals (foggy glass)',
      'Dents or impact marks',
      'Water intrusion evidence',
    ],
  },
  {
    id: 'interior',
    title: 'Interior: Leak Evidence',
    description: 'Document any interior damage from window failure.',
    items: [
      'Water stains on walls/floors',
      'Damaged window sills',
      'Mold or moisture signs',
      'Displaced or damaged blinds',
    ],
  },
];

// 24-Hour Post-Storm Timeline
export const timelineNodes: TimelineNode[] = [
  {
    hour: '0-2 Hours',
    title: 'Safety First',
    action: 'Ensure family safety. Do NOT approach damaged windows until debris settles.',
    critical: true,
  },
  {
    hour: '2-6 Hours',
    title: 'Initial Documentation',
    action: 'Take wide-angle photos of all windows from inside and outside. Capture timestamps.',
    critical: true,
  },
  {
    hour: '6-12 Hours',
    title: 'Detailed Photo Protocol',
    action: 'Follow the Photo Walkthrough above. Document every crack, leak, and impact mark.',
    critical: true,
  },
  {
    hour: '12-18 Hours',
    title: 'Temporary Protection',
    action: 'Board up broken windows if safe. Keep receipts for materials.',
    critical: false,
  },
  {
    hour: '18-24 Hours',
    title: 'Insurance Notification',
    action: 'File initial claim with your insurer. Do NOT admit fault or speculate on damage causes.',
    critical: true,
  },
  {
    hour: '24-48 Hours',
    title: 'Contractor Assessment',
    action: 'Get written damage assessments from licensed contractors. Avoid "storm chasers."',
    critical: false,
  },
];

// Adjuster Script
export const adjusterScript = {
  title: 'What to Say When the Adjuster Calls',
  intro: 'Stay calm and factual. Never speculate or admit fault.',
  statements: [
    '"I documented the damage immediately after the storm with timestamped photos."',
    '"I have the original purchase documentation and NOA certificate."',
    '"I\'d like to receive the adjuster\'s assessment in writing."',
    '"Please note that no repairs have been made that could have altered evidence."',
  ],
  warning: 'Do NOT say: "I think it might have been damaged before" or "The windows seemed old."',
};

// Common Mistakes
export const claimMistakes: ClaimMistake[] = [
  {
    id: 'no-photos',
    title: 'Not Taking Photos Before Cleanup',
    consequence: 'Adjusters can claim you exaggerated or fabricated damage after the fact.',
  },
  {
    id: 'unpermitted',
    title: 'Having Unpermitted Window Installation',
    consequence: 'Your entire claim can be denied, and warranty is likely void.',
  },
  {
    id: 'lost-noa',
    title: 'Lost or Missing NOA Certificate',
    consequence: 'Insurance may deny coverage claiming windows don\'t meet code requirements.',
  },
  {
    id: 'verbal-agreements',
    title: 'Relying on Verbal Contractor Promises',
    consequence: 'Without written documentation, you have no legal recourse.',
  },
  {
    id: 'delayed-filing',
    title: 'Waiting Too Long to File',
    consequence: 'Many policies have strict filing deadlines. Missing them voids coverage.',
  },
];

// Receipt Rescue Categories
export const receiptRescueItems = [
  {
    id: 'invoice',
    title: 'Lost Invoice',
    steps: [
      'Check email for order confirmations (search "window" + "invoice")',
      'Contact the contractor directly - they keep records for 7+ years',
      'Check credit card statements for the transaction date',
      'Request duplicate from manufacturer using serial numbers',
    ],
  },
  {
    id: 'permit',
    title: 'Missing Permit',
    steps: [
      'Visit your county\'s building department website',
      'Search by address in the online permit portal',
      'Request certified copies in person if needed',
      'Your contractor may have copies in their files',
    ],
  },
  {
    id: 'warranty',
    title: 'Can\'t Find Warranty',
    steps: [
      'Search email for registration confirmation',
      'Contact manufacturer with your window serial numbers',
      'Check the original closing documents from purchase',
      'The contractor should have warranty documentation on file',
    ],
  },
  {
    id: 'photos',
    title: 'No Pre-Storm Photos',
    steps: [
      'Check Google Photos, iCloud, or phone backups',
      'Look for home listing photos from when you bought',
      'Real estate agents keep listing photos for years',
      'Insurance company may have inspection photos',
    ],
  },
];

// Tool Cross-Links
export const relatedTools = [
  {
    id: 'comparison',
    name: 'Quote Comparison Scanner',
    description: 'Compare contractor quotes apples-to-apples',
    path: '/comparison',
  },
  {
    id: 'risk-diagnostic',
    name: 'Protection Gap Finder',
    description: 'Identify insurance coverage blind spots',
    path: '/risk-diagnostic',
  },
  {
    id: 'evidence',
    name: 'Real Homeowner Case Studies',
    description: 'Learn from others\' claim experiences',
    path: '/evidence',
  },
  {
    id: 'expert',
    name: 'Windowman AI Advisor',
    description: 'Get instant answers to claim questions',
    path: '/expert',
  },
];
