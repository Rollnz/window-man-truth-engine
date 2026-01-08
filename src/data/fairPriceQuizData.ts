// Fair Price Diagnostic Quiz Data - Based on document specifications

export interface QuizOption {
  id: string;
  label: string;
  value: string | number;
}

export interface QuizQuestionData {
  id: number;
  text: string;
  type: 'select' | 'number' | 'multiselect' | 'currency' | 'date';
  options?: QuizOption[];
  placeholder?: string;
  psychologicalPurpose: string;
}

export const quizQuestions: QuizQuestionData[] = [
  {
    id: 1,
    text: "What type of property is this for?",
    type: 'select',
    options: [
      { id: 'single_family', label: 'Single Family Home', value: 'single_family' },
      { id: 'condo', label: 'Condo/Townhome', value: 'condo' },
      { id: 'multi_family', label: 'Multi-Family', value: 'multi_family' },
      { id: 'commercial', label: 'Commercial', value: 'commercial' },
    ],
    psychologicalPurpose: 'zero_friction_entry',
  },
  {
    id: 2,
    text: "Approximate square footage?",
    type: 'select',
    options: [
      { id: 'under_1500', label: 'Under 1,500 sq ft', value: 'under_1500' },
      { id: '1500_2000', label: '1,500 - 2,000 sq ft', value: '1500_2000' },
      { id: '2000_2500', label: '2,000 - 2,500 sq ft', value: '2000_2500' },
      { id: '2500_3000', label: '2,500 - 3,000 sq ft', value: '2500_3000' },
      { id: 'over_3000', label: '3,000+ sq ft', value: 'over_3000' },
    ],
    psychologicalPurpose: 'easy_recall_data',
  },
  {
    id: 3,
    text: "How many windows are you replacing?",
    type: 'number',
    placeholder: 'Enter number of windows',
    psychologicalPurpose: 'engagement_increase',
  },
  {
    id: 4,
    text: "What did the contractor say about the window brand?",
    type: 'multiselect',
    options: [
      { id: 'best_brand', label: "Said it's the best brand available", value: 'best_brand' },
      { id: 'always_use', label: "Said it's what they always use", value: 'always_use' },
      { id: 'only_code', label: "Said it's the only brand that meets code", value: 'only_code' },
      { id: 'no_mention', label: "Didn't mention brand at all", value: 'no_mention' },
      { id: 'multiple_options', label: "Offered multiple brand options", value: 'multiple_options' },
      { id: 'let_choose', label: "Let me choose the brand", value: 'let_choose' },
    ],
    psychologicalPurpose: 'red_flag_awareness_trigger',
  },
  {
    id: 5,
    text: "What's the total quote amount you received?",
    type: 'currency',
    placeholder: 'Enter quote amount',
    psychologicalPurpose: 'price_intelligence_capture',
  },
  {
    id: 6,
    text: "When did you receive this quote?",
    type: 'select',
    options: [
      { id: 'within_last_week', label: 'Within the last week', value: 'within_last_week' },
      { id: '1_4_weeks', label: '1-4 weeks ago', value: '1_4_weeks' },
      { id: '1_3_months', label: '1-3 months ago', value: '1_3_months' },
      { id: '3_plus_months', label: '3+ months ago', value: '3_plus_months' },
    ],
    psychologicalPurpose: 'urgency_assessment',
  },
  {
    id: 7,
    text: "How many other quotes have you received?",
    type: 'select',
    options: [
      { id: 'first_quote', label: 'This is my first quote', value: 'first_quote' },
      { id: '1_other', label: '1 other quote', value: '1_other' },
      { id: '2_3_others', label: '2-3 other quotes', value: '2_3_others' },
      { id: '4_plus', label: '4+ quotes', value: '4_plus' },
    ],
    psychologicalPurpose: 'buying_stage_identification',
  },
];

// Analysis theater sequence - exactly from doc
export const analysisSteps = [
  { duration: 800, message: '🔍 Analyzing your quote details...', progress: 15 },
  { duration: 900, message: '📊 Comparing against 1,247 Florida installations...', progress: 35 },
  { duration: 1100, message: '🚩 Checking for common red flags...', progress: 60 },
  { duration: 800, message: '💰 Calculating fair market value range...', progress: 80 },
  { duration: 600, message: '📋 Generating your Fair Price Report...', progress: 100 },
];

// Pricing constants from document
export const PRICE_PER_WINDOW = {
  budget: 850,
  standard: 1200,
  premium: 1650,
};

export const SQFT_MULTIPLIER: Record<string, number> = {
  under_1500: 0.9,
  '1500_2000': 1.0,
  '2000_2500': 1.05,
  '2500_3000': 1.1,
  over_3000: 1.15,
};

export type GradeLevel = 
  | 'really_bad'
  | 'bad'
  | 'not_too_bad'
  | 'fair'
  | 'decent'
  | 'good'
  | 'great';

export interface GradeInfo {
  level: GradeLevel;
  label: string;
  verdict: string;
  color: string;
  emoji: string;
}

export const gradeConfig: Record<GradeLevel, GradeInfo> = {
  really_bad: {
    level: 'really_bad',
    label: 'Really Bad',
    verdict: '🚨 MAJOR RED FLAGS - Quote is significantly overpriced',
    color: 'text-destructive',
    emoji: '🚨',
  },
  bad: {
    level: 'bad',
    label: 'Bad',
    verdict: '⚠️ PROCEED WITH CAUTION - Quote appears inflated',
    color: 'text-orange-500',
    emoji: '⚠️',
  },
  not_too_bad: {
    level: 'not_too_bad',
    label: 'Not Too Bad',
    verdict: '⚠️ SLIGHTLY HIGH - Room for negotiation',
    color: 'text-yellow-500',
    emoji: '⚠️',
  },
  fair: {
    level: 'fair',
    label: 'Fair',
    verdict: '✓ FAIR RANGE - Acceptable but could be better',
    color: 'text-yellow-400',
    emoji: '✓',
  },
  decent: {
    level: 'decent',
    label: 'Decent',
    verdict: '✓ COMPETITIVE - Within market standards',
    color: 'text-green-400',
    emoji: '✓',
  },
  good: {
    level: 'good',
    label: 'Good',
    verdict: '✓✓ GOOD DEAL - Below average pricing',
    color: 'text-green-500',
    emoji: '✓✓',
  },
  great: {
    level: 'great',
    label: 'Great',
    verdict: '🎯 EXCELLENT - Well below market average',
    color: 'text-green-600',
    emoji: '🎯',
  },
};

// Red flag options that indicate contractor manipulation tactics
export const RED_FLAG_OPTIONS = ['best_brand', 'always_use', 'only_code', 'no_mention'];
