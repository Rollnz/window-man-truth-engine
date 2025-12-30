import { useState, useEffect, useCallback } from 'react';

export interface SessionData {
  homeSize?: number;
  windowCount?: number;
  windowAge?: string;
  windowAgeYears?: number;
  currentEnergyBill?: string;
  currentEnergyBillAmount?: number;
  homeType?: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'other';
  zipCode?: string;
  email?: string;
  name?: string;
  phone?: string;
  notes?: string;
  // Reality Check specific
  draftinessLevel?: 'none' | 'slight' | 'moderate' | 'severe';
  noiseLevel?: 'none' | 'slight' | 'moderate' | 'severe';
  // Tool-specific results
  realityCheckScore?: number;
  costOfInactionTotal?: number;
  quizScore?: number;
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
  // Lead capture
  leadId?: string;
  consultationRequested?: boolean;
  // Timestamps
  lastVisit?: string;
  toolsCompleted?: string[];
}

const STORAGE_KEY = 'impact-windows-session';

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
  }, []);

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

  return {
    sessionData,
    updateField,
    updateFields,
    markToolCompleted,
    isToolCompleted,
    clearSession,
    getPrefilledValue,
    hasExistingData: Object.keys(sessionData).length > 0,
  };
}