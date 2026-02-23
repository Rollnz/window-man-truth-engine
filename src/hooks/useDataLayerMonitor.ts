/**
 * useDataLayerMonitor — Active Guardian Hook
 *
 * Real-time monitoring of window.dataLayer with:
 *  - Push-proxy interception (same technique as GTM)
 *  - sessionStorage persistence (survives redirects)
 *  - Collision detection with source attribution
 *  - Scroll depth capture at conversion
 *  - Race condition guard (watchdog re-applies proxy if hijacked)
 *  - Client-Server Handshake (Step 5): verifies leads reach the database
 *  - Smart Deduplication Verification (Step 6): parity check with cookie validation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { validateDataLayerEvent } from '@/lib/trackingVerificationTest';
import { isConversionEvent } from '@/lib/emqValidator';
import { supabase } from '@/integrations/supabase/client';

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
  // Step 7: Intent Intelligence
  ttc: number | null;
  intentScore: number | null;
  intentLabel: 'hot' | 'warm' | 'cold' | null;
  // Step 8: Attribution Health
  attributionHealth: 'healthy' | 'repaired' | 'broken' | null;
  missingCookies: string[];
}

export interface HandshakeResult {
  leadId: string;
  status: 'pending' | 'confirmed' | 'lost';
  attempts: number;
  confirmedAt: number | null;
  leadCreatedAt: string | null;
  capiEventCount: number;
  capturedAt: number;
  eventPayload: Record<string, unknown>;
}

export interface ParityResult {
  eventId: string;
  browserEventName: string;
  serverFound: boolean;
  serverEventName: string | null;
  serverIngestedBy: string | null;
  serverSourceSystem: string | null;
  serverFbp: string | null;
  serverFbc: string | null;
  browserFbp: string | null;
  cookieMatch: boolean;
  checkedAt: number;
}

export interface ParityState {
  results: ParityResult[];
  browserOnlyCount: number;
  serverConfirmedCount: number;
  lastCheckedAt: number | null;
  isChecking: boolean;
}

export type SystemHealth = 'idle' | 'healthy' | 'warning' | 'conflict';

export interface MonitorState {
  systemHealth: SystemHealth;
  healthReason: string;
  liveEvents: MonitorEvent[];
  collisionCount: number;
  isMonitoring: boolean;
  handshakeResults: HandshakeResult[];
  parityState: ParityState;
  highlightedEventId: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = '__wm_monitor_state';
const MAX_EVENTS = 20;
const MAX_HANDSHAKES = 10;
const WATCHDOG_INTERVAL_MS = 2000;
const SCROLL_DEBOUNCE_MS = 200;
const CHECK_DELAYS = [10_000, 30_000, 60_000]; // 10s, 30s, 60s
const PARITY_AUTO_DELAY_MS = 15_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip GTM/Meta wrapper prefixes for fuzzy ID matching */
export function normalizeId(id: string): string {
  return id.replace(/^(gtm|meta)\.[^.]+\./, '');
}

function getBrowserFbp(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// ─── Step 7: Intent Scoring ──────────────────────────────────────────────────

export function calculateIntentScore(
  ttcSeconds: number,
  scrollDepth: number,
): { score: number; label: 'hot' | 'warm' | 'cold' } {
  // Bot / accidental detection
  if (ttcSeconds < 3 && scrollDepth < 5) return { score: 1, label: 'cold' };
  if (ttcSeconds < 10) return { score: 3, label: 'cold' };

  let score = 5; // baseline

  // Time component
  if (ttcSeconds >= 120) score += 3;
  else if (ttcSeconds >= 60) score += 2;
  else if (ttcSeconds >= 30) score += 1;

  // Scroll component
  if (scrollDepth >= 75) score += 2;
  else if (scrollDepth >= 50) score += 1;

  // Returning visitor bonus
  try {
    if (sessionStorage.getItem('__wm_returning_visitor')) score += 1;
  } catch { /* noop */ }

  score = Math.min(10, Math.max(1, score));
  const label: 'hot' | 'warm' | 'cold' = score >= 9 ? 'hot' : score >= 6 ? 'warm' : 'cold';
  return { score, label };
}

// ─── Step 8: Attribution Cookie Check + Healer ───────────────────────────────

const FBP_BACKUP_KEY = '__wm_fbp_backup';

export function checkAttributionCookies(): {
  health: 'healthy' | 'repaired' | 'broken';
  missing: string[];
  repairedFbp: string | null;
} {
  const missing: string[] = [];
  let repairedFbp: string | null = null;

  try {
    const cookies = document.cookie;
    const hasFbp = /(?:^|;\s*)_fbp=/.test(cookies);
    const hasGclAu = /(?:^|;\s*)_gcl_au=/.test(cookies);

    // Healer: backup _fbp if present
    if (hasFbp) {
      const match = cookies.match(/(?:^|;\s*)_fbp=([^;]+)/);
      if (match) {
        try { sessionStorage.setItem(FBP_BACKUP_KEY, match[1]); } catch { /* noop */ }
      }
    }

    if (!hasFbp) {
      // Try to heal from sessionStorage
      try {
        const backup = sessionStorage.getItem(FBP_BACKUP_KEY);
        if (backup) {
          repairedFbp = backup;
        } else {
          missing.push('_fbp');
        }
      } catch {
        missing.push('_fbp');
      }
    }

    if (!hasGclAu) missing.push('_gcl_au');

    if (repairedFbp) return { health: 'repaired', missing, repairedFbp };
    if (missing.length > 0) return { health: 'broken', missing, repairedFbp: null };
    return { health: 'healthy', missing: [], repairedFbp: null };
  } catch {
    return { health: 'broken', missing: ['_fbp', '_gcl_au'], repairedFbp: null };
  }
}

function parseCollisionSource(): string | null {
  try {
    const stack = new Error().stack;
    if (!stack) return null;
    const lines = stack.split('\n').slice(1);
    for (const line of lines) {
      if (line.includes('useDataLayerMonitor')) continue;
      const match = line.match(/(https?:\/\/[^\s)]+|[a-zA-Z0-9_\-./]+\.(js|ts|mjs):\d+)/);
      if (match) return match[1];
    }
  } catch { /* noop */ }
  return null;
}

const DEFAULT_PARITY_STATE: ParityState = {
  results: [],
  browserOnlyCount: 0,
  serverConfirmedCount: 0,
  lastCheckedAt: null,
  isChecking: false,
};

interface StoredState {
  events: MonitorEvent[];
  seenIdArray: string[];
  handshakeResults: HandshakeResult[];
  parityState?: ParityState;
  pageLoadTimestamp?: number;
}

function hydrateFromStorage(): { events: MonitorEvent[]; seenIds: Set<string>; handshakeResults: HandshakeResult[]; parityState: ParityState; pageLoadTimestamp: number } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { events: [], seenIds: new Set(), handshakeResults: [], parityState: DEFAULT_PARITY_STATE, pageLoadTimestamp: Date.now() };
    const parsed = JSON.parse(raw) as StoredState;
    return {
      events: parsed.events ?? [],
      seenIds: new Set(parsed.seenIdArray ?? []),
      handshakeResults: parsed.handshakeResults ?? [],
      parityState: parsed.parityState ?? DEFAULT_PARITY_STATE,
      pageLoadTimestamp: parsed.pageLoadTimestamp ?? Date.now(),
    };
  } catch {
    return { events: [], seenIds: new Set(), handshakeResults: [], parityState: DEFAULT_PARITY_STATE, pageLoadTimestamp: Date.now() };
  }
}

function persistToStorage(events: MonitorEvent[], seenIds: Set<string>, handshakeResults: HandshakeResult[], parityState: ParityState, pageLoadTimestamp?: number) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ events, seenIdArray: Array.from(seenIds), handshakeResults, parityState, pageLoadTimestamp } as StoredState),
    );
  } catch { /* quota exceeded */ }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDataLayerMonitor() {
  const [state, setState] = useState<MonitorState>(() => {
    const hydrated = hydrateFromStorage();
    const hasCollisions = hydrated.events.some((e) => e.collision);
    const hasWarning = hydrated.events.some(
      (e) => e.event.startsWith('wm_') && (!e.hasEmail && !e.hasPhone),
    );
    const hasLostLead = hydrated.handshakeResults.some((h) => h.status === 'lost');
    const hasParityGap = hydrated.parityState.browserOnlyCount > 0;
    return {
      systemHealth: hydrated.events.length === 0
        ? 'idle'
        : hasCollisions || hasLostLead
          ? 'conflict'
          : hasWarning || hasParityGap
            ? 'warning'
            : 'healthy',
      healthReason: hasLostLead
        ? `Lead Verification Failed: ${hydrated.handshakeResults.filter(h => h.status === 'lost').length} lead(s) captured in browser but missing from database.`
        : hasParityGap
          ? `Parity Gap: ${hydrated.parityState.browserOnlyCount} browser event(s) not confirmed on server.`
          : '',
      liveEvents: hydrated.events,
      collisionCount: hydrated.events.filter((e) => e.collision).length,
      isMonitoring: false,
      handshakeResults: hydrated.handshakeResults,
      parityState: hydrated.parityState,
      highlightedEventId: null,
    };
  });

  // Mutable refs
  const hydrated0 = hydrateFromStorage();
  const seenIdsRef = useRef<Set<string>>(hydrated0.seenIds);
  const eventsRef = useRef<MonitorEvent[]>(state.liveEvents);
  const handshakeRef = useRef<HandshakeResult[]>(state.handshakeResults);
  const parityRef = useRef<ParityState>(state.parityState);
  const scrollRef = useRef<number>(0);
  const pageLoadTimestampRef = useRef<number>(hydrated0.pageLoadTimestamp);
  const proxyFnRef = useRef<((...args: unknown[]) => number) | null>(null);
  const originalPushRef = useRef<((...args: unknown[]) => number) | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handshakeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const parityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMonitoringRef = useRef(false);

  // ── Scroll listener ──────────────────────────────────────────────────────

  const handleScroll = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      if (docHeight <= 0) return;
      scrollRef.current = Math.min(100, Math.round(((scrollTop + viewportHeight) / docHeight) * 100));
    }, SCROLL_DEBOUNCE_MS);
  }, []);

  // ── Handshake: verify a lead against the server ──────────────────────────

  const updateHandshakeResult = useCallback((leadId: string, update: Partial<HandshakeResult>) => {
    handshakeRef.current = handshakeRef.current.map((h) =>
      h.leadId === leadId ? { ...h, ...update } : h,
    );
    persistToStorage(eventsRef.current, seenIdsRef.current, handshakeRef.current, parityRef.current);

    setState((prev) => {
      const updated = prev.handshakeResults.map((h) =>
        h.leadId === leadId ? { ...h, ...update } : h,
      );
      const lostCount = updated.filter((h) => h.status === 'lost').length;
      let systemHealth = prev.systemHealth;
      let healthReason = prev.healthReason;

      if (lostCount > 0) {
        systemHealth = 'conflict';
        healthReason = `Lead Verification Failed: ${lostCount} lead(s) captured in browser but missing from database.`;
      } else if (update.status === 'confirmed' && prev.systemHealth === 'conflict') {
        const hasCollisions = prev.collisionCount > 0;
        const stillLost = updated.some((h) => h.status === 'lost');
        if (!hasCollisions && !stillLost) {
          systemHealth = prev.parityState.browserOnlyCount > 0 ? 'warning' : 'healthy';
          healthReason = prev.parityState.browserOnlyCount > 0
            ? `Parity Gap: ${prev.parityState.browserOnlyCount} browser event(s) not confirmed on server.`
            : 'All signals nominal. Deduplication pipeline active.';
        }
      }

      return { ...prev, handshakeResults: updated, systemHealth, healthReason };
    });
  }, []);

  const verifyLead = useCallback(async (leadId: string, attemptIndex: number) => {
    try {
      // Find the matching event for intent data
      const matchingEvent = eventsRef.current.find(
        (e) => e.event === 'wm_lead' && e.raw?.lead_id === leadId,
      );
      const bodyPayload: Record<string, unknown> = { lead_id: leadId };
      if (matchingEvent?.intentScore != null && matchingEvent?.intentLabel) {
        bodyPayload.intent_score = matchingEvent.intentScore;
        bodyPayload.intent_label = matchingEvent.intentLabel;
      }

      const { data, error } = await supabase.functions.invoke('verify-lead-exists', {
        body: bodyPayload,
      });

      if (error) {
        console.error('[Guardian] Handshake error:', error.message);
      }

      if (data?.leadExists) {
        const timer = handshakeTimersRef.current.get(leadId);
        if (timer) { clearTimeout(timer); handshakeTimersRef.current.delete(leadId); }

        updateHandshakeResult(leadId, {
          status: 'confirmed',
          confirmedAt: Date.now(),
          leadCreatedAt: data.leadCreatedAt,
          capiEventCount: data.capiEventCount ?? 0,
          attempts: attemptIndex + 1,
        });
        return;
      }

      const nextAttemptIndex = attemptIndex + 1;
      if (nextAttemptIndex < CHECK_DELAYS.length) {
        const currentResult = handshakeRef.current.find((h) => h.leadId === leadId);
        if (!currentResult) return;
        const elapsed = Date.now() - currentResult.capturedAt;
        const targetDelay = CHECK_DELAYS[nextAttemptIndex];
        const remaining = Math.max(0, targetDelay - elapsed);

        updateHandshakeResult(leadId, { attempts: attemptIndex + 1 });

        const timer = setTimeout(() => verifyLead(leadId, nextAttemptIndex), remaining);
        handshakeTimersRef.current.set(leadId, timer);
      } else {
        updateHandshakeResult(leadId, {
          status: 'lost',
          attempts: attemptIndex + 1,
        });
      }
    } catch (err) {
      console.error('[Guardian] Handshake exception:', err);
      updateHandshakeResult(leadId, { status: 'lost', attempts: attemptIndex + 1 });
    }
  }, [updateHandshakeResult]);

  // ── Timer Persistence: resume pending handshakes on mount ────────────────

  useEffect(() => {
    const hydrated = hydrateFromStorage();
    for (const h of hydrated.handshakeResults) {
      if (h.status !== 'pending') continue;
      const elapsed = Date.now() - h.capturedAt;

      let scheduled = false;
      for (let i = h.attempts; i < CHECK_DELAYS.length; i++) {
        const targetDelay = CHECK_DELAYS[i];
        if (elapsed < targetDelay) {
          const remaining = targetDelay - elapsed;
          const timer = setTimeout(() => verifyLead(h.leadId, i), remaining);
          handshakeTimersRef.current.set(h.leadId, timer);
          scheduled = true;
          break;
        }
      }

      if (!scheduled && elapsed >= CHECK_DELAYS[CHECK_DELAYS.length - 1]) {
        updateHandshakeResult(h.leadId, { status: 'lost', attempts: CHECK_DELAYS.length });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start handshake for a new lead ───────────────────────────────────────

  const startHandshake = useCallback((leadId: string, eventPayload: Record<string, unknown>) => {
    if (handshakeRef.current.some((h) => h.leadId === leadId)) return;

    const result: HandshakeResult = {
      leadId,
      status: 'pending',
      attempts: 0,
      confirmedAt: null,
      leadCreatedAt: null,
      capiEventCount: 0,
      capturedAt: Date.now(),
      eventPayload,
    };

    handshakeRef.current = [result, ...handshakeRef.current].slice(0, MAX_HANDSHAKES);
    persistToStorage(eventsRef.current, seenIdsRef.current, handshakeRef.current, parityRef.current);

    setState((prev) => ({
      ...prev,
      handshakeResults: [result, ...prev.handshakeResults].slice(0, MAX_HANDSHAKES),
    }));

    const timer = setTimeout(() => verifyLead(leadId, 0), CHECK_DELAYS[0]);
    handshakeTimersRef.current.set(leadId, timer);
  }, [verifyLead]);

  // ── Force Re-check ──────────────────────────────────────────────────────

  const forceRecheck = useCallback(async (leadId: string) => {
    updateHandshakeResult(leadId, { status: 'pending' });
    await verifyLead(leadId, 2);
  }, [verifyLead, updateHandshakeResult]);

  // ── Step 6: Parity Check ────────────────────────────────────────────────

  const runParityCheck = useCallback(async () => {
    // Collect unique wm_* event_ids
    const eventMap = new Map<string, MonitorEvent>();
    for (const ev of eventsRef.current) {
      if (ev.event.startsWith('wm_') && ev.event_id) {
        const normalized = normalizeId(ev.event_id);
        if (!eventMap.has(normalized)) {
          eventMap.set(normalized, ev);
        }
      }
    }

    if (eventMap.size === 0) return;

    // Set checking state
    parityRef.current = { ...parityRef.current, isChecking: true };
    setState((prev) => ({ ...prev, parityState: { ...prev.parityState, isChecking: true } }));

    const eventIds = Array.from(eventMap.keys()).slice(0, 20);
    const browserFbp = getBrowserFbp();

    try {
      const { data, error } = await supabase.functions.invoke('verify-lead-exists', {
        body: { event_ids: eventIds },
      });

      if (error) {
        console.error('[Guardian] Parity check error:', error.message);
        parityRef.current = { ...parityRef.current, isChecking: false };
        setState((prev) => ({ ...prev, parityState: { ...prev.parityState, isChecking: false } }));
        return;
      }

      const serverResults: Array<{
        event_id: string;
        serverFound: boolean;
        event_name: string | null;
        ingested_by: string | null;
        source_system: string | null;
        fbp: string | null;
        fbc: string | null;
      }> = data?.parityResults ?? [];

      const serverMap = new Map(serverResults.map((r) => [r.event_id, r]));

      const results: ParityResult[] = eventIds.map((eid) => {
        const browserEv = eventMap.get(eid);
        const server = serverMap.get(eid);
        const serverFbp = server?.fbp ?? null;

        return {
          eventId: eid,
          browserEventName: browserEv?.event ?? 'unknown',
          serverFound: !!server?.serverFound,
          serverEventName: server?.event_name ?? null,
          serverIngestedBy: server?.ingested_by ?? null,
          serverSourceSystem: server?.source_system ?? null,
          serverFbp,
          serverFbc: server?.fbc ?? null,
          browserFbp,
          cookieMatch: browserFbp === null || serverFbp === null
            ? true // Can't compare if either is missing
            : browserFbp === serverFbp,
          checkedAt: Date.now(),
        };
      });

      const browserOnlyCount = results.filter((r) => !r.serverFound).length;
      const serverConfirmedCount = results.filter((r) => r.serverFound).length;

      const newParity: ParityState = {
        results,
        browserOnlyCount,
        serverConfirmedCount,
        lastCheckedAt: Date.now(),
        isChecking: false,
      };

      parityRef.current = newParity;
      persistToStorage(eventsRef.current, seenIdsRef.current, handshakeRef.current, newParity);

      setState((prev) => {
        let systemHealth = prev.systemHealth;
        let healthReason = prev.healthReason;

        // Only escalate, don't downgrade from conflict
        if (browserOnlyCount > 0 && prev.systemHealth !== 'conflict') {
          systemHealth = 'warning';
          healthReason = `Parity Gap: ${browserOnlyCount} browser event(s) not confirmed on server. Meta may be under-counting conversions.`;
        } else if (browserOnlyCount === 0 && prev.systemHealth === 'warning' && prev.collisionCount === 0) {
          // Check if warning was from parity — can resolve
          const hasLost = prev.handshakeResults.some((h) => h.status === 'lost');
          if (!hasLost) {
            systemHealth = 'healthy';
            healthReason = 'All signals nominal. Deduplication pipeline active.';
          }
        }

        return { ...prev, parityState: newParity, systemHealth, healthReason };
      });
    } catch (err) {
      console.error('[Guardian] Parity check exception:', err);
      parityRef.current = { ...parityRef.current, isChecking: false };
      setState((prev) => ({ ...prev, parityState: { ...prev.parityState, isChecking: false } }));
    }
  }, []);

  // ── Highlighted Event ID (for cross-component hover) ─────────────────────

  const setHighlightedEventId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, highlightedEventId: id }));
  }, []);

  // ── Process a new dataLayer entry ────────────────────────────────────────

  const processEntry = useCallback((entry: Record<string, unknown>) => {
    const eventName = (entry.event as string) ?? '';
    if (!eventName) return;

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

    // Step 7 & 8: Intent + Attribution for wm_* conversion events
    let ttc: number | null = null;
    let intentScore: number | null = null;
    let intentLabel: MonitorEvent['intentLabel'] = null;
    let attributionHealth: MonitorEvent['attributionHealth'] = null;
    let missingCookies: string[] = [];

    if (eventName.startsWith('wm_')) {
      ttc = (Date.now() - pageLoadTimestampRef.current) / 1000;
      const intent = calculateIntentScore(ttc, scrollRef.current);
      intentScore = intent.score;
      intentLabel = intent.label;

      const attrCheck = checkAttributionCookies();
      attributionHealth = attrCheck.health;
      missingCookies = attrCheck.missing;

      // Set returning visitor flag after first wm_* event
      try { sessionStorage.setItem('__wm_returning_visitor', '1'); } catch { /* noop */ }
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
      ttc,
      intentScore,
      intentLabel,
      attributionHealth,
      missingCookies,
    };

    const updated = [monitorEvent, ...eventsRef.current].slice(0, MAX_EVENTS);
    eventsRef.current = updated;

    // Determine health
    let systemHealth: SystemHealth = 'healthy';
    let healthReason = 'All signals nominal. Deduplication pipeline active.';
    let collisionCount = 0;

    for (const ev of updated) {
      if (ev.collision) collisionCount++;
    }

    const lostLeadCount = handshakeRef.current.filter((h) => h.status === 'lost').length;
    const parityGap = parityRef.current.browserOnlyCount;

    if (collisionCount > 0 || lostLeadCount > 0) {
      systemHealth = 'conflict';
      if (lostLeadCount > 0) {
        healthReason = `Lead Verification Failed: ${lostLeadCount} lead(s) captured in browser but missing from database.`;
      } else {
        const lastCollision = updated.find((e) => e.collision);
        healthReason = `Deduplication Collision: event_id "${lastCollision?.event_id?.slice(0, 12)}…" reused ${collisionCount} time(s).`;
      }
    } else if (parityGap > 0) {
      systemHealth = 'warning';
      healthReason = `Parity Gap: ${parityGap} browser event(s) not confirmed on server. Meta may be under-counting conversions.`;
    } else if (
      monitorEvent.event === 'wm_lead' &&
      monitorEvent.ttc !== null && monitorEvent.ttc < 3 &&
      monitorEvent.scrollDepth < 5
    ) {
      systemHealth = 'warning';
      healthReason = `Potential Bot: Lead converted in ${monitorEvent.ttc.toFixed(1)}s with ${monitorEvent.scrollDepth}% scroll. Verify manually.`;
    } else if (
      monitorEvent.event.startsWith('wm_') &&
      !monitorEvent.hasEmail &&
      !monitorEvent.hasPhone
    ) {
      systemHealth = 'warning';
      healthReason = 'Low Match Quality. Meta can only attribute ~30% of these leads without hashed email/phone data.';
    }

    persistToStorage(updated, seenIdsRef.current, handshakeRef.current, parityRef.current, pageLoadTimestampRef.current);

    setState((prev) => ({
      ...prev,
      liveEvents: updated,
      systemHealth,
      healthReason,
      collisionCount,
    }));

    // Step 5: Start handshake for wm_lead events
    const leadId = entry.lead_id as string | undefined;
    if (eventName === 'wm_lead' && leadId) {
      startHandshake(leadId, entry);
    }
  }, [startHandshake]);

  // ── Apply the push proxy ────────────────────────────────────────────────

  const applyProxy = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!Array.isArray((window as any).dataLayer)) {
      (window as any).dataLayer = [];
    }
    const dl = (window as any).dataLayer as unknown[];

    if (!originalPushRef.current) {
      originalPushRef.current = dl.push.bind(dl);
    }

    const proxy = (...args: unknown[]): number => {
      const result = originalPushRef.current!(...args);
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

  // ── Watchdog ─────────────────────────────────────────────────────────────

  const startWatchdog = useCallback(() => {
    if (watchdogRef.current) return;
    watchdogRef.current = setInterval(() => {
      if (typeof window === 'undefined') return;
      const dl = (window as any).dataLayer;
      if (!Array.isArray(dl) || dl.push !== proxyFnRef.current) {
        console.warn('[Guardian] DataLayer was reset by external script. Re-applying proxy.');
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
        ? prev.systemHealth === 'idle' ? 'healthy' : prev.systemHealth
        : 'healthy',
      healthReason: prev.liveEvents.length > 0
        ? prev.healthReason
        : 'All signals nominal. Deduplication pipeline active.',
    }));

    // Auto-trigger parity check after 15s if we have events
    parityTimerRef.current = setTimeout(() => {
      if (eventsRef.current.some((e) => e.event.startsWith('wm_') && e.event_id)) {
        runParityCheck();
      }
    }, PARITY_AUTO_DELAY_MS);
  }, [applyProxy, startWatchdog, handleScroll, runParityCheck]);

  const stopMonitoring = useCallback(() => {
    isMonitoringRef.current = false;

    if (typeof window !== 'undefined' && originalPushRef.current) {
      const dl = (window as any).dataLayer;
      if (Array.isArray(dl)) {
        dl.push = originalPushRef.current as any;
      }
      originalPushRef.current = null;
    }
    proxyFnRef.current = null;

    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }

    if (parityTimerRef.current) {
      clearTimeout(parityTimerRef.current);
      parityTimerRef.current = null;
    }

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
        if (typeof window !== 'undefined' && originalPushRef.current) {
          const dl = (window as any).dataLayer;
          if (Array.isArray(dl)) dl.push = originalPushRef.current as any;
        }
        if (watchdogRef.current) clearInterval(watchdogRef.current);
        window.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (parityTimerRef.current) clearTimeout(parityTimerRef.current);
      for (const timer of handshakeTimersRef.current.values()) {
        clearTimeout(timer);
      }
      handshakeTimersRef.current.clear();
    };
  }, [handleScroll]);

  // ── Computed: Intent Distribution ─────────────────────────────────────────
  const intentDistribution = {
    hot: state.liveEvents.filter((e) => e.intentLabel === 'hot').length,
    warm: state.liveEvents.filter((e) => e.intentLabel === 'warm').length,
    cold: state.liveEvents.filter((e) => e.intentLabel === 'cold').length,
  };

  return {
    state,
    startMonitoring,
    stopMonitoring,
    forceRecheck,
    runParityCheck,
    setHighlightedEventId,
    intentDistribution,
  };
}
