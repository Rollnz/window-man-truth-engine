// Scanner Modal Components - Barrel Export
export { AnalysisTheater, useAnalysisTheater } from './AnalysisTheater';
export { PathSelector } from './PathSelector';

// Theater sub-components
export { TheaterProgressBar, TheaterCheckmark } from './theater';

// Re-export types for convenience
export type {
  AuditPath,
  AuditStep,
  TheaterPhase,
  LeadGateVariant,
  TheaterStep,
  AnalysisTheaterConfig,
  LeadCaptureFormData,
  ProjectData,
  AuditScannerState,
  AuditScannerModalProps,
  PathSelectorProps,
} from '@/types/audit';
