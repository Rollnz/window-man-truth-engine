import { useState, useCallback } from 'react';
import { fastAIRequest } from '@/lib/aiRequest';
import { TimeoutError, getErrorMessage } from '@/lib/errors';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import type { Message, TacticLog, Difficulty, AnalysisResult } from '@/types/roleplay';

interface UseRoleplayAIOptions {
  difficulty: Difficulty;
}

export function useRoleplayAI({ difficulty }: UseRoleplayAIOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sessionId } = useSessionData();
  const { leadId } = useLeadIdentity();

  const parseTacticLog = (response: string): TacticLog | undefined => {
    const match = response.match(/<tactic_log>([\s\S]*?)<\/tactic_log>/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        console.warn('Failed to parse tactic log');
        return undefined;
      }
    }
    return undefined;
  };

  const cleanResponseForDisplay = (response: string): string => {
    return response.replace(/<tactic_log>[\s\S]*?<\/tactic_log>/, '').trim();
  };

  const sendMessage = useCallback(async (
    userMessage: string,
    conversationHistory: Message[]
  ): Promise<{ text: string; tacticLog?: TacticLog }> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: requestError } = await fastAIRequest.sendRequest<{ response?: string; error?: string }>(
        'roleplay-chat',
        {
          mode: 'chat',
          userMessage,
          conversationHistory: conversationHistory.map(m => ({
            role: m.role,
            text: m.text
          })),
          difficulty,
          // Golden Thread: Pass session tracking data
          sessionId: sessionId || crypto.randomUUID(),
          leadId: leadId || undefined,
        }
      );

      if (requestError) {
        throw requestError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const aiResponse = data?.response || '';
      const tacticLog = parseTacticLog(aiResponse);
      const cleanedText = cleanResponseForDisplay(aiResponse);

      setIsLoading(false);
      return { text: cleanedText, tacticLog };

    } catch (e) {
      setIsLoading(false);
      
      const errorMessage = getErrorMessage(e);
      setError(errorMessage);
      
      // Fallback response
      return {
        text: "Look, my phone's about to die. I need an answer from you right now — yes or no?",
        tacticLog: {
          turn: 99,
          tactic_used: "URGENCY",
          tactic_category: "PRESSURE",
          pressure_level: 8,
          user_resistance_detected: "question",
          cumulative_resistance_score: 0,
          question_type: "closing",
          user_vulnerability_targeted: "time"
        }
      };
    }
  }, [difficulty]);

  const analyzeGame = useCallback(async (
    transcript: Message[], 
    won: boolean
  ): Promise<AnalysisResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: requestError } = await fastAIRequest.sendRequest<{ analysis?: AnalysisResult; error?: string }>(
        'roleplay-chat',
        {
          mode: 'analyze',
          transcript: transcript.map(m => ({
            role: m.role,
            text: m.text
          })),
          won,
          // Golden Thread: Pass session tracking data
          sessionId: sessionId || crypto.randomUUID(),
          leadId: leadId || undefined,
        }
      );

      if (requestError) {
        throw requestError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setIsLoading(false);
      return data?.analysis || null;

    } catch (e) {
      setIsLoading(false);
      
      const errorMessage = getErrorMessage(e);
      setError(errorMessage);
      return null;
    }
  }, []);

  return { sendMessage, analyzeGame, isLoading, error };
}
