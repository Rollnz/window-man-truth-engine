/**
 * AuthRecoveryTester
 * 
 * Development-only floating debug panel to manually test the 3 edge cases
 * of the centralized auth error recovery system:
 * 
 * 1. Idempotent GET — silent retry after token refresh
 * 2. Non-idempotent POST — SessionRefreshedError with friendly toast
 * 3. Dead session — SessionExpiredOverlay modal
 * 
 * Corrupts the session token to force a 401, then fires the appropriate
 * wrapper function to exercise the recovery path.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchEdgeFunction, invokeEdgeFunction } from '@/lib/edgeFunction';
import { SessionRefreshedError } from '@/lib/errors';
import { toast } from 'sonner';
import { ShieldAlert, X } from 'lucide-react';

type LogEntry = { time: string; msg: string; level: 'info' | 'ok' | 'warn' | 'error' };

export function AuthRecoveryTester() {
  const [isOpen, setIsOpen] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const log = (msg: string, level: LogEntry['level'] = 'info') => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setLogs(prev => [...prev, { time, msg, level }]);
  };

  const clearLogs = () => setLogs([]);

  /**
   * Corrupt the access_token stored by Supabase's GoTrueClient so the
   * next request will send an invalid JWT → guaranteed 401 from the server.
   * The refresh_token remains intact so `refreshSession()` can recover.
   */
  const corruptAccessToken = async () => {
    // Find the Supabase auth storage key
    const storageKey = Object.keys(localStorage).find(k =>
      k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (!storageKey) {
      log('❌ No Supabase auth token found in localStorage. Are you logged in?', 'error');
      return false;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) { log('❌ Auth token is empty', 'error'); return false; }
      const parsed = JSON.parse(raw);
      // Corrupt the access_token by appending junk
      if (parsed.access_token) {
        parsed.access_token = parsed.access_token + '_CORRUPTED';
        localStorage.setItem(storageKey, JSON.stringify(parsed));
        log('🔧 Access token corrupted in localStorage', 'warn');
      }
      // Also force GoTrueClient to re-read the corrupted token
      // by calling getSession which will pick up the localStorage value
      await supabase.auth.getSession();
      return true;
    } catch (e) {
      log(`❌ Failed to corrupt token: ${e}`, 'error');
      return false;
    }
  };

  /**
   * Test 1: Idempotent GET via fetchEdgeFunction
   * Expected: 401 → refresh → silent retry → success (no toast)
   */
  const testIdempotentGet = async () => {
    setRunning('get');
    clearLogs();
    log('🧪 TEST 1: Idempotent GET (silent recovery)');
    log('Expected: 401 → refresh lock → retry → success, NO error toast');

    const ok = await corruptAccessToken();
    if (!ok) { setRunning(null); return; }

    try {
      log('📡 Calling fetchEdgeFunction("get-ticker-stats", GET)...');
      const { data } = await fetchEdgeFunction('get-ticker-stats');
      log(`✅ SUCCESS — Data received: ${JSON.stringify(data).slice(0, 100)}`, 'ok');
      log('✅ No toast should have appeared. Token was silently refreshed.', 'ok');
    } catch (err) {
      if (err instanceof SessionRefreshedError) {
        log('⚠️ UNEXPECTED SessionRefreshedError for GET — this should NOT happen', 'error');
      } else {
        log(`❌ Request failed: ${err instanceof Error ? err.message : err}`, 'error');
      }
    }
    setRunning(null);
  };

  /**
   * Test 2: Non-idempotent POST via invokeEdgeFunction
   * Expected: 401 → refresh → SessionRefreshedError → friendly toast
   */
  const testNonIdempotentPost = async () => {
    setRunning('post');
    clearLogs();
    log('🧪 TEST 2: Non-Idempotent POST (SessionRefreshedError)');
    log('Expected: 401 → refresh → abort retry → friendly info toast');

    const ok = await corruptAccessToken();
    if (!ok) { setRunning(null); return; }

    try {
      log('📡 Calling invokeEdgeFunction("score-event", POST, isIdempotent: false)...');
      const { data, error } = await invokeEdgeFunction('score-event', {
        body: { eventType: 'auth_test', entityType: 'debug', entityId: 'test-123', points: 0 },
        isIdempotent: false,
      });

      if (error) {
        log(`❌ Got error object (not thrown): ${error.message}`, 'error');
      } else {
        log(`⚠️ UNEXPECTED success — POST should have thrown SessionRefreshedError`, 'warn');
      }
    } catch (err) {
      if (err instanceof SessionRefreshedError) {
        log('✅ Caught SessionRefreshedError as expected!', 'ok');
        toast.info('Session re-synced! Please click submit one more time.');
        log('✅ Friendly info toast displayed (check top-right)', 'ok');
      } else {
        log(`❌ Unexpected error type: ${err instanceof Error ? err.constructor.name : typeof err}: ${err}`, 'error');
      }
    }
    setRunning(null);
  };

  /**
   * Test 3: Dead session (refresh token destroyed)
   * Expected: 401 → refresh fails → auth:session-expired event → overlay
   */
  const testDeadSession = async () => {
    setRunning('dead');
    clearLogs();
    log('🧪 TEST 3: Dead Session (SessionExpiredOverlay)');
    log('Expected: 401 → refresh fails → overlay appears, NO redirect');

    // Nuke BOTH access and refresh tokens
    const storageKey = Object.keys(localStorage).find(k =>
      k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (!storageKey) {
      log('❌ No Supabase auth token found. Are you logged in?', 'error');
      setRunning(null);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) { log('❌ Auth token is empty', 'error'); setRunning(null); return; }
      const parsed = JSON.parse(raw);
      parsed.access_token = 'DEAD_TOKEN';
      parsed.refresh_token = 'DEAD_REFRESH_TOKEN';
      localStorage.setItem(storageKey, JSON.stringify(parsed));
      log('💀 Both access_token AND refresh_token destroyed', 'warn');

      // Force GoTrueClient to pick up the corrupted values
      await supabase.auth.getSession();

      log('📡 Calling fetchEdgeFunction("get-ticker-stats", GET) with dead session...');
      const { data } = await fetchEdgeFunction('get-ticker-stats');
      log(`⚠️ UNEXPECTED success: ${JSON.stringify(data).slice(0, 80)}`, 'warn');
    } catch (err) {
      log(`🔴 Request failed (expected): ${err instanceof Error ? err.message : err}`, 'info');
      log('✅ SessionExpiredOverlay should now be visible on screen', 'ok');
      log('✅ Current URL should NOT have changed to /auth', 'ok');
    }
    setRunning(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] bg-destructive text-destructive-foreground rounded-full p-2 shadow-lg hover:opacity-90 transition-opacity"
        title="Auth Recovery Tester"
      >
        <ShieldAlert className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-[420px] max-h-[80vh] bg-popover text-popover-foreground border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <span className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-destructive" />
          Auth Recovery Tester
        </span>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 p-3">
        <button
          onClick={testIdempotentGet}
          disabled={!!running}
          className="text-xs px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 text-left"
        >
          {running === 'get' ? '⏳ Running...' : '1️⃣ Test Idempotent GET (silent retry)'}
        </button>
        <button
          onClick={testNonIdempotentPost}
          disabled={!!running}
          className="text-xs px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 text-left"
        >
          {running === 'post' ? '⏳ Running...' : '2️⃣ Test Non-Idempotent POST (friendly toast)'}
        </button>
        <button
          onClick={testDeadSession}
          disabled={!!running}
          className="text-xs px-3 py-2 rounded bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50 text-left"
        >
          {running === 'dead' ? '⏳ Running...' : '3️⃣ Test Dead Session (overlay)'}
        </button>
      </div>

      {/* Log output */}
      {logs.length > 0 && (
        <div className="border-t border-border px-3 py-2 overflow-y-auto max-h-[40vh] text-[11px] font-mono leading-relaxed space-y-0.5">
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.level === 'ok' ? 'text-green-500' :
                l.level === 'warn' ? 'text-yellow-500' :
                l.level === 'error' ? 'text-red-500' :
                'text-muted-foreground'
              }
            >
              <span className="opacity-60">{l.time}</span> {l.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
