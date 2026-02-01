// Scanner Modal Components - Barrel Export

// NEW: Deterministic flow components (no timers)
export { AnalyzingState } from './AnalyzingState';
export { PartialResultsPanel } from './PartialResultsPanel';
export { ExplainScoreGate } from './ExplainScoreGate';
export { FullResultsPanel } from './FullResultsPanel';
export { PathSelector } from './PathSelector';

// DEPRECATED: Theater components (kept for backward compatibility)
/** @deprecated Use AnalyzingState instead */
export { AnalysisTheater, useAnalysisTheater } from './AnalysisTheater';
/** @deprecated No longer needed - deterministic flow has no progress bar */
export { TheaterProgressBar, TheaterCheckmark } from './theater';

// Re-export types for convenience
export type {
  AuditPath,
  AuditStep,
  TheaterPhase,
  DeterministicPhase,
  LeadGateVariant,
  TheaterStep,
  AnalysisTheaterConfig,
  LeadCaptureFormData,
  ExplainScoreFormData,
  ProjectData,
  AuditScannerState,
  AuditScannerModalProps,
  PathSelectorProps,
  AuditAnalysisResult,
} from '@/types/audit';
