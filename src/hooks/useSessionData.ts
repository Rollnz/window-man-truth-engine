import { useState, useEffect, useCallback } from 'react';
import { SourceTool } from '@/types/sourceTool';

export interface SessionData {
  // ═══════════════════════════════════════════════════════════════════════════
  // CORE PROJECT FIELDS - Home & window information
  // ═══════════════════════════════════════════════════════════════════════════
  homeSize?: number;
  windowCount?: number;
  windowAge?: string;
  windowAgeYears?: number;
  homeType?: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'other';
  zipCode?: string;
  currentEnergyBill?: string;
  currentEnergyBillAmount?: number;
  draftinessLevel?: 'none' | 'slight' | 'moderate' | 'severe';
  noiseLevel?: 'none' | 'slight' | 'moderate' | 'severe';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACT INFORMATION - User-provided details
  // ═══════════════════════════════════════════════════════════════════════════
  email?: string;
  name?: string;
  phone?: string;
  notes?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // AI CONTEXT FIELDS - For lead enrichment and personalization
  // These fields are passed to the save-lead function for CRM/sales context
  // ═══════════════════════════════════════════════════════════════════════════
  sourceTool?: SourceTool;
  insuranceCarrier?: string;
  urgencyLevel?: string;
  emotionalState?: string;
  specificDetail?: string;
  projectType?: string; // e.g., 'replacement', 'new-construction', 'storm-damage'

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL-SPECIFIC RESULTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Reality Check results
  realityCheckScore?: number;
  costOfInactionTotal?: number;

  // Quiz results
  quizScore?: number;
  quizVulnerability?: 'CRITICAL' | 'MODERATE' | 'LOW';
  quizAttempted?: boolean;

  // Comparison results
  comparisonViewed?: boolean;

  // Risk Diagnostic results
  riskDiagnosticCompleted?: boolean;
  stormRiskScore?: number;
  securityRiskScore?: number;
  insuranceRiskScore?: number;
  warrantyRiskScore?: number;
  overallProtectionScore?: number;

  // Fast Win results
  fastWinCompleted?: boolean;
  fastWinResult?: string;
  fastWinPainPoint?: string;
  fastWinOrientation?: string;
  fastWinBudgetPriority?: string;

  // Evidence Locker results
  evidenceLockerViewed?: boolean;
  caseStudiesViewed?: string[];
  lastCaseViewed?: string;

  // Intel Library results
  intelLibraryViewed?: boolean;
  unlockedResources?: string[];

  // Claim Survival Vault results
  claimVaultViewed?: boolean;
  claimVaultProgress?: Record<string, boolean>;
  claimVaultFiles?: Record<string, string>;
  claimVaultSessionId?: string;
  emergencyModeUsed?: boolean;

  // AI Claim Analysis results
  claimAnalysisResult?: {
    overallScore: number;
    status: 'critical' | 'warning' | 'ready';
    summary: string;
    documentStatus: {
      docId: string;
      status: 'complete' | 'missing' | 'weak';
      recommendation: string;
    }[];
    nextSteps: string[];
    analyzedAt: string;
  };

  // Quote Scanner results
  quoteAnalysisResult?: {
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
    analyzedAt?: string;
  };
  quoteDraftEmail?: string | null;
  quotePhoneScript?: string | null;

  // Fair Price Quiz Results (for Vault display)
  fairPriceQuizResults?: {
    quoteAmount: number;
    fairMarketValue: { low: number; high: number };
    overagePercentage: number;
    grade: string;
    verdict: string;
    redFlagCount: number;
    redFlags: string[];
    potentialOverpay: number | null;
    analyzedAt: string;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VAULT SYNC STATE
  // ═══════════════════════════════════════════════════════════════════════════
  vaultSyncPending?: boolean;
  vaultSyncEmail?: string;
  vaultSyncSource?: 'fair-price-quiz' | 'quote-scanner' | 'other';

  // ═══════════════════════════════════════════════════════════════════════════
  // LEAD CAPTURE & TRACKING
  // ═══════════════════════════════════════════════════════════════════════════
  leadId?: string;
  consultationRequested?: boolean;
  lastVisit?: string;
  toolsCompleted?: string[];
}

const STORAGE_KEY = 'impact-windows-session';
const SESSION_ID_KEY = 'wm-session-id';

// Get or create a persistent session ID for attribution tracking
const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return crypto.randomUUID();
  
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch (error) {
    console.error('Error accessing sessionId:', error);
    return crypto.randomUUID();
  }
};

const getStoredData = (): SessionData => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading session data:', error);
  }
  return {};
};

const setStoredData = (data: SessionData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving session data:', error);
  }
};

export function useSessionData() {
  const [sessionData, setSessionData] = useState<SessionData>(() => getStoredData());

  // Sync with localStorage on mount and when data changes
  useEffect(() => {
    const stored = getStoredData();
    if (JSON.stringify(stored) !== JSON.stringify(sessionData)) {
      setSessionData(stored);
    }
  }, [sessionData]);

  // Update a single field
  const updateField = useCallback(<K extends keyof SessionData>(
    key: K,
    value: SessionData[K]
  ) => {
    setSessionData(prev => {
      const updated = { ...prev, [key]: value, lastVisit: new Date().toISOString() };
      setStoredData(updated);
      return updated;
    });
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((fields: Partial<SessionData>) => {
    setSessionData(prev => {
      const updated = { ...prev, ...fields, lastVisit: new Date().toISOString() };
      setStoredData(updated);
      return updated;
    });
  }, []);

  // Mark a tool as completed
  const markToolCompleted = useCallback((toolName: string) => {
    setSessionData(prev => {
      const toolsCompleted = prev.toolsCompleted || [];
      if (!toolsCompleted.includes(toolName)) {
        const updated = {
          ...prev,
          toolsCompleted: [...toolsCompleted, toolName],
          lastVisit: new Date().toISOString()
        };
        setStoredData(updated);
        return updated;
      }
      return prev;
    });
  }, []);

  // Check if a tool has been completed
  const isToolCompleted = useCallback((toolName: string): boolean => {
    return sessionData.toolsCompleted?.includes(toolName) || false;
  }, [sessionData.toolsCompleted]);

  // Clear all session data
  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSessionData({});
  }, []);

  // Get pre-fill value for a field
  const getPrefilledValue = useCallback(<K extends keyof SessionData>(
    key: K
  ): SessionData[K] | undefined => {
    return sessionData[key];
  }, [sessionData]);

  // Get the persistent session ID for Golden Thread attribution
  const sessionId = getOrCreateSessionId();

  return {
    sessionData,
    sessionId,
    updateField,
    updateFields,
    markToolCompleted,
    isToolCompleted,
    clearSession,
    getPrefilledValue,
    hasExistingData: Object.keys(sessionData).length > 0,
  };
}
