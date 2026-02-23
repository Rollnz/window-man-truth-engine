/**
 * useDataLayerMonitor — Active Guardian Hook
 *
 * Real-time monitoring of window.dataLayer with:
 *  - Push-proxy interception (same technique as GTM)
 *  - sessionStorage persistence (survives redirects)
 *  - Collision detection with source attribution
 *  - Scroll depth capture at conversion
 *  - Race condition guard (watchdog re-applies proxy if hijacked)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { validateDataLayerEvent } from '@/lib/trackingVerificationTest';
import { isConversionEvent } from '@/lib/emqValidator';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MonitorEvent {
  event: string;
  event_id: string | undefined;
  timestamp: number;
  emqScore: number | null;
  hasEmail: boolean;
  hasPhone: boolean;
  collision: boolean;
  collisionSource: string | null;
  scrollDepth: number;
  raw: Record<string, unknown>;
}

export type SystemHealth = 'idle' | 'healthy' | 'warning' | 'conflict';

export interface MonitorState {
  systemHealth: SystemHealth;
  healthReason: string;
  liveEvents: MonitorEvent[];
  collisionCount: number;
  isMonitoring: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = '__wm_monitor_state';
const MAX_EVENTS = 20;
const WATCHDOG_INTERVAL_MS = 2000;
const SCROLL_DEBOUNCE_MS = 200;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract the first useful file path from a stack trace, skipping this hook. */
function parseCollisionSource(): string | null {
  try {
    const stack = new Error().stack;
    if (!stack) return null;
    const lines = stack.split('\n').slice(1); // skip "Error"
    for (const line of lines) {
      // Skip our own hook file
      if (line.includes('useDataLayerMonitor')) continue;
      // Look for a URL-like path
      const match = line.match(/(https?:\/\/[^\s)]+|[a-zA-Z0-9_\-./]+\.(js|ts|mjs):\d+)/);
      if (match) return match[1];
    }
  } catch {
    // noop
  }
  return null;
}

function hydrateFromStorage(): { events: MonitorEvent[]; seenIds: Set<string> } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { events: [], seenIds: new Set() };
    const parsed = JSON.parse(raw) as { events: MonitorEvent[]; seenIdArray: string[] };
    return {
      events: parsed.events ?? [],
      seenIds: new Set(parsed.seenIdArray ?? []),
    };
  } catch {
    return { events: [], seenIds: new Set() };
  }
}

function persistToStorage(events: MonitorEvent[], seenIds: Set<string>) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ events, seenIdArray: Array.from(seenIds) }),
    );
  } catch {
    // quota exceeded — silently ignore
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDataLayerMonitor() {
  const [state, setState] = useState<MonitorState>(() => {
    const hydrated = hydrateFromStorage();
    const hasCollisions = hydrated.events.some((e) => e.collision);
    const hasWarning = hydrated.events.some(
      (e) => e.event.startsWith('wm_') && (!e.hasEmail && !e.hasPhone),
    );
    return {
      systemHealth: hydrated.events.length === 0
        ? 'idle'
        : hasCollisions
          ? 'conflict'
          : hasWarning
            ? 'warning'
            : 'healthy',
      healthReason: '',
      liveEvents: hydrated.events,
      collisionCount: hydrated.events.filter((e) => e.collision).length,
      isMonitoring: false,
    };
  });

  // Mutable refs to avoid stale closures inside the proxy
  const seenIdsRef = useRef<Set<string>>(hydrateFromStorage().seenIds);
  const eventsRef = useRef<MonitorEvent[]>(state.liveEvents);
  const scrollRef = useRef<number>(0);
  const proxyFnRef = useRef<((...args: unknown[]) => number) | null>(null);
  const originalPushRef = useRef<((...args: unknown[]) => number) | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMonitoringRef = useRef(false);

  // ── Scroll listener ──────────────────────────────────────────────────────

  const handleScroll = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
      if (docHeight <= 0) return;
      scrollRef.current = Math.min(
        100,
        Math.round(((scrollTop + viewportHeight) / docHeight) * 100),
      );
    }, SCROLL_DEBOUNCE_MS);
  }, []);

  // ── Process a new dataLayer entry ────────────────────────────────────────

  const processEntry = useCallback((entry: Record<string, unknown>) => {
    const eventName = (entry.event as string) ?? '';
    if (!eventName) return; // skip gtm.* noise without an event key

    const eventId = entry.event_id as string | undefined;
    const userData = entry.user_data as Record<string, unknown> | undefined;

    // Collision detection
    let collision = false;
    let collisionSource: string | null = null;
    if (eventId) {
      if (seenIdsRef.current.has(eventId)) {
        collision = true;
        collisionSource = parseCollisionSource();
      } else {
        seenIdsRef.current.add(eventId);
      }
    }

    // EMQ score for conversion events
    let emqScore: number | null = null;
    if (isConversionEvent(eventName)) {
      const validation = validateDataLayerEvent(entry as any);
      emqScore = validation.score;
    }

    const monitorEvent: MonitorEvent = {
      event: eventName,
      event_id: eventId,
      timestamp: Date.now(),
      emqScore,
      hasEmail: !!(userData?.em && typeof userData.em === 'string' && (userData.em as string).length === 64),
      hasPhone: !!(userData?.ph && typeof userData.ph === 'string' && (userData.ph as string).length === 64),
      collision,
      collisionSource,
      scrollDepth: scrollRef.current,
      raw: entry,
    };

    // Prepend (newest first), cap length
    const updated = [monitorEvent, ...eventsRef.current].slice(0, MAX_EVENTS);
    eventsRef.current = updated;

    // Determine health
    let systemHealth: SystemHealth = 'healthy';
    let healthReason = 'All signals nominal. Deduplication pipeline active.';
    let collisionCount = 0;

    for (const ev of updated) {
      if (ev.collision) collisionCount++;
    }

    if (collisionCount > 0) {
      systemHealth = 'conflict';
      const lastCollision = updated.find((e) => e.collision);
      healthReason = `Deduplication Collision: event_id "${lastCollision?.event_id?.slice(0, 12)}…" reused ${collisionCount} time(s). This causes data loss in Meta Ads Manager.`;
    } else if (
      monitorEvent.event.startsWith('wm_') &&
      !monitorEvent.hasEmail &&
      !monitorEvent.hasPhone
    ) {
      systemHealth = 'warning';
      healthReason =
        'Low Match Quality. Meta can only attribute ~30% of these leads without hashed email/phone data.';
    }

    persistToStorage(updated, seenIdsRef.current);

    setState((prev) => ({
      ...prev,
      liveEvents: updated,
      systemHealth,
      healthReason,
      collisionCount,
    }));
  }, []);

  // ── Apply the push proxy ────────────────────────────────────────────────

  const applyProxy = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Ensure dataLayer exists
    if (!Array.isArray((window as any).dataLayer)) {
      (window as any).dataLayer = [];
    }
    const dl = (window as any).dataLayer as unknown[];

    // Save original push only once
    if (!originalPushRef.current) {
      originalPushRef.current = dl.push.bind(dl);
    }

    const proxy = (...args: unknown[]): number => {
      // Call original
      const result = originalPushRef.current!(...args);
      // Process each pushed item
      for (const arg of args) {
        if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
          processEntry(arg as Record<string, unknown>);
        }
      }
      return result;
    };

    proxyFnRef.current = proxy;
    dl.push = proxy as any;
  }, [processEntry]);

  // ── Watchdog (Tweak #3) ──────────────────────────────────────────────────

  const startWatchdog = useCallback(() => {
    if (watchdogRef.current) return;
    watchdogRef.current = setInterval(() => {
      if (typeof window === 'undefined') return;
      const dl = (window as any).dataLayer;
      if (!Array.isArray(dl) || dl.push !== proxyFnRef.current) {
        console.warn('[Guardian] DataLayer was reset by external script. Re-applying proxy.');
        // dataLayer may have been replaced entirely — re-save originalPush
        originalPushRef.current = null;
        applyProxy();
      }
    }, WATCHDOG_INTERVAL_MS);
  }, [applyProxy]);

  // ── Public API ──────────────────────────────────────────────────────────

  const startMonitoring = useCallback(() => {
    if (isMonitoringRef.current) return;
    isMonitoringRef.current = true;

    applyProxy();
    startWatchdog();
    window.addEventListener('scroll', handleScroll, { passive: true });

    setState((prev) => ({
      ...prev,
      isMonitoring: true,
      systemHealth: prev.liveEvents.length > 0
        ? prev.systemHealth === 'idle'
          ? 'healthy'
          : prev.systemHealth
        : 'healthy',
      healthReason: prev.liveEvents.length > 0
        ? prev.healthReason
        : 'All signals nominal. Deduplication pipeline active.',
    }));
  }, [applyProxy, startWatchdog, handleScroll]);

  const stopMonitoring = useCallback(() => {
    isMonitoringRef.current = false;

    // Restore original push
    if (typeof window !== 'undefined' && originalPushRef.current) {
      const dl = (window as any).dataLayer;
      if (Array.isArray(dl)) {
        dl.push = originalPushRef.current as any;
      }
      originalPushRef.current = null;
    }
    proxyFnRef.current = null;

    // Clear watchdog
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }

    // Remove scroll listener
    window.removeEventListener('scroll', handleScroll);

    setState((prev) => ({
      ...prev,
      isMonitoring: false,
      systemHealth: 'idle',
      healthReason: '',
    }));
  }, [handleScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isMonitoringRef.current) {
        // Restore push
        if (typeof window !== 'undefined' && originalPushRef.current) {
          const dl = (window as any).dataLayer;
          if (Array.isArray(dl)) dl.push = originalPushRef.current as any;
        }
        if (watchdogRef.current) clearInterval(watchdogRef.current);
        window.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [handleScroll]);

  return { state, startMonitoring, stopMonitoring };
}
