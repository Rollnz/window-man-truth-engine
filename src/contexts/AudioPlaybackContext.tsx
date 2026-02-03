import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AudioPlaybackContextValue {
  activePlayerId: string | null;
  requestPlayback: (playerId: string) => void;
  stopPlayback: () => void;
}

const AudioPlaybackContext = createContext<AudioPlaybackContextValue | null>(null);

export function AudioPlaybackProvider({ children }: { children: ReactNode }) {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  const requestPlayback = useCallback((playerId: string) => {
    setActivePlayerId(playerId);
  }, []);

  const stopPlayback = useCallback(() => {
    setActivePlayerId(null);
  }, []);

  return (
    <AudioPlaybackContext.Provider value={{ activePlayerId, requestPlayback, stopPlayback }}>
      {children}
    </AudioPlaybackContext.Provider>
  );
}

export function useAudioPlayback() {
  const context = useContext(AudioPlaybackContext);
  if (!context) {
    throw new Error('useAudioPlayback must be used within AudioPlaybackProvider');
  }
  return context;
}
