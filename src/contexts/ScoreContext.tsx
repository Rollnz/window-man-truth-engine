/**
 * ScoreContext - Global score state provider
 * 
 * Provides server-sourced engagement score to all components
 * via React Context. Replaces the sessionStorage-based system.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useCanonicalScore, UseCanonicalScoreReturn } from '@/hooks/useCanonicalScore';

const ScoreContext = createContext<UseCanonicalScoreReturn | null>(null);

interface ScoreProviderProps {
  children: ReactNode;
}

export function ScoreProvider({ children }: ScoreProviderProps) {
  const scoreState = useCanonicalScore();

  return (
    <ScoreContext.Provider value={scoreState}>
      {children}
    </ScoreContext.Provider>
  );
}

/**
 * Hook to access the global score context
 * @throws if used outside of ScoreProvider
 */
export function useScore(): UseCanonicalScoreReturn {
  const context = useContext(ScoreContext);
  
  if (!context) {
    throw new Error('useScore must be used within a ScoreProvider');
  }
  
  return context;
}

/**
 * Hook to access score context safely (returns null if not in provider)
 */
export function useScoreSafe(): UseCanonicalScoreReturn | null {
  return useContext(ScoreContext);
}
