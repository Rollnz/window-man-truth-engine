export interface FastWinOption {
  id: string;
  label: string;
  icon: string;
  value: string;
}

export interface FastWinQuestion {
  id: string;
  title: string;
  subtitle: string;
  options: FastWinOption[];
}

export interface FastWinProduct {
  id: string;
  name: string;
  headline: string;
  statistic: string;
  roiStatement: string;
  icon: string;
  category: 'heat' | 'noise' | 'security' | 'budget' | 'uv';
}

export const fastWinQuestions: FastWinQuestion[] = [
  {
    id: 'pain-point',
    title: "What's driving you crazy about your windows?",
    subtitle: 'Pick the one that bothers you most',
    options: [
      { id: 'heat', label: 'My AC runs constantly', icon: '🔥', value: 'heat' },
      { id: 'noise', label: 'I hear everything outside', icon: '🔊', value: 'noise' },
      { id: 'hurricanes', label: 'Hurricane season scares me', icon: '🌀', value: 'hurricanes' },
      { id: 'security', label: 'Security concerns', icon: '🔓', value: 'security' },
      { id: 'fading', label: 'My furniture is fading', icon: '🛋️', value: 'fading' },
    ],
  },
  {
    id: 'orientation',
    title: 'Which direction gets the most sun?',
    subtitle: 'Think about where it gets hottest',
    options: [
      { id: 'west', label: 'West-facing (afternoon sun)', icon: '☀️', value: 'west' },
      { id: 'east', label: 'East-facing (morning sun)', icon: '🌅', value: 'east' },
      { id: 'south', label: 'South-facing (all day)', icon: '⬆️', value: 'south' },
      { id: 'north', label: 'North-facing (minimal)', icon: '⬇️', value: 'north' },
    ],
  },
  {
    id: 'current-status',
    title: 'What do you have now?',
    subtitle: 'Your current window situation',
    options: [
      { id: 'single', label: 'Single pane (old school)', icon: '1️⃣', value: 'single' },
      { id: 'double', label: 'Double pane (standard)', icon: '2️⃣', value: 'double' },
      { id: 'impact', label: 'Already have impact', icon: '🛡️', value: 'impact' },
      { id: 'mixed', label: 'Mix of different types', icon: '🔀', value: 'mixed' },
    ],
  },
  {
    id: 'budget-priority',
    title: 'What matters most to you?',
    subtitle: 'Be honest - no wrong answer',
    options: [
      { id: 'lowest', label: 'Lowest upfront cost', icon: '💰', value: 'lowest' },
      { id: 'value', label: 'Highest long-term value', icon: '📈', value: 'value' },
      { id: 'payback', label: 'Fastest payback time', icon: '⚡', value: 'payback' },
      { id: 'quality', label: 'Best overall quality', icon: '🏆', value: 'quality' },
    ],
  },
];

export const fastWinProducts: FastWinProduct[] = [
  {
    id: 'low-e-366',
    name: 'Low-E 366 Glass Coating',
    headline: 'The Heat Killer',
    statistic: 'Blocks 95% of infrared heat',
    roiStatement: 'Cuts AC costs by 25-30% — pays for itself in 3-5 years',
    icon: '🔥',
    category: 'heat',
  },
  {
    id: 'laminated-insulated',
    name: 'Laminated Insulated Glass',
    headline: 'The Noise Eliminator',
    statistic: 'STC rating 34+ (vs 26 standard)',
    roiStatement: 'Reduces outside noise by 50% — sleep better tonight',
    icon: '🔊',
    category: 'noise',
  },
  {
    id: 'pvb-impact',
    name: 'PVB Interlayer Impact Glass',
    headline: 'The Fortress Upgrade',
    statistic: 'Meets Miami-Dade missile impact standards',
    roiStatement: 'Up to 20% insurance discount + priceless peace of mind',
    icon: '🛡️',
    category: 'security',
  },
  {
    id: 'double-argon',
    name: 'Double-Pane with Argon',
    headline: 'The Smart Value Pick',
    statistic: '40% better insulation than single pane',
    roiStatement: 'Best ROI per dollar spent — the smart money move',
    icon: '💰',
    category: 'budget',
  },
  {
    id: 'uv-blocking',
    name: 'UV-Blocking Film Upgrade',
    headline: 'The Furniture Saver',
    statistic: 'Blocks 99% of UV rays',
    roiStatement: 'Extends furniture life 5-10 years — protects your investment',
    icon: '🛋️',
    category: 'uv',
  },
];

export interface HonorableMention {
  name: string;
  reason: string;
}

export const honorableMentions: Record<string, HonorableMention[]> = {
  'low-e-366': [
    { name: 'Argon Gas Fill', reason: 'Additional heat reduction when paired' },
    { name: 'Low-E Interior Film', reason: 'Budget alternative for retrofits' },
  ],
  'laminated-insulated': [
    { name: 'Triple-Pane Glass', reason: 'Maximum sound blocking' },
    { name: 'Acoustic Frames', reason: 'Seal gaps for better dampening' },
  ],
  'pvb-impact': [
    { name: 'Hurricane Shutters', reason: 'Additional storm layer' },
    { name: 'Reinforced Frames', reason: 'Complete impact system' },
  ],
  'double-argon': [
    { name: 'Low-E Coating Add-on', reason: 'Boost efficiency for small extra cost' },
    { name: 'Vinyl Frames', reason: 'Low maintenance, good value' },
  ],
  'uv-blocking': [
    { name: 'Tinted Glass', reason: 'Reduces glare while blocking UV' },
    { name: 'Solar Shades', reason: 'Complement window protection' },
  ],
};
