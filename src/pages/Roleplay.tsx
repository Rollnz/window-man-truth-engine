import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/home/Navbar';
import { Footer } from '@/components/home/Footer';
import { GameSetup } from '@/components/roleplay/GameSetup';
import { GamePlayArea } from '@/components/roleplay/GamePlayArea';
import { ResultsScreen } from '@/components/roleplay/ResultsScreen';
import { useRoleplayGame } from '@/hooks/useRoleplayGame';
import { useRoleplayAI } from '@/hooks/useRoleplayAI';
import { useScrollLock } from '@/hooks/useScrollLock';
import { trackEvent, trackPageView } from '@/lib/gtm';
import { HINT_PROMPTS } from '@/data/roleplayData';
import type { Difficulty, GameResult, AnalysisResult } from '@/types/roleplay';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default function Roleplay() {
  const { gameState, config, startGame, addMessage, updateResistance, useHint, endGame, checkWinCondition, checkLossCondition, resetGame } = useRoleplayGame();
  const { sendMessage, analyzeGame, isLoading } = useRoleplayAI({ difficulty: gameState.difficulty });
  
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isPlaying = gameState.status === 'playing';
  const { isNavbarVisible } = useScrollLock({ enabled: isPlaying });

  useEffect(() => {
    trackPageView('/roleplay', 'Beat The Closer - Sales Resistance Training');
  }, []);

  const handleStart = (difficulty: Difficulty) => {
    startGame(difficulty);
    setGameResult(null);
    setAnalysis(null);
    trackEvent('roleplay_game_start', { difficulty });
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    if (checkLossCondition(text)) {
      addMessage('user', text);
      const result = endGame('user_lost');
      setGameResult(result);
      trackEvent('roleplay_game_end', { won: false, turns: result.turns, duration: result.duration, difficulty: result.difficulty });
      setIsAnalyzing(true);
      const analysisResult = await analyzeGame([...gameState.messages, { id: 'final', role: 'user', text, timestamp: new Date() }], false);
      setAnalysis(analysisResult);
      setIsAnalyzing(false);
      return;
    }

    addMessage('user', text);
    const response = await sendMessage(text, gameState.messages);
    
    if (response.text.toLowerCase().includes("fine. you win") || response.text.toLowerCase().includes("i can't close you")) {
      addMessage('closer', response.text, response.tacticLog);
      const result = endGame('user_won', 'resistance');
      setGameResult(result);
      trackEvent('roleplay_game_end', { won: true, turns: result.turns, duration: result.duration, win_condition: 'resistance', difficulty: result.difficulty });
      return;
    }

    addMessage('closer', response.text, response.tacticLog);

    const win = checkWinCondition(text, response.tacticLog);
    if (win) {
      const result = endGame('user_won', win);
      setGameResult(result);
      trackEvent('roleplay_game_end', { won: true, turns: result.turns, duration: result.duration, win_condition: win, difficulty: result.difficulty });
      setIsAnalyzing(true);
      const analysisResult = await analyzeGame(gameState.messages, true);
      setAnalysis(analysisResult);
      setIsAnalyzing(false);
      return;
    }

    if (response.tacticLog) {
      const type = response.tacticLog.user_resistance_detected;
      let change = 0;
      if (type === 'firm_no') change = 1;
      if (type === 'soft_deflection') change = 0.5;
      if (type === 'wavering') change = -0.5;
      if (type === 'agreement') change = -1;
      
      updateResistance(change);
      
      if (gameState.resistanceScore + change >= config.maxResistance) {
        const result = endGame('user_won', 'resistance');
        setGameResult(result);
        trackEvent('roleplay_game_end', { won: true, turns: result.turns, duration: result.duration, win_condition: 'resistance', difficulty: result.difficulty });
        setIsAnalyzing(true);
        const analysisResult = await analyzeGame(gameState.messages, true);
        setAnalysis(analysisResult);
        setIsAnalyzing(false);
      }
    }
  };

  const handleTacticSpotted = async (id: string) => {
    addMessage('user', `That's ${id.replace(/_/g, ' ')}! I see what you're doing.`);
    addMessage('closer', "Fine. You win. I can't close you.");
    const result = endGame('user_won', 'tactic_callout');
    setGameResult(result);
    trackEvent('roleplay_tactic_identified', { tactic_name: id, turn: gameState.turns });
    trackEvent('roleplay_game_end', { won: true, turns: result.turns, duration: result.duration, win_condition: 'tactic_callout', difficulty: result.difficulty });
    setIsAnalyzing(true);
    const analysisResult = await analyzeGame(gameState.messages, true);
    setAnalysis(analysisResult);
    setIsAnalyzing(false);
  };

  const handleHint = () => {
    if (useHint()) {
      const lastTactic = gameState.tacticsUsed[gameState.tacticsUsed.length - 1];
      if (lastTactic) {
        setCurrentHint(HINT_PROMPTS[lastTactic.tactic_used] || "Watch out for pressure tactics.");
        setTimeout(() => setCurrentHint(null), 8000);
      } else {
        setCurrentHint("Stand your ground. Don't let them pressure you.");
        setTimeout(() => setCurrentHint(null), 8000);
      }
      trackEvent('roleplay_hint_used', { hints_remaining: gameState.hintsRemaining - 1 });
    }
  };

  const handleGiveUp = () => {
    const result = endGame('user_quit');
    setGameResult({ 
      won: false, 
      turns: gameState.turns, 
      resistanceScore: gameState.resistanceScore, 
      duration: gameState.startTime ? (Date.now() - gameState.startTime.getTime()) / 1000 : 0, 
      tacticsUsed: gameState.tacticsUsed, 
      transcript: gameState.messages, 
      difficulty: gameState.difficulty 
    });
    trackEvent('roleplay_game_end', { won: false, turns: gameState.turns, duration: 0, win_condition: 'quit', difficulty: gameState.difficulty });
  };

  const handlePlayAgain = () => {
    resetGame();
    setGameResult(null);
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-500",
        isPlaying && !isNavbarVisible ? "-translate-y-full" : "translate-y-0"
      )}>
        <Navbar />
      </div>
      
      <div className="pt-14">
        {gameState.status === 'setup' && <GameSetup onStart={handleStart} />}
        
        {isPlaying && (
          <GamePlayArea
            gameState={gameState}
            maxResistance={config.maxResistance}
            isLoading={isLoading}
            onSendMessage={handleSend}
            onHintRequest={handleHint}
            onGiveUp={handleGiveUp}
            onTacticSpotted={handleTacticSpotted}
            currentHint={currentHint}
          />
        )}
        
        {gameResult && (
          <ResultsScreen
            result={gameResult}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
      
      <Footer />
    </div>
  );
}
