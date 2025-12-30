import { CloudLightning, Lock, ShieldAlert, FileWarning, LucideIcon } from 'lucide-react';

export interface RiskQuestion {
  id: string;
  question: string;
  description?: string;
  type: 'buttons' | 'yes-no';
  options: { value: string; label: string; riskScore: number }[];
}

export interface RiskCategory {
  id: 'storm' | 'security' | 'insurance' | 'warranty';
  title: string;
  shortTitle: string;
  icon: LucideIcon;
  weight: number;
  description: string;
  questions: RiskQuestion[];
}

export const riskCategories: RiskCategory[] = [
  {
    id: 'storm',
    title: 'Storm Protection',
    shortTitle: 'Storm',
    icon: CloudLightning,
    weight: 0.30,
    description: 'How protected is your home against hurricane and severe weather damage?',
    questions: [
      {
        id: 'storm-1',
        question: 'Do you live in a hurricane-prone zone?',
        description: 'Florida, Gulf Coast, and Atlantic coastal areas are considered hurricane-prone.',
        type: 'buttons',
        options: [
          { value: 'yes', label: 'Yes', riskScore: 30 },
          { value: 'unsure', label: 'Not Sure', riskScore: 20 },
          { value: 'no', label: 'No', riskScore: 5 },
        ],
      },
      {
        id: 'storm-2',
        question: 'Are your current windows hurricane-rated?',
        description: 'Impact-rated windows have special glass and frames designed to withstand hurricane-force winds.',
        type: 'buttons',
        options: [
          { value: 'no', label: 'No', riskScore: 35 },
          { value: 'unsure', label: "Don't Know", riskScore: 20 },
          { value: 'some', label: 'Some Are', riskScore: 15 },
          { value: 'yes', label: 'Yes, All', riskScore: 0 },
        ],
      },
      {
        id: 'storm-3',
        question: 'Have you experienced storm damage in the past 10 years?',
        description: 'Previous damage often indicates ongoing vulnerability.',
        type: 'buttons',
        options: [
          { value: 'yes-major', label: 'Yes, Major', riskScore: 35 },
          { value: 'yes-minor', label: 'Yes, Minor', riskScore: 20 },
          { value: 'no', label: 'No', riskScore: 5 },
        ],
      },
    ],
  },
  {
    id: 'security',
    title: 'Security Vulnerability',
    shortTitle: 'Security',
    icon: Lock,
    weight: 0.25,
    description: 'How secure are your windows against break-ins and intrusion attempts?',
    questions: [
      {
        id: 'security-1',
        question: 'Do you have ground-floor accessible windows?',
        description: 'Ground floor and easily reachable windows are primary entry points for intruders.',
        type: 'buttons',
        options: [
          { value: 'many', label: 'Yes, Many', riskScore: 30 },
          { value: 'some', label: 'Some', riskScore: 15 },
          { value: 'few', label: 'Very Few', riskScore: 5 },
          { value: 'no', label: 'No', riskScore: 0 },
        ],
      },
      {
        id: 'security-2',
        question: 'How would you rate your neighborhood security?',
        description: 'Consider crime rates and recent incidents in your area.',
        type: 'buttons',
        options: [
          { value: 'low', label: 'Low Security', riskScore: 25 },
          { value: 'moderate', label: 'Moderate', riskScore: 15 },
          { value: 'high', label: 'High Security', riskScore: 5 },
        ],
      },
      {
        id: 'security-3',
        question: 'What type of locks are on your windows?',
        description: 'Impact-rated windows include reinforced multi-point locking systems.',
        type: 'buttons',
        options: [
          { value: 'standard', label: 'Standard', riskScore: 20 },
          { value: 'reinforced', label: 'Reinforced', riskScore: 10 },
          { value: 'unsure', label: "Don't Know", riskScore: 15 },
          { value: 'impact', label: 'Impact-Rated', riskScore: 0 },
        ],
      },
    ],
  },
  {
    id: 'insurance',
    title: 'Insurance Exposure',
    shortTitle: 'Insurance',
    icon: ShieldAlert,
    weight: 0.25,
    description: 'Are you maximizing your insurance benefits and minimizing your exposure?',
    questions: [
      {
        id: 'insurance-1',
        question: 'What is your current hurricane deductible?',
        description: 'Higher deductibles mean more out-of-pocket costs when filing a claim.',
        type: 'buttons',
        options: [
          { value: 'high', label: '$5,000+', riskScore: 30 },
          { value: 'medium', label: '$2,000-$5,000', riskScore: 15 },
          { value: 'low', label: 'Under $2,000', riskScore: 5 },
          { value: 'unsure', label: "Don't Know", riskScore: 20 },
        ],
      },
      {
        id: 'insurance-2',
        question: 'Do you currently receive an impact window insurance discount?',
        description: 'Most Florida insurers offer 15-25% discounts for homes with impact windows.',
        type: 'buttons',
        options: [
          { value: 'no', label: 'No', riskScore: 25 },
          { value: 'unsure', label: "Don't Know", riskScore: 15 },
          { value: 'yes', label: 'Yes', riskScore: 0 },
        ],
      },
      {
        id: 'insurance-3',
        question: 'When was your last wind mitigation inspection?',
        description: 'Regular inspections can unlock additional insurance savings.',
        type: 'buttons',
        options: [
          { value: 'never', label: 'Never', riskScore: 25 },
          { value: 'old', label: '5+ Years Ago', riskScore: 15 },
          { value: 'recent', label: '2-5 Years', riskScore: 10 },
          { value: 'current', label: 'Within 2 Years', riskScore: 0 },
        ],
      },
    ],
  },
  {
    id: 'warranty',
    title: 'Warranty Coverage',
    shortTitle: 'Warranty',
    icon: FileWarning,
    weight: 0.20,
    description: 'Are your windows properly covered if something goes wrong?',
    questions: [
      {
        id: 'warranty-1',
        question: 'Do you know your current window warranty status?',
        description: 'Many homeowners are unaware their warranty has expired or what it covers.',
        type: 'buttons',
        options: [
          { value: 'expired', label: 'Expired', riskScore: 25 },
          { value: 'unknown', label: "Don't Know", riskScore: 20 },
          { value: 'partial', label: 'Limited Coverage', riskScore: 10 },
          { value: 'full', label: 'Full Coverage', riskScore: 0 },
        ],
      },
      {
        id: 'warranty-2',
        question: 'Were your windows professionally installed with permits?',
        description: 'Unpermitted installations can void warranties and cause issues with insurance claims.',
        type: 'buttons',
        options: [
          { value: 'no', label: 'No', riskScore: 25 },
          { value: 'unsure', label: "Don't Know", riskScore: 20 },
          { value: 'yes', label: 'Yes', riskScore: 0 },
        ],
      },
      {
        id: 'warranty-3',
        question: 'Is labor covered in your warranty?',
        description: 'Without labor coverage, repairs can cost hundreds even if parts are covered.',
        type: 'buttons',
        options: [
          { value: 'no', label: 'No', riskScore: 25 },
          { value: 'limited', label: 'Limited', riskScore: 15 },
          { value: 'unsure', label: "Don't Know", riskScore: 20 },
          { value: 'yes', label: 'Yes, Full Labor', riskScore: 0 },
        ],
      },
    ],
  },
];

// Get total number of questions
export const getTotalQuestions = (): number => {
  return riskCategories.reduce((sum, cat) => sum + cat.questions.length, 0);
};

// Get question by index (0-based, across all categories)
export const getQuestionByIndex = (index: number): { category: RiskCategory; question: RiskQuestion; questionIndex: number } | null => {
  let currentIndex = 0;
  for (const category of riskCategories) {
    for (let i = 0; i < category.questions.length; i++) {
      if (currentIndex === index) {
        return { category, question: category.questions[i], questionIndex: i };
      }
      currentIndex++;
    }
  }
  return null;
};
