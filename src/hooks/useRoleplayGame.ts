import { useState, useCallback } from 'react';
import type { 
  GameState, 
  GameConfig, 
  GameResult, 
  Message, 
  TacticLog, 
  Difficulty 
} from '@/types/roleplay';
import { OPENING_MESSAGE } from '@/data/roleplayData';

const DEFAULT_CONFIG: GameConfig = {
  maxResistance: 7,
  hintsPerGame: 3,
  showHints: true,
  embedded: false,
};

export function useRoleplayGame(configOverride: Partial<GameConfig> = {}) {
  const config = { ...DEFAULT_CONFIG, ...configOverride };
  
  const [gameState, setGameState] = useState<GameState>({
    status: 'setup',
    difficulty: 'standard',
    turns: 0,
    resistanceScore: 0,
    messages: [],
    tacticsUsed: [],
    hintsRemaining: 3,
    startTime: null,
    endTime: null,
    userVulnerabilities: []
  });

  const startGame = useCallback((difficulty: Difficulty) => {
    const openingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'closer',
      text: OPENING_MESSAGE,
      timestamp: new Date()
    };

    setGameState({
      status: 'playing',
      difficulty,
      turns: 0,
      resistanceScore: 0,
      messages: [openingMessage],
      tacticsUsed: [],
      hintsRemaining: difficulty === 'nightmare' ? 0 : 3,
      startTime: new Date(),
      endTime: null,
      userVulnerabilities: []
    });
  }, []);

  const addMessage = useCallback((role: 'user' | 'closer', text: string, tacticLog?: TacticLog) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role,
      text,
      timestamp: new Date(),
      tacticLog
    };

    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      turns: role === 'user' ? prev.turns + 1 : prev.turns,
      tacticsUsed: tacticLog ? [...prev.tacticsUsed, tacticLog] : prev.tacticsUsed
    }));

    return message;
  }, []);

  const updateResistance = useCallback((delta: number) => {
    setGameState(prev => {
      const newScore = Math.max(-3, Math.min(config.maxResistance, prev.resistanceScore + delta));
      return { ...prev, resistanceScore: newScore };
    });
  }, [config.maxResistance]);

  const useHint = useCallback((): boolean => {
    if (gameState.hintsRemaining <= 0) return false;
    setGameState(prev => ({
      ...prev,
      hintsRemaining: prev.hintsRemaining - 1
    }));
    return true;
  }, [gameState.hintsRemaining]);

  const endGame = useCallback((
    status: 'user_won' | 'user_lost' | 'user_quit', 
    winCondition?: 'resistance' | 'tactic_callout'
  ): GameResult => {
    const endTime = new Date();
    
    setGameState(prev => ({
      ...prev,
      status,
      endTime
    }));

    const result: GameResult = {
      won: status === 'user_won',
      turns: gameState.turns,
      resistanceScore: gameState.resistanceScore,
      duration: gameState.startTime ? (endTime.getTime() - gameState.startTime.getTime()) / 1000 : 0,
      tacticsUsed: gameState.tacticsUsed,
      transcript: gameState.messages,
      winCondition: status === 'user_won' ? winCondition : null,
      difficulty: gameState.difficulty
    };

    config.onGameEnd?.(result);
    return result;
  }, [gameState, config]);

  const checkWinCondition = useCallback((
    userMessage: string, 
    tacticLog?: TacticLog
  ): 'resistance' | 'tactic_callout' | null => {
    const tacticCalloutPatterns = [
      /that'?s?\s+(a\s+)?(classic\s+)?false\s+urgency/i,
      /that'?s?\s+(a\s+)?(classic\s+)?scarcity/i,
      /that'?s?\s+(a\s+)?(classic\s+)?fear\s+(appeal|tactic|based)/i,
      /that'?s?\s+(a\s+)?(classic\s+)?guilt\s+trip/i,
      /that'?s?\s+(a\s+)?(classic\s+)?social\s+proof/i,
      /that'?s?\s+(a\s+)?(classic\s+)?ego\s+appeal/i,
      /that'?s?\s+(a\s+)?(classic\s+)?good\s+guy/i,
      /that'?s?\s+(a\s+)?(classic\s+)?assumptive\s+close/i,
      /that'?s?\s+(a\s+)?(classic\s+)?sunk\s+cost/i,
      /that'?s?\s+(a\s+)?(classic\s+)?reframing/i,
      /that'?s?\s+(a\s+)?(classic\s+)?takeaway/i,
      /that'?s?\s+(a\s+)?(classic\s+)?puppy\s+dog/i,
      /you'?re\s+using\s+(the\s+)?(false\s+)?urgency/i,
      /manipulation\s+tactic/i
    ];

    if (tacticCalloutPatterns.some(pattern => pattern.test(userMessage))) {
      return 'tactic_callout';
    }

    if (tacticLog && tacticLog.cumulative_resistance_score >= config.maxResistance) {
      return 'resistance';
    }

    return null;
  }, [config.maxResistance]);

  const checkLossCondition = useCallback((userMessage: string): boolean => {
    const lossPatterns = [
      /\b(ok(ay)?|fine|sure|yes|alright),?\s*(i'?ll\s+)?(sign|do\s+it|agree|buy)/i,
      /\bwhere\s+do\s+i\s+sign/i,
      /\blet'?s\s+do\s+it/i,
      /\bi\s+give\s+(up|in)/i
    ];
    return lossPatterns.some(pattern => pattern.test(userMessage));
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      status: 'setup',
      difficulty: 'standard',
      turns: 0,
      resistanceScore: 0,
      messages: [],
      tacticsUsed: [],
      hintsRemaining: 3,
      startTime: null,
      endTime: null,
      userVulnerabilities: []
    });
  }, []);

  const setAnalyzing = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'analyzing' }));
  }, []);

  return {
    gameState,
    config,
    startGame,
    addMessage,
    updateResistance,
    useHint,
    endGame,
    checkWinCondition,
    checkLossCondition,
    resetGame,
    setAnalyzing
  };
}
