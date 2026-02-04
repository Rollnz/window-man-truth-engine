// Audit hooks barrel export
export { useDeterministicScanner } from './useDeterministicScanner';
export { useGatedScanner } from './useGatedScanner';
export type { GatedScannerPhase } from './useGatedScanner';

// Deprecated - kept for backward compatibility
/** @deprecated Use useDeterministicScanner instead - no animation timing needed */
export { useAnalysisTheater } from './useAnalysisTheater';
