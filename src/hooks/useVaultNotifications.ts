import { useSessionData } from './useSessionData';

const TOOL_IDS = [
  'reality-check',
  'cost-calculator', 
  'vulnerability-test',
  'expert',
  'comparison',
  'risk-diagnostic',
  'fast-win',
  'evidence',
  'intel',
  'claim-survival'
];

export function useVaultNotifications() {
  const { sessionData, isToolCompleted } = useSessionData();
  
  const completedCount = TOOL_IDS.filter(id => isToolCompleted(id)).length;
  const incompleteCount = TOOL_IDS.length - completedCount;
  
  // Check for missing documents (claim vault files)
  const claimVaultProgress = sessionData.claimVaultProgress || {};
  const documentsCompleted = Object.values(claimVaultProgress).filter(Boolean).length;
  const hasMissingDocuments = documentsCompleted < 7; // 7 documents in claim checklist
  
  const hasNotifications = incompleteCount > 0 || hasMissingDocuments;
  
  return {
    hasNotifications,
    incompleteToolsCount: incompleteCount,
    completedToolsCount: completedCount,
    hasMissingDocuments,
  };
}
