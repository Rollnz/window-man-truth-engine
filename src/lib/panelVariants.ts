import type { PanelVariant } from '@/hooks/usePanelVariant';

export type AiQaMode = 'proof' | 'diagnostic' | 'savings' | 'storm' | 'concierge';

export type ThirdCtaCategory =
  | 'proof'
  | 'diagnostic'
  | 'incentive'
  | 'urgency'
  | 'ai_concierge';

export interface PanelVariantConfig {
  name: string;
  headline: string;
  subheadline: string;
  thirdCtaLabel: string;
  thirdCtaSubtext: string;
  thirdCtaCategory: ThirdCtaCategory;
  aiQaMode: AiQaMode;
  callCtaLabel: string;
  callCtaSubtext: string;
  estimateCtaLabel: string;
  estimateCtaSubtext: string;
}

export const PANEL_VARIANT_CONFIG: Record<PanelVariant, PanelVariantConfig> = {
  A: {
    name: 'Evidence Vault',
    headline: 'The Truth About Your Windows',
    subheadline: 'Florida homeowners save an average of $11,500 with our analysis',
    thirdCtaLabel: 'See Real Results',
    thirdCtaSubtext: 'Real savings, verified results',
    thirdCtaCategory: 'proof',
    aiQaMode: 'proof',
    callCtaLabel: 'Speak to an Expert Now',
    callCtaSubtext: 'AI-assisted, no hold time',
    estimateCtaLabel: 'Request a Free Estimate',
    estimateCtaSubtext: 'Response within 24 hours',
  },
  B: {
    name: '30-Second Diagnostic',
    headline: "What's Really Going On With Your Windows?",
    subheadline: 'Answer 3 questions. Get your risk level.',
    thirdCtaLabel: 'Find Out in 30 Seconds',
    thirdCtaSubtext: 'Quick, no-commitment assessment',
    thirdCtaCategory: 'diagnostic',
    aiQaMode: 'diagnostic',
    callCtaLabel: 'Talk to an Expert',
    callCtaSubtext: 'Immediate consultation',
    estimateCtaLabel: 'Skip to Estimate Request',
    estimateCtaSubtext: 'Go straight to the form',
  },
  C: {
    name: 'Insider Report',
    headline: 'Your Free Window Assessment',
    subheadline: 'See how much Florida homeowners are overpaying',
    thirdCtaLabel: 'Unlock Your Savings Report',
    thirdCtaSubtext: 'Free — $299 value',
    thirdCtaCategory: 'incentive',
    aiQaMode: 'savings',
    callCtaLabel: 'Call for Priority Scheduling',
    callCtaSubtext: 'Available now',
    estimateCtaLabel: 'Request an Estimate',
    estimateCtaSubtext: 'No commitment',
  },
  D: {
    name: 'Storm Shield',
    headline: 'Is Your Home Ready?',
    subheadline: 'Florida homeowners face thousands in average storm damage with outdated windows',
    thirdCtaLabel: 'Check Your Storm Readiness',
    thirdCtaSubtext: '2-minute check',
    thirdCtaCategory: 'urgency',
    aiQaMode: 'storm',
    callCtaLabel: 'Speak to an Expert Now',
    callCtaSubtext: 'Immediate consultation',
    estimateCtaLabel: 'Request Storm Assessment',
    estimateCtaSubtext: 'Free, no obligation',
  },
  E: {
    name: 'Window Man Concierge',
    headline: 'Window Man Is Standing By',
    subheadline: 'Get honest answers. No sales pitch.',
    thirdCtaLabel: 'Ask Me Anything About Windows',
    thirdCtaSubtext: 'AI-powered, instant answers',
    thirdCtaCategory: 'ai_concierge',
    aiQaMode: 'concierge',
    callCtaLabel: 'Prefer to Talk?',
    callCtaSubtext: 'Call our expert line',
    estimateCtaLabel: 'Skip to Estimate',
    estimateCtaSubtext: 'Go straight to the form',
  },
};
