// Beat The Closer - Roleplay Game Types

export type Difficulty = 'rookie' | 'standard' | 'nightmare';

export type GameStatus = 'setup' | 'playing' | 'user_won' | 'user_lost' | 'user_quit' | 'analyzing';

export type MessageRole = 'user' | 'closer';

export type ResistanceType = 
  | 'soft_deflection' 
  | 'firm_no' 
  | 'wavering' 
  | 'question' 
  | 'tactic_callout' 
  | 'agreement' 
  | 'gave_up';

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  tacticLog?: TacticLog;
}

export interface TacticLog {
  turn: number;
  tactic_used: string;
  tactic_category: string;
  pressure_level: number;
  user_resistance_detected: ResistanceType;
  cumulative_resistance_score: number;
  question_type: string;
  user_vulnerability_targeted: string | null;
}

export interface GameState {
  status: GameStatus;
  difficulty: Difficulty;
  turns: number;
  resistanceScore: number;
  messages: Message[];
  tacticsUsed: TacticLog[];
  hintsRemaining: number;
  startTime: Date | null;
  endTime: Date | null;
  userVulnerabilities: string[];
}

export interface GameConfig {
  maxResistance: number;
  hintsPerGame: number;
  showHints: boolean;
  embedded: boolean;
  onGameEnd?: (result: GameResult) => void;
  onRequestEmail?: (result: GameResult) => void;
}

export interface GameResult {
  won: boolean;
  turns: number;
  resistanceScore: number;
  duration: number;
  tacticsUsed: TacticLog[];
  transcript: Message[];
  winCondition?: 'resistance' | 'tactic_callout' | null;
  difficulty: Difficulty;
}

export interface ScoreCard {
  composure: number;
  firmness: number;
  tacticRecognition: number;
  objectionQuality: number;
  vulnerabilityResistance: number;
  overallGrade: string;
}

export interface TacticDefinition {
  name: string;
  aliases: string[];
  description: string;
  examples: string[];
  psychology: string;
  counters: string[];
}

export interface AnalysisResult {
  result?: {
    won: boolean;
    summary: string;
    winCondition: 'resistance' | 'tactic_callout' | null;
  };
  scoreCard: ScoreCard;
  tacticsBreakdown: TacticBreakdownItem[];
  vulnerableMoments: AnalysisMoment[];
  strongMoments: AnalysisMoment[];
  lessons: string[];
  powerPhrases: string[];
  rawAnalysis?: string;
}

export interface TacticBreakdownItem {
  turn: number;
  tacticName: string;
  quote: string;
  explanation: string;
  userResponse: string;
  wasEffective: boolean;
  betterCounter: string;
}

export interface AnalysisMoment {
  turn: number;
  title: string;
  description: string;
  lesson?: string;
}
