/**
 * PreQuoteLeadModalV2 — Multi-step qualification modal
 *
 * Usage:
 *   import { PreQuoteLeadModalV2 } from '@/components/LeadModalV2';
 *
 *   <PreQuoteLeadModalV2
 *     isOpen={showModal}
 *     onClose={() => setShowModal(false)}
 *     onSuccess={(leadId) => console.log('Created:', leadId)}
 *     ctaSource="sample-report"
 *   />
 */

export { PreQuoteLeadModalV2 } from './PreQuoteLeadModalV2';
export { ScannerAllSetScreen } from './ScannerAllSetScreen';
export { calculateLeadScore, getSegment } from './useLeadScoring';
export type {
  PreQuoteLeadModalV2Props,
  ResultScreenRenderProps,
  StepType,
  QualificationData,
  ContactData,
  LeadSegment,
  ScoringResult,
  Timeline,
  HasQuote,
  WindowScope,
} from './types';
