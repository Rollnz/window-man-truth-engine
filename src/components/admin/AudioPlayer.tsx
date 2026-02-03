import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { useAudioPlayback } from '@/contexts/AudioPlaybackContext';

interface AudioPlayerProps {
  src: string;
  autoStart?: boolean;
  playerId: string;
}

type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

export function AudioPlayer({ src, autoStart = false, playerId }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const { activePlayerId, requestPlayback, stopPlayback } = useAudioPlayback();

  // Pause this player when another player takes over
  useEffect(() => {
    if (activePlayerId !== playerId && playerState === 'playing') {
      audioRef.current?.pause();
    }
  }, [activePlayerId, playerId, playerState]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset state when src changes
    setPlayerState("idle");
    setCurrentTime(0);
    setDuration(0);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      if (autoStart) {
        requestPlayback(playerId);
        audio.play().catch(() => setPlayerState("error"));
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setPlayerState("playing");
    const handlePause = () => setPlayerState("paused");
    const handleEnded = () => {
      setPlayerState("paused");
      setCurrentTime(0);
      stopPlayback();
    };
    const handleError = () => setPlayerState("error");

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [src, autoStart, playerId, requestPlayback, stopPlayback]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playerState === "playing") {
      audio.pause();
    } else if (playerState === "error") {
      audio.load();
      requestPlayback(playerId);
      audio.play().catch(() => setPlayerState("error"));
      setPlayerState("loading");
    } else {
      requestPlayback(playerId);
      audio.play().catch(() => setPlayerState("error"));
      setPlayerState("loading");
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  if (playerState === "error") {
    return (
      <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 rounded-md p-2 text-red-700">
        <AlertCircle className="w-4 h-4" />
        <span>Failed to load recording</span>
        <button
          onClick={togglePlay}
          className="ml-auto text-blue-600 underline text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors flex-shrink-0"
      >
        {playerState === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : playerState === "playing" ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>

      {/* Progress bar + time labels */}
      <div className="flex-1 min-w-0">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          step={0.1}
          onChange={handleSeek}
          className="w-full h-1.5 cursor-pointer accent-green-500"
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-xs text-gray-500">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-gray-500">
            {duration > 0 ? formatTime(duration) : "—"}
          </span>
        </div>
      </div>

      {/* Hidden audio element - preload="metadata" is critical for performance */}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
