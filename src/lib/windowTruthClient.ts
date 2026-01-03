/**
 * Lightweight client helper for the Window Truth Engine backend.
 * - Persists/creates a wm_session_id (localStorage first, cookies as backup)
 * - Sends initial session payload with attribution params
 * - Provides a logEvent helper with graceful failure
 *
 * Defensive coding: network failures never throw; they just log to console.
 */

const STORAGE_KEY = "wm_session_id";

type EventPayload = {
  event_name: string;
  params?: Record<string, unknown>;
  tool_name?: string;
  page_path?: string;
};

const getAttributionParams = () => {
  const url = new URL(window.location.href);
  const pick = (key: string) => url.searchParams.get(key) ?? undefined;
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_term: pick("utm_term"),
    utm_content: pick("utm_content"),
    gclid: pick("gclid"),
    fbclid: pick("fbclid"),
    msclkid: pick("msclkid"),
    referrer: document.referrer || undefined,
  };
};

const saveSessionId = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, id);
    document.cookie = `${STORAGE_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (error) {
    console.warn("[wm] unable to persist session id", error);
  }
};

const readSessionId = () => {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage) return fromStorage;
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${STORAGE_KEY}=([^;]*)`));
  return match?.[1];
};

const createOrRefreshSession = async (): Promise<string> => {
  const existing = readSessionId();
  const payload = {
    session_id: existing,
    entry_point: window.location.pathname,
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    user_agent: navigator.userAgent,
    ...getAttributionParams(),
  };

  try {
    const res = await fetch("/api/wm/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`session http ${res.status}`);
    const data = (await res.json()) as { session_id?: string };
    if (data.session_id) {
      saveSessionId(data.session_id);
      return data.session_id;
    }
  } catch (error) {
    console.warn("[wm] session bootstrap failed", error);
  }
  // Fallback: keep using existing client-side ID or mint a local UUID so downstream calls are not blocked.
  if (existing) return existing;
  const localId = crypto.randomUUID();
  saveSessionId(localId);
  return localId;
};

let sessionPromise: Promise<string | undefined> | null = null;

export const getSessionId = async (): Promise<string> => {
  if (!sessionPromise) {
    sessionPromise = createOrRefreshSession();
  }
  return (await sessionPromise) ?? "";
};

export const logEvent = async ({ event_name, params = {}, tool_name, page_path }: EventPayload) => {
  const session_id = await getSessionId();
  if (!session_id) {
    console.warn("[wm] cannot log event without session");
    return;
  }

  try {
    await fetch("/api/wm/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id,
        event_name,
        tool_name,
        page_path: page_path ?? window.location.pathname,
        params,
      }),
    });
  } catch (error) {
    console.warn("[wm] logEvent failed", error);
  }
};
