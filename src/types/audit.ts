// ═══════════════════════════════════════════════════════════════════════════
// AUDIT SCANNER TYPES
// Multi-path lead capture system for /audit page
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// CORE ENUMS & LITERALS
// ═══════════════════════════════════════════════════════════════════════════

/** The two conversion paths in the audit scanner */
export type AuditPath = 'quote' | 'vault';

/** Step numbers in the state machine (0-8) */
export type AuditStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Phase of the analysis theater animation (deprecated - use DeterministicPhase) */
export type TheaterPhase = 'idle' | 'running' | 'paused' | 'complete';

/** Phase of the deterministic analysis flow (simplified, no timers) */
export type DeterministicPhase = 'idle' | 'analyzing' | 'partial' | 'gated' | 'unlocked';

/** Form data for the "Explain Score" lead gate */
export interface ExplainScoreFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/** Variants for the lead capture gate form */
export type LeadGateVariant = 'unlock' | 'vault';

/** Property types for project intelligence */
export type PropertyType = 'house' | 'condo' | 'townhome' | 'business';

/** Timeline options */
export type TimelineOption = 'urgent' | 'soon' | 'planning' | 'researching';

/** Goal options for project */
export type ProjectGoal = 'hurricane' | 'energy' | 'noise' | 'security' | 'value';

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS THEATER
// ═══════════════════════════════════════════════════════════════════════════

/** Individual step in the analysis theater animation */
export interface TheaterStep {
  id: string;
  label: string;
  sublabel?: string;
  /** Percentage at which this step completes (0-100) */
  completesAt: number;
}

/** Configuration for the analysis theater animation */
export interface AnalysisTheaterConfig {
  /** Total duration in milliseconds */
  duration: number;
  /** Percentage to pause at (typically 90) */
  pauseAt: number;
  /** Steps to display with checkmarks */
  steps: TheaterStep[];
  /** Callback when pause point is reached */
  onPause?: () => void;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/** State returned by useAnalysisTheater hook */
export interface AnalysisTheaterState {
  /** Current percentage (0-100) */
  percent: number;
  /** Current phase of animation */
  phase: TheaterPhase;
  /** Index of currently active step */
  activeStepIndex: number;
  /** Function to resume animation after pause */
  resume: () => void;
  /** Function to reset animation */
  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEAD CAPTURE
// ═══════════════════════════════════════════════════════════════════════════

/** Form data for lead capture gate */
export interface LeadCaptureFormData {
  firstName: string;
  email: string;
  phone: string;
}

/** Extended lead data with optional fields */
export interface LeadData extends LeadCaptureFormData {
  lastName?: string;
  zipCode?: string;
  city?: string;
  state?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

/** Data collected in project intelligence step */
export interface ProjectData {
  windowCount: number;
  propertyType: PropertyType | null;
  timeline: TimelineOption | null;
  goals: ProjectGoal[];
}

/** Sub-step within project intelligence */
export type ProjectIntelligenceStep = 'size' | 'type' | 'timeline' | 'goals';

// ═══════════════════════════════════════════════════════════════════════════
// FILE HANDLING
// ═══════════════════════════════════════════════════════════════════════════

/** Metadata for uploaded quote file (no blob storage) */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORENSIC SUMMARY (Hybrid Rubric Output)
// ═══════════════════════════════════════════════════════════════════════════

/** Forensic summary from hybrid rubric analysis */
export interface ForensicSummary {
  headline: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'acceptable';
  statuteCitations: string[];
  questionsToAsk: string[];
  positiveFindings: string[];
  hardCapApplied: boolean;
  hardCapReason: string | null;
  hardCapStatute: string | null;
}

/** Extracted contractor identity for future verification */
export interface ExtractedIdentity {
  contractorName: string | null;
  licenseNumber: string | null;
  noaNumbers: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS RESULTS
// ═══════════════════════════════════════════════════════════════════════════

/** Result from quote analysis (updated with forensic data) */
export interface AuditAnalysisResult {
  overallScore: number;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  pricePerOpening: string;
  warnings: string[];
  missingItems: string[];
  summary: string;
  analyzedAt: string;
  
  // NEW: Forensic Authority Fields (Hybrid Rubric)
  forensic?: ForensicSummary;
  extractedIdentity?: ExtractedIdentity;
}

/** Teaser data shown before lead gate (partial results) */
export interface TeaserData {
  redFlagCount: number;
  priceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  potentialSavings: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// VAULT
// ═══════════════════════════════════════════════════════════════════════════

/** Tool available in the vault */
export interface VaultTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  value: string;
}

/** Summary shown after vault unlock */
export interface VaultSummary {
  toolsUnlocked: number;
  totalValue: string;
  accessExpires?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HUMAN ESCALATION
// ═══════════════════════════════════════════════════════════════════════════

/** Options for human escalation step */
export type EscalationType = 'schedule' | 'question' | 'finish';

/** Data for scheduling consultation */
export interface ScheduleData {
  preferredTime: string;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════

/** Complete state for the audit scanner modal */
export interface AuditScannerState {
  /** Current step in the flow (0-8) */
  currentStep: AuditStep;
  /** Selected path (quote or vault) */
  path: AuditPath | null;
  /** Uploaded file (Path A only) */
  file: File | null;
  /** File metadata for persistence */
  fileMetadata: FileMetadata | null;
  /** Analysis result (Path A only) */
  analysisResult: AuditAnalysisResult | null;
  /** Teaser data shown before gate */
  teaserData: TeaserData | null;
  /** Lead capture form data */
  leadData: LeadData | null;
  /** Project intelligence data */
  projectData: ProjectData;
  /** Whether lead has been captured */
  isLeadCaptured: boolean;
  /** Lead ID from backend (after capture) */
  leadId: string | null;
  /** Current theater animation phase */
  theaterPhase: TheaterPhase;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/** Actions for the audit scanner state machine */
export interface AuditScannerActions {
  /** Select path at Step 0 */
  selectPath: (path: AuditPath) => void;
  /** Upload file (Path A Step 1) */
  uploadFile: (file: File) => void;
  /** Start theater animation */
  startTheater: () => void;
  /** Capture lead at gate */
  captureLeadGate: (data: LeadCaptureFormData) => Promise<void>;
  /** Resume theater after lead capture */
  resumeTheater: () => void;
  /** Save project details (Step 6) */
  saveProjectDetails: (data: Partial<ProjectData>) => void;
  /** Select escalation type (Step 7) */
  selectEscalation: (type: EscalationType) => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Reset all state */
  reset: () => void;
  /** Set error */
  setError: (error: string | null) => void;
}

/** Combined hook return type */
export interface UseAuditScannerReturn extends AuditScannerState, AuditScannerActions {
  /** Can go back from current step */
  canGoBack: boolean;
  /** Can proceed to next step */
  canProceed: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════

/** Props for AuditScannerModal */
export interface AuditScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Initial file if user already uploaded one */
  initialFile?: File;
}

/** Props for PathSelector */
export interface PathSelectorProps {
  onSelectPath: (path: AuditPath) => void;
}

/** Props for AnalysisTheater */
export interface AnalysisTheaterProps {
  config: AnalysisTheaterConfig;
  onPause: () => void;
  onComplete: () => void;
}

/** Props for LeadCaptureGate */
export interface LeadCaptureGateProps {
  variant: LeadGateVariant;
  onSubmit: (data: LeadCaptureFormData) => Promise<void>;
  isLoading?: boolean;
}

/** Props for TeaserPanel */
export interface TeaserPanelProps {
  teaserData: TeaserData;
  isLocked: boolean;
}

/** Props for ResultsReveal */
export interface ResultsRevealProps {
  result: AuditAnalysisResult;
}

/** Props for VaultPreview */
export interface VaultPreviewProps {
  tools: VaultTool[];
}

/** Props for VaultConfirmation */
export interface VaultConfirmationProps {
  summary: VaultSummary;
  tools: VaultTool[];
}

/** Props for ProjectIntelligence */
export interface ProjectIntelligenceProps {
  initialData?: Partial<ProjectData>;
  onComplete: (data: ProjectData) => void;
}

/** Props for HumanEscalation */
export interface HumanEscalationProps {
  onSchedule: () => void;
  onAskQuestion: () => void;
  onFinish: () => void;
}

/** Props for FinalConfirmation */
export interface FinalConfirmationProps {
  path: AuditPath;
  summary: VaultSummary;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// THEATER COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════

/** Props for TheaterProgressBar */
export interface TheaterProgressBarProps {
  percent: number;
  isPaused: boolean;
}

/** Props for TheaterCheckmark */
export interface TheaterCheckmarkProps {
  step: TheaterStep;
  isComplete: boolean;
  isActive: boolean;
  index: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════

/** Props for WindowCountSlider */
export interface WindowCountSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  typicalRange?: [number, number];
}

/** Props for PropertyTypeCards */
export interface PropertyTypeCardsProps {
  selected: PropertyType | null;
  onSelect: (type: PropertyType) => void;
}

/** Props for TimelineRadio */
export interface TimelineRadioProps {
  value: TimelineOption | null;
  onChange: (option: TimelineOption) => void;
}

/** Props for GoalsCheckbox */
export interface GoalsCheckboxProps {
  selected: ProjectGoal[];
  onChange: (goals: ProjectGoal[]) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Default theater steps for Path A (quote analysis) */
export const PATH_A_THEATER_STEPS: TheaterStep[] = [
  { id: 'upload', label: 'Processing document', sublabel: 'OCR extraction', completesAt: 15 },
  { id: 'extract', label: 'Extracting line items', sublabel: 'Materials & labor', completesAt: 35 },
  { id: 'compare', label: 'Comparing to market data', sublabel: '12,000+ quotes analyzed', completesAt: 55 },
  { id: 'flags', label: 'Scanning for red flags', sublabel: 'Fine print analysis', completesAt: 75 },
  { id: 'score', label: 'Calculating safety score', sublabel: 'Finalizing...', completesAt: 90 },
];

/** Default theater steps for Path B (vault access) */
export const PATH_B_THEATER_STEPS: TheaterStep[] = [
  { id: 'profile', label: 'Building your profile', sublabel: 'Personalization', completesAt: 20 },
  { id: 'tools', label: 'Preparing your toolkit', sublabel: '7 pro resources', completesAt: 50 },
  { id: 'access', label: 'Securing vault access', sublabel: 'Finalizing...', completesAt: 90 },
];

/** Default vault tools */
export const DEFAULT_VAULT_TOOLS: VaultTool[] = [
  { id: 'kitchen-table', name: 'Kitchen Table Guide', description: 'Questions to ask contractors', icon: 'FileText', value: '$47' },
  { id: 'sales-tactics', name: 'Sales Tactics Guide', description: 'Recognize pressure tactics', icon: 'Shield', value: '$37' },
  { id: 'spec-checklist', name: 'Spec Checklist', description: 'What to look for in quotes', icon: 'CheckSquare', value: '$27' },
  { id: 'price-database', name: 'Price Database', description: 'Florida market pricing', icon: 'Database', value: '$97' },
  { id: 'contractor-ratings', name: 'Contractor Ratings', description: 'Verified reviews', icon: 'Star', value: '$47' },
  { id: 'warranty-decoder', name: 'Warranty Decoder', description: 'What coverage means', icon: 'FileSearch', value: '$27' },
  { id: 'insurance-guide', name: 'Insurance Guide', description: 'Claim documentation', icon: 'Umbrella', value: '$37' },
];

/** Timeline option labels */
export const TIMELINE_OPTIONS: Record<TimelineOption, string> = {
  urgent: 'ASAP - I need this done now',
  soon: 'Within 3 months',
  planning: 'Within 6 months',
  researching: 'Just researching for now',
};

/** Goal option labels */
export const GOAL_OPTIONS: Record<ProjectGoal, string> = {
  hurricane: 'Hurricane protection',
  energy: 'Energy savings',
  noise: 'Noise reduction',
  security: 'Home security',
  value: 'Home value increase',
};
