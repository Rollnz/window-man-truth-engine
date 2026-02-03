

# Single Playback Enforcement for Activity Feed

## Problem Statement

Currently, each `AudioPlayer` component instance operates independently. When a user plays a recording in Row 1, then clicks play on Row 2, **both recordings play simultaneously**. This creates a poor user experience and audio confusion.

## Solution: Shared Audio Coordination Context

Create a lightweight React Context that enforces "only one audio plays at a time" across all `AudioPlayer` instances in the Activity Feed.

---

## Architecture

```text
+--------------------------------------------------+
|           AudioPlaybackProvider                  |
|  (Wraps ActivityFeed in CallAgentsConfig.tsx)    |
+--------------------------------------------------+
        |                        |
        v                        v
+----------------+       +----------------+
|  ActivityRow   |       |  ActivityRow   |
|                |       |                |
| +------------+ |       | +------------+ |
| |AudioPlayer | |       | |AudioPlayer | |
| |  (id: A)   | |       | |  (id: B)   | |
| +------------+ |       | +------------+ |
+----------------+       +----------------+

When AudioPlayer A calls `requestPlayback("A")`:
  1. Context updates activeId to "A"
  2. AudioPlayer B sees activeId !== "B" 
  3. AudioPlayer B pauses itself
```

---

## Implementation Plan

### Step 1: Create the Audio Playback Context

**File:** `src/contexts/AudioPlaybackContext.tsx`

- Exports `AudioPlaybackProvider` and `useAudioPlayback` hook
- Tracks `activePlayerId: string | null` in state
- Provides `requestPlayback(id)` function to claim active status
- Provides `stopPlayback()` function to clear active status

### Step 2: Modify AudioPlayer Component

**File:** `src/components/admin/AudioPlayer.tsx`

Changes:
1. Add `playerId` prop (unique identifier, e.g., call ID)
2. Import and use `useAudioPlayback()` hook
3. In `togglePlay()`: call `requestPlayback(playerId)` before playing
4. Add `useEffect` that watches `activePlayerId`:
   - If `activePlayerId !== playerId && playerState === "playing"` then pause
5. On audio `ended` event: call `stopPlayback()` to release the lock

### Step 3: Update ActivityRow

**File:** `src/components/admin/ActivityRow.tsx`

- Pass `playerId={call.id}` to `<AudioPlayer>` component

### Step 4: Wrap ActivityFeed with Provider

**File:** `src/pages/admin/CallAgentsConfig.tsx`

- Import `AudioPlaybackProvider`
- Wrap the `<ActivityFeed>` component with `<AudioPlaybackProvider>`

---

## Detailed Code Changes

### New File: AudioPlaybackContext.tsx

```typescript
// src/contexts/AudioPlaybackContext.tsx
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
```

### Modified: AudioPlayer.tsx

Key additions:
- New prop: `playerId: string`
- Hook: `const { activePlayerId, requestPlayback, stopPlayback } = useAudioPlayback();`
- Effect to pause when another player takes over:
  ```typescript
  useEffect(() => {
    if (activePlayerId !== playerId && playerState === 'playing') {
      audioRef.current?.pause();
    }
  }, [activePlayerId, playerId, playerState]);
  ```
- In `togglePlay()`, call `requestPlayback(playerId)` before `audio.play()`
- In `handleEnded`, call `stopPlayback()`

### Modified: ActivityRow.tsx

```diff
- <AudioPlayer src={call.recording_url} autoStart={playOnOpen} />
+ <AudioPlayer 
+   src={call.recording_url} 
+   autoStart={playOnOpen} 
+   playerId={call.id} 
+ />
```

### Modified: CallAgentsConfig.tsx

```diff
+ import { AudioPlaybackProvider } from '@/contexts/AudioPlaybackContext';

// In the return statement, wrap ActivityFeed:
- <ActivityFeed ... />
+ <AudioPlaybackProvider>
+   <ActivityFeed ... />
+ </AudioPlaybackProvider>
```

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Play Row 1, then Play Row 2 | Row 1 auto-pauses, Row 2 plays |
| Play Row 1, manually pause Row 1, play Row 2 | Works normally |
| Audio ends naturally | Releases lock (stopPlayback called) |
| User seeks while another is playing | Original player pauses first |
| Row collapses while playing | Audio element unmounts, cleanup runs |
| Context not provided (safety) | Error thrown with clear message |

---

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `src/contexts/AudioPlaybackContext.tsx` | **New** |
| `src/components/admin/AudioPlayer.tsx` | Modified |
| `src/components/admin/ActivityRow.tsx` | Modified (1 line) |
| `src/pages/admin/CallAgentsConfig.tsx` | Modified (2 lines) |

---

## Technical Notes

- **No breaking changes**: The `playerId` prop is required, but only used within the admin Activity tab
- **Minimal re-renders**: Only the specific AudioPlayer whose state changes will re-render
- **Cleanup safe**: The context clears automatically when the provider unmounts
- **Lazy loading preserved**: `preload="metadata"` remains untouched

