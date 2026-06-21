#!/usr/bin/env node
/**
 * smoke-test-edge-functions.mjs
 * -----------------------------
 * Verify the migrated Supabase Edge Functions respond as expected.
 *
 * - DRY-RUN by default: prints the URL, headers, payload, and curl equivalent
 *   for every check. NO network calls. NO third-party APIs touched.
 * - With `--live`, performs the HTTPS POST against your configured
 *   SUPABASE_URL using SUPABASE_ANON_KEY. Synthetic payloads only —
 *   never real customer PII.
 * - Set TEST_EVENT_CODE=<META_TEST_EVENT_CODE> to route Meta CAPI events
 *   into Meta's Test Events view instead of production.
 *
 * Usage:
 *   node scripts/smoke-test-edge-functions.mjs               # dry-run
 *   node scripts/smoke-test-edge-functions.mjs --live        # actually call
 *   node scripts/smoke-test-edge-functions.mjs --live --only=send-otp,track
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(process.cwd());

// Load .env.local
const envPath = join(ROOT, '.env.local');
if (existsSync(envPath)) {
  for (const raw of readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [k, ...rest] = line.split('=');
    if (!(k in process.env)) process.env[k] = rest.join('=').replace(/^["']|["']$/g, '');
  }
}

const LIVE = process.argv.includes('--live');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1]?.split(',') ?? null;
const SUPABASE_URL  = process.env.SUPABASE_URL  || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const TEST_EVENT_CODE = process.env.TEST_EVENT_CODE || process.env.META_TEST_EVENT_CODE || '';

if (LIVE && (!SUPABASE_URL || !SUPABASE_ANON)) {
  console.error('✘ --live requires SUPABASE_URL and SUPABASE_ANON_KEY (or the VITE_ equivalents) in .env.local');
  process.exit(1);
}

// Synthetic payloads — safe to send.
const SYNTH = {
  phoneE164: '+15005550006',     // Twilio magic test number — never charged.
  email:     'smoke+test@example.invalid',
  firstName: 'Smoke',
  lastName:  'Test',
  zip:       '33401',
  sessionId: '00000000-0000-4000-8000-000000000001',
  clientId:  '00000000-0000-4000-8000-000000000002',
};

/**
 * Each check declares the function path, method, payload, and what a healthy
 * response looks like. Add new edge functions here as the surface grows.
 */
const CHECKS = [
  {
    fn: 'get-ticker-stats', method: 'GET',
    payload: null,
    expect: '200 with `{ totals: ..., last_updated: ... }`',
    notes:  'Public read-only — safe to call live.',
  },
  {
    fn: 'send-otp', method: 'POST',
    payload: { phone: SYNTH.phoneE164, sessionId: SYNTH.sessionId, source: 'smoke-test', dry_run: true },
    expect: '200 `{ ok: true }` (or 4xx if dry_run not honored — investigate Twilio config).',
    notes:  'Twilio magic phone +15005550006 → no real SMS sent. Twilio Verify still bills a verification attempt; keep usage low.',
  },
  {
    fn: 'verify-otp', method: 'POST',
    payload: { phone: SYNTH.phoneE164, code: '000000', sessionId: SYNTH.sessionId, dry_run: true },
    expect: '400 `{ ok: false, code: "invalid_code" }` — confirms function is wired.',
  },
  {
    fn: 'initiate-lead-verification', method: 'POST',
    payload: { phone: SYNTH.phoneE164, email: SYNTH.email, sessionId: SYNTH.sessionId, source_tool: 'smoke-test' },
    expect: '200 with a verification handle, or 4xx for missing fields.',
    notes:  'verify_jwt=false — public endpoint. Rate-limit must be configured in target.',
  },
  {
    fn: 'verify-lead-exists', method: 'POST',
    payload: { email: SYNTH.email },
    expect: '200 `{ exists: false }`.',
  },
  {
    fn: 'verify-lead-otp', method: 'POST',
    payload: { phone: SYNTH.phoneE164, code: '000000', email: SYNTH.email, sessionId: SYNTH.sessionId },
    expect: '400 invalid code — function reachable.',
  },
  {
    fn: 'auth-email-hook', method: 'POST',
    payload: {
      user: { email: SYNTH.email, id: '00000000-0000-0000-0000-000000000000' },
      email_data: { token: '000000', token_hash: 'smoke', redirect_to: 'http://localhost:8080', email_action_type: 'signup', site_url: 'http://localhost:8080' },
    },
    expect: '200 — Resend dispatched a test email.',
    notes:  'Without an AUTH_HOOK_SECRET shared secret check this will respond regardless. Confirm signature header logic before going live.',
  },
  {
    fn: 'orchestrate-quote-analysis', method: 'POST',
    payload: { quote_analysis_id: SYNTH.sessionId, session_id: SYNTH.sessionId, dry_run: true },
    expect: '4xx (missing scan) — proves function reachable without burning AI credits.',
    notes:  'Live call may invoke Lovable AI Gateway. Keep dry_run flag honored.',
  },
  {
    fn: 'wm-analyze-quote', method: 'POST',
    payload: { extracted_text: 'Synthetic quote for smoke test. 5 windows, $4500.', dry_run: true },
    expect: '200 with analysis JSON, or 4xx if dry_run required.',
    notes:  'Stateless. Will hit AI gateway if dry_run not honored.',
  },
  {
    fn: 'log-event', method: 'POST',
    payload: { event_name: 'smoke_test_event', session_id: SYNTH.sessionId, client_id: SYNTH.clientId, source_tool: 'smoke-test' },
    expect: '200 `{ ok: true }`. Inserts a row in wm_event_log.',
    notes:  'verify_jwt=false. Public.',
  },
  {
    fn: 'signal', method: 'POST',
    payload: { event_name: 'wm_smoke_test', session_id: SYNTH.sessionId, client_id: SYNTH.clientId },
    expect: '200. Validates the wm_ signal firewall.',
  },
  {
    fn: 'track', method: 'POST',
    payload: {
      event_name: 'wm_smoke_test',
      session_id: SYNTH.sessionId,
      client_id: SYNTH.clientId,
      email_sha256: 'sha256(test)',
      test_event_code: TEST_EVENT_CODE || undefined,
    },
    expect: '200. If TEST_EVENT_CODE is set, the event appears in Meta Events Manager → Test Events.',
    notes:  'Requires META_PIXEL_ID + META_ACCESS_TOKEN as edge secrets to forward to Meta CAPI.',
  },
  {
    fn: 'enqueue-phonecall', method: 'POST',
    payload: { lead_id: SYNTH.sessionId, source_tool: 'smoke-test', phone_e164: SYNTH.phoneE164, dry_run: true },
    expect: '4xx (no matching lead) — proves wiring without actually dialing.',
  },
  {
    fn: 'trigger-phone-call', method: 'POST',
    payload: { call_request_id: SYNTH.sessionId, dry_run: true },
    expect: '4xx — function reachable. Live mode would talk to PhoneCall.bot.',
  },
  {
    fn: 'slide-over-chat', method: 'POST',
    payload: { message: 'smoke test', persona: 'default', session_id: SYNTH.sessionId, dry_run: true },
    expect: '200 chat reply or 4xx if dry_run required.',
    notes:  'Uses Lovable AI Gateway — keep dry_run.',
  },
  {
    fn: 'expert-chat', method: 'POST',
    payload: { message: 'smoke test', session_id: SYNTH.sessionId, dry_run: true },
    expect: '200 or 4xx — function reachable.',
    notes:  'Uses Lovable AI Gateway.',
  },
];

function curlFor(fn, method, payload) {
  const url = `${SUPABASE_URL || 'https://<project>.supabase.co'}/functions/v1/${fn}`;
  const body = payload ? ` \\\n  -d '${JSON.stringify(payload)}'` : '';
  return `curl -X ${method} '${url}' \\\n  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\\n  -H "Content-Type: application/json"${body}`;
}

async function run() {
  console.log(`▶ Edge-function smoke test  (${LIVE ? 'LIVE' : 'DRY-RUN'})`);
  console.log(`  Project URL: ${SUPABASE_URL || '(not set — dry-run only)'}`);
  if (TEST_EVENT_CODE) console.log(`  Meta test_event_code: ${TEST_EVENT_CODE}`);
  console.log('');

  let pass = 0, fail = 0, skip = 0;
  for (const c of CHECKS) {
    if (ONLY && !ONLY.includes(c.fn)) { skip++; continue; }
    console.log(`── ${c.fn} ──`);
    console.log(`  expects: ${c.expect}`);
    if (c.notes) console.log(`  notes:   ${c.notes}`);
    console.log(`  curl:\n    ${curlFor(c.fn, c.method, c.payload).replace(/\n/g, '\n    ')}`);

    if (!LIVE) { console.log(`  status:  DRY-RUN (no request sent)\n`); continue; }

    try {
      const url = `${SUPABASE_URL}/functions/v1/${c.fn}`;
      const res = await fetch(url, {
        method: c.method,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'apikey': SUPABASE_ANON,
          'Content-Type': 'application/json',
        },
        body: c.payload ? JSON.stringify(c.payload) : undefined,
      });
      const text = await res.text();
      const snippet = text.length > 240 ? text.slice(0, 240) + '…' : text;
      const ok = res.status < 500;
      console.log(`  status:  HTTP ${res.status} ${ok ? '✓ reachable' : '✘ server error'}`);
      console.log(`  body:    ${snippet}\n`);
      if (ok) pass++; else fail++;
    } catch (err) {
      console.log(`  status:  ✘ network error — ${err.message}\n`);
      fail++;
    }
  }

  console.log(`— Summary: ${pass} reachable · ${fail} failed · ${skip} skipped —`);
  if (!LIVE) console.log(`Re-run with --live to actually invoke the functions.`);
  process.exit(fail ? 1 : 0);
}

run();
