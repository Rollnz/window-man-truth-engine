export interface VerifiedStat {
  label: string;
  before: string;
  after: string;
  change: string;
  icon: string;
}

export interface ToolReference {
  toolId: string;
  toolName: string;
  toolPath: string;
  context: string;
}

export type MissionType = 'heat' | 'hurricane' | 'noise' | 'security' | 'cost';

export interface CaseStudy {
  id: string;
  caseNumber: string;
  agentName: string;
  location: string;
  missionType: MissionType;
  missionObjective: string;
  theProblem: string;
  theSolution: string;
  verifiedStats: VerifiedStat[];
  toolsUsed: ToolReference[];
  testimonialQuote: string;
  status: 'MISSION ACCOMPLISHED';
  completionDate: string;
  beforePhoto?: string;
  afterPhoto?: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'case-492',
    caseNumber: 'CASE #492',
    agentName: 'Agent M. Thompson',
    location: 'Miami Beach, FL',
    missionType: 'heat',
    missionObjective: 'Stop Energy Waste',
    theProblem: 'Our AC ran 18 hours a day. The west-facing windows turned our living room into a sauna every afternoon. We were bleeding money on energy bills.',
    theSolution: 'Low-E 366 Impact Glass with Argon Fill',
    verifiedStats: [
      { label: 'AC Bill', before: '$450/mo', after: '$270/mo', change: '-40%', icon: '💰' },
      { label: 'AC Runtime', before: '18 hrs/day', after: '12 hrs/day', change: '-35%', icon: '❄️' },
      { label: 'Comfort Level', before: 'Unbearable', after: 'Perfect', change: '+100%', icon: '🌡️' },
    ],
    toolsUsed: [
      { toolId: 'cost-calculator', toolName: 'Cost Calculator', toolPath: '/cost-calculator', context: 'Used to uncover $15k in hidden energy costs over 10 years' },
      { toolId: 'fast-win', toolName: 'Fast Win Detector', toolPath: '/fast-win', context: 'Identified Low-E as their #1 upgrade priority' },
    ],
    testimonialQuote: 'Best investment we ever made. The house is actually comfortable now, and our energy bill dropped by almost half.',
    status: 'MISSION ACCOMPLISHED',
    completionDate: 'Q3 2024',
  },
  {
    id: 'case-387',
    caseNumber: 'CASE #387',
    agentName: 'Agent R. Valdez',
    location: 'Fort Lauderdale, FL',
    missionType: 'hurricane',
    missionObjective: 'Hurricane Defense',
    theProblem: 'Category 4 Irma shattered our neighbor\'s windows. We got lucky, but we couldn\'t sleep during storm season anymore. The anxiety was killing us.',
    theSolution: 'PGT WinGuard Impact Windows - Large Missile Rated',
    verifiedStats: [
      { label: 'Insurance', before: '$4,200/yr', after: '$3,276/yr', change: '-22%', icon: '🏠' },
      { label: 'Storm Prep Time', before: '6 hours', after: '0 hours', change: '-100%', icon: '⏱️' },
      { label: 'Peace of Mind', before: 'None', after: 'Total', change: '∞', icon: '😌' },
    ],
    toolsUsed: [
      { toolId: 'risk-diagnostic', toolName: 'Risk Diagnostic', toolPath: '/risk-diagnostic', context: 'Revealed a 67% protection gap in storm coverage' },
      { toolId: 'comparison', toolName: 'Comparison Tool', toolPath: '/comparison', context: 'Compared impact ratings between 3 vendors' },
    ],
    testimonialQuote: 'We rode out a Category 3 in our living room last season. Not a scratch. Worth every penny.',
    status: 'MISSION ACCOMPLISHED',
    completionDate: 'Q2 2024',
  },
  {
    id: 'case-541',
    caseNumber: 'CASE #541',
    agentName: 'Agent K. Nguyen',
    location: 'Orlando, FL',
    missionType: 'noise',
    missionObjective: 'Noise Cancellation',
    theProblem: 'We live near I-4. The traffic noise was constant. Working from home was impossible. We could hear trucks at 2 AM.',
    theSolution: 'Laminated Glass with Enhanced Acoustic Interlayer',
    verifiedStats: [
      { label: 'Noise Level', before: '72 dB', after: '36 dB', change: '-50%', icon: '🔇' },
      { label: 'Sleep Quality', before: 'Poor', after: 'Excellent', change: '+200%', icon: '😴' },
      { label: 'WFH Productivity', before: '4 hrs/day', after: '8 hrs/day', change: '+100%', icon: '💼' },
    ],
    toolsUsed: [
      { toolId: 'fast-win', toolName: 'Fast Win Detector', toolPath: '/fast-win', context: 'Acoustic glass ranked #1 for their pain point' },
      { toolId: 'reality-check', toolName: 'Reality Check', toolPath: '/reality-check', context: 'Scored 23/100 on noise infiltration' },
    ],
    testimonialQuote: 'I forgot we live near a highway. Seriously. It\'s like someone turned off the world outside.',
    status: 'MISSION ACCOMPLISHED',
    completionDate: 'Q4 2024',
  },
  {
    id: 'case-298',
    caseNumber: 'CASE #298',
    agentName: 'Agent J. Martinez',
    location: 'Tampa, FL',
    missionType: 'security',
    missionObjective: 'Intrusion Prevention',
    theProblem: 'We had two break-in attempts in 18 months. The old single-pane windows were basically an open invitation. We felt unsafe in our own home.',
    theSolution: 'Impact-Rated Laminated Glass with Reinforced Frames',
    verifiedStats: [
      { label: 'Break-in Attempts', before: '2 in 18mo', after: '0', change: '-100%', icon: '🔒' },
      { label: 'Entry Resistance', before: '3 seconds', after: '10+ minutes', change: '+2000%', icon: '🛡️' },
      { label: 'Insurance Discount', before: '0%', after: '15%', change: '+15%', icon: '💵' },
    ],
    toolsUsed: [
      { toolId: 'risk-diagnostic', toolName: 'Risk Diagnostic', toolPath: '/risk-diagnostic', context: 'Identified critical security vulnerability' },
      { toolId: 'comparison', toolName: 'Comparison Tool', toolPath: '/comparison', context: 'Compared impact resistance ratings' },
    ],
    testimonialQuote: 'My kids can sleep with their windows facing the street now. That security alone was worth the investment.',
    status: 'MISSION ACCOMPLISHED',
    completionDate: 'Q1 2024',
  },
  {
    id: 'case-445',
    caseNumber: 'CASE #445',
    agentName: 'Agent S. Williams',
    location: 'Naples, FL',
    missionType: 'cost',
    missionObjective: 'Long-Term ROI Optimization',
    theProblem: 'A competitor quoted us $8k less for "builder grade" windows. We almost pulled the trigger. Then we did the math on total ownership cost.',
    theSolution: 'Tier 3 Triple-Pane Impact Windows with Lifetime Warranty',
    verifiedStats: [
      { label: '10-Year TCO', before: '$42,000', after: '$24,000', change: '-43%', icon: '📊' },
      { label: 'Warranty Claims', before: '3 (denied)', after: '0 needed', change: '-100%', icon: '✅' },
      { label: 'Energy Savings', before: '$0', after: '$18,000', change: '+$18k', icon: '⚡' },
    ],
    toolsUsed: [
      { toolId: 'cost-calculator', toolName: 'Cost Calculator', toolPath: '/cost-calculator', context: 'Calculated true 10-year cost of cheap vs quality' },
      { toolId: 'comparison', toolName: 'Comparison Tool', toolPath: '/comparison', context: 'Side-by-side warranty comparison revealed the gap' },
    ],
    testimonialQuote: 'The "cheap" windows would have cost us $18k more over 10 years. The math doesn\'t lie.',
    status: 'MISSION ACCOMPLISHED',
    completionDate: 'Q2 2024',
  },
  {
    id: 'case-623',
    caseNumber: 'CASE #623',
    agentName: 'Agent D. Patel',
    location: 'Boca Raton, FL',
    missionType: 'heat',
    missionObjective: 'Solar Heat Rejection',
    theProblem: 'Our south-facing sunroom was unusable 8 months of the year. The heat was so intense our furniture was fading. We called it "the oven."',
    theSolution: 'Spectrally Selective Low-E Coating with Solar Control',
    verifiedStats: [
      { label: 'Room Temp', before: '95°F peak', after: '76°F peak', change: '-20%', icon: '🌡️' },
      { label: 'UV Transmission', before: '75%', after: '1%', change: '-99%', icon: '☀️' },
      { label: 'Usable Hours', before: '4 mo/year', after: '12 mo/year', change: '+200%', icon: '🏠' },
    ],
    toolsUsed: [
      { toolId: 'fast-win', toolName: 'Fast Win Detector', toolPath: '/fast-win', context: 'Prioritized solar control for their orientation' },
      { toolId: 'cost-calculator', toolName: 'Cost Calculator', toolPath: '/cost-calculator', context: 'Projected $12k in AC savings over 10 years' },
    ],
    testimonialQuote: 'We actually use our sunroom now. Year-round. And our couch stopped fading.',
    status: 'MISSION ACCOMPLISHED',
    completionDate: 'Q3 2024',
  },
  {
    id: 'case-512',
    caseNumber: 'CASE #512',
    agentName: 'Agent L. Chen',
    location: 'Key West, FL',
    missionType: 'hurricane',
    missionObjective: 'Category 5 Survival',
    theProblem: 'After Irma, we swore we\'d never evacuate again. But our old windows couldn\'t handle anything above a Cat 2. Living in Key West, that\'s not acceptable.',
    theSolution: 'CGI Sentinel Impact Windows - HVHZ Rated',
    verifiedStats: [
      { label: 'Wind Rating', before: 'Cat 2', after: 'Cat 5+', change: '+150%', icon: '🌀' },
      { label: 'Evacuations', before: '3/year', after: '0', change: '-100%', icon: '🚗' },
      { label: 'Property Value', before: 'Baseline', after: '+$45k', change: '+12%', icon: '📈' },
    ],
    toolsUsed: [
      { toolId: 'risk-diagnostic', toolName: 'Risk Diagnostic', toolPath: '/risk-diagnostic', context: 'Showed 89% vulnerability to major storms' },
      { toolId: 'reality-check', toolName: 'Reality Check', toolPath: '/reality-check', context: 'Reality score of 18/100 triggered action' },
    ],
    testimonialQuote: 'Hurricane Ian passed right over us. We watched from our living room with a glass of wine. Not a single leak.',
    status: 'MISSION ACCOMPLISHED',
    completionDate: 'Q4 2023',
  },
  {
    id: 'case-377',
    caseNumber: 'CASE #377',
    agentName: 'Agent B. Robinson',
    location: 'Jacksonville, FL',
    missionType: 'noise',
    missionObjective: 'Home Office Enablement',
    theProblem: 'My wife and I both work from home. The kids are home. The dog barks at everything. And we could hear every car, every lawnmower, every airplane.',
    theSolution: 'Dual-Pane Acoustic Glass with Triple Seal System',
    verifiedStats: [
      { label: 'Ambient Noise', before: '65 dB', after: '28 dB', change: '-57%', icon: '🔈' },
      { label: 'Video Call Quality', before: 'Unusable', after: 'Professional', change: '∞', icon: '💻' },
      { label: 'Focus Time', before: '2 hrs/day', after: '6 hrs/day', change: '+200%', icon: '🎯' },
    ],
    toolsUsed: [
      { toolId: 'fast-win', toolName: 'Fast Win Detector', toolPath: '/fast-win', context: 'Noise reduction ranked as #1 priority' },
      { toolId: 'comparison', toolName: 'Comparison Tool', toolPath: '/comparison', context: 'Compared STC ratings across products' },
    ],
    testimonialQuote: 'Our clients have no idea we have three kids and a German Shepherd. The silence is unreal.',
    status: 'MISSION ACCOMPLISHED',
    completionDate: 'Q1 2024',
  },
];

// Aggregate stats for the hero section
export const aggregateStats = {
  totalMissions: 47,
  totalSaved: '$2.4M',
  windowsUpgraded: '1,200+',
  avgInsuranceSavings: '18%',
};

// Filter labels for the filter bar
export const missionTypeLabels: Record<MissionType | 'all', string> = {
  all: 'All Missions',
  heat: 'Heat Reduction',
  hurricane: 'Hurricane Defense',
  noise: 'Noise Cancellation',
  security: 'Security',
  cost: 'Cost Savings',
};
