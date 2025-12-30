export interface QuizOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  questionNumber: number;
  question: string;
  questionType: 'true-false' | 'multiple-choice';
  options: QuizOption[];
  correctAnswer: string;
  revealTitle: string;
  revealExplanation: string;
  trapReason: string; // Why most people get this wrong
}

export interface QuizResult {
  minScore: number;
  maxScore: number;
  vulnerabilityLevel: 'CRITICAL' | 'MODERATE' | 'LOW';
  title: string;
  subtitle: string;
  prescription: string;
  ctaText: string;
  ctaPath: string;
  badgeColor: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    questionNumber: 1,
    question: 'True or False: All "Impact Windows" are rated for hurricanes.',
    questionType: 'true-false',
    options: [
      { id: 'q1-true', label: 'True', isCorrect: false },
      { id: 'q1-false', label: 'False', isCorrect: true },
    ],
    correctAnswer: 'False',
    revealTitle: 'INCORRECT ASSUMPTION DETECTED',
    revealExplanation: 'Many "impact windows" are only rated for break-in resistance, NOT Category 5 missile impacts. The term "impact" is loosely used in marketing. Always verify the specific ASTM E1996 Large Missile rating.',
    trapReason: 'Salespeople use "impact" as a catch-all term to confuse buyers.',
  },
  {
    id: 'q2',
    questionNumber: 2,
    question: 'What is the industry standard markup on windows?',
    questionType: 'multiple-choice',
    options: [
      { id: 'q2-10', label: '10%', isCorrect: false },
      { id: 'q2-25', label: '25%', isCorrect: false },
      { id: 'q2-50', label: '50%', isCorrect: false },
      { id: 'q2-300', label: '300%', isCorrect: true },
    ],
    correctAnswer: '300%',
    revealTitle: 'PRICING INTELLIGENCE REVEALED',
    revealExplanation: 'The window industry operates on massive markups—often 300% or more. This is why "discounts" of 40-50% are common: they\'re simply reducing an artificially inflated price back toward reality.',
    trapReason: 'Most consumers have no baseline for fair window pricing.',
  },
  {
    id: 'q3',
    questionNumber: 3,
    question: 'If a salesperson offers a "Today Only" discount, what does it really mean?',
    questionType: 'multiple-choice',
    options: [
      { id: 'q3-real', label: 'A genuine limited-time offer', isCorrect: false },
      { id: 'q3-manager', label: 'They need manager approval tomorrow', isCorrect: false },
      { id: 'q3-anchor', label: 'A fake price anchor to create panic', isCorrect: true },
    ],
    correctAnswer: 'A fake price anchor to create panic',
    revealTitle: 'MANIPULATION TACTIC IDENTIFIED',
    revealExplanation: 'The "today only" discount is a classic high-pressure sales tactic. The price will almost certainly be available next week, next month, and next year. It\'s designed to prevent you from comparison shopping.',
    trapReason: 'Fear of missing out (FOMO) overrides logical decision-making.',
  },
  {
    id: 'q4',
    questionNumber: 4,
    question: 'Which gas fill actually lasts longer than 5 years?',
    questionType: 'multiple-choice',
    options: [
      { id: 'q4-argon', label: 'Argon (if sealed correctly)', isCorrect: true },
      { id: 'q4-krypton', label: 'Krypton (always lasts)', isCorrect: false },
      { id: 'q4-none', label: 'None of them last', isCorrect: false },
    ],
    correctAnswer: 'Argon (if sealed correctly)',
    revealTitle: 'SEAL INTEGRITY IS EVERYTHING',
    revealExplanation: 'Argon gas fill CAN last 15-20+ years—but only if the seal is properly manufactured. Many cheap windows have poor seals that fail within 5 years, causing fog between panes and losing insulation value.',
    trapReason: 'Gas fill is marketed as a feature, but seal quality is what matters.',
  },
  {
    id: 'q5',
    questionNumber: 5,
    question: 'Can you legally install your own impact windows in Florida?',
    questionType: 'true-false',
    options: [
      { id: 'q5-yes', label: 'Yes', isCorrect: true },
      { id: 'q5-no', label: 'No', isCorrect: false },
    ],
    correctAnswer: 'Yes',
    revealTitle: 'LEGAL BUT COSTLY',
    revealExplanation: 'Yes, homeowners can legally install their own windows in Florida. HOWEVER, without a licensed contractor and specific NOA (Notice of Acceptance) inspections, you may lose significant insurance discounts—often 15-20% of your premium.',
    trapReason: 'DIY saves money upfront but costs thousands in lost insurance savings.',
  },
];

export const quizResults: QuizResult[] = [
  {
    minScore: 0,
    maxScore: 2,
    vulnerabilityLevel: 'CRITICAL',
    title: 'VULNERABILITY LEVEL: CRITICAL',
    subtitle: 'High-Risk Buyer Profile Detected',
    prescription: 'You are a prime target for predatory contractors. Without intervention, you could overpay by $5,000-$15,000 on your next window purchase.',
    ctaText: 'Get the Kitchen Table Defense Kit',
    ctaPath: '/intel?resource=defense-kit',
    badgeColor: 'bg-destructive',
  },
  {
    minScore: 3,
    maxScore: 4,
    vulnerabilityLevel: 'MODERATE',
    title: 'VULNERABILITY LEVEL: MODERATE',
    subtitle: 'Partial Knowledge Detected',
    prescription: 'You know the basics, but the details will cost you. The industry is designed to exploit partial knowledge. You need precise specifications to negotiate effectively.',
    ctaText: 'Use the Comparison Engine',
    ctaPath: '/comparison',
    badgeColor: 'bg-yellow-500',
  },
  {
    minScore: 5,
    maxScore: 5,
    vulnerabilityLevel: 'LOW',
    title: 'VULNERABILITY LEVEL: LOW',
    subtitle: 'Agent Status Achieved',
    prescription: 'Impressive. You are ready to negotiate from a position of strength. Use this knowledge to get competitive quotes and don\'t accept the first offer.',
    ctaText: 'Beat Your Quote',
    ctaPath: '/comparison',
    badgeColor: 'bg-primary',
  },
];

export function getQuizResult(score: number): QuizResult {
  return quizResults.find(
    (result) => score >= result.minScore && score <= result.maxScore
  ) || quizResults[0];
}

export function calculateVulnerabilityLabel(score: number): 'CRITICAL' | 'MODERATE' | 'LOW' {
  if (score <= 2) return 'CRITICAL';
  if (score <= 4) return 'MODERATE';
  return 'LOW';
}
