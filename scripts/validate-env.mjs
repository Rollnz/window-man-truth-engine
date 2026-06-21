#!/usr/bin/env node
/**
 * validate-env.mjs
 * ----------------
 * Validate environment wiring for a migrated WindowMan Truth Engine clone.
 *
 *   1. Load .env.local (if present) into process.env.
 *   2. Confirm required VITE_* frontend vars are set.
 *   3. Warn (don't fail) on optional integration secrets.
 *   4. Scan src/ for forbidden references to server-only secrets.
 *   5. Print a pass/fail report and exit non-zero on any failure.
 *
 * Usage: node scripts/validate-env.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const ROOT = resolve(process.cwd());
const SRC = join(ROOT, 'src');

// ── 1. Load .env.local ──────────────────────────────────────────────────────
const envFile = join(ROOT, '.env.local');
if (existsSync(envFile)) {
  for (const raw of readFileSync(envFile, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

// ── 2/3. Required + optional declarations ───────────────────────────────────
const REQUIRED_FRONTEND = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];
const RECOMMENDED_FRONTEND = [
  'VITE_SUPABASE_PROJECT_ID',
  'VITE_APP_ENV',
  'VITE_SITE_URL',
];
const EXPECTED_EDGE_SECRETS = [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'LOVABLE_API_KEY',
  'RESEND_API_KEY', 'RESEND_FROM_EMAIL',
  'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID',
  'META_PIXEL_ID', 'META_ACCESS_TOKEN', 'META_TEST_EVENT_CODE',
  'PHONECALLBOT_API_KEY', 'PHONECALLBOT_WEBHOOK_SECRET',
];

// ── 4. Forbidden references in browser source ──────────────────────────────
const FORBIDDEN_IN_SRC = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_ACCOUNT_SID',
  'META_ACCESS_TOKEN',
  'RESEND_API_KEY',
  'PHONECALLBOT_API_KEY',
  'PHONECALLBOT_WEBHOOK_SECRET',
  'LEAD_VERIFICATION_SECRET',
  'AUTH_HOOK_SECRET',
  'EDGE_SHARED_SECRET',
];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', '__tests__'].includes(entry.name)) continue;
      yield* walk(abs);
    } else if (/\.(t|j)sx?$/.test(entry.name)) {
      yield abs;
    }
  }
}

const errors = [];
const warnings = [];
const passes  = [];

console.log('▶ Environment validation\n');

// Required frontend vars
for (const k of REQUIRED_FRONTEND) {
  if (process.env[k]) passes.push(`✓ ${k} set`);
  else errors.push(`✘ Missing required frontend var: ${k}`);
}
// Recommended frontend vars (warn-only)
for (const k of RECOMMENDED_FRONTEND) {
  if (process.env[k]) passes.push(`✓ ${k} set`);
  else warnings.push(`⚠ Recommended frontend var not set: ${k}`);
}
// Edge function secrets — informational only; they belong on the Supabase side.
console.log('Edge Function secrets (set via `supabase secrets set`, not Vite):');
for (const k of EXPECTED_EDGE_SECRETS) {
  const present = process.env[k] ? 'present in local env' : 'not present locally (OK if set in Supabase)';
  console.log(`  • ${k.padEnd(34)} ${present}`);
}
console.log('');

// Source scan
if (existsSync(SRC)) {
  for (const file of walk(SRC)) {
    const txt = readFileSync(file, 'utf8');
    for (const name of FORBIDDEN_IN_SRC) {
      // Only flag direct identifier usage, not commented mentions.
      const rx = new RegExp(`\\b${name}\\b`);
      if (rx.test(txt)) {
        const rel = file.slice(ROOT.length + 1).split(sep).join('/');
        // Allow mentions inside comments or string literals that are clearly docs.
        const usageLine = txt.split('\n').find((l) => rx.test(l)) || '';
        if (/^\s*(\/\/|\*|#)/.test(usageLine) || /['"`]\s*[A-Z_]+_REQUIRED/.test(usageLine)) {
          warnings.push(`⚠ ${rel}: mentions ${name} (looks like a comment, verify manually)`);
        } else {
          errors.push(`✘ ${rel}: references server-only secret ${name} from browser code`);
        }
      }
    }
  }
} else {
  warnings.push('⚠ src/ not found — skipping source-scan');
}

// Report
console.log('— Results —');
for (const p of passes)   console.log(p);
for (const w of warnings) console.log(w);
for (const e of errors)   console.log(e);
console.log(`\nSummary: ${passes.length} pass · ${warnings.length} warn · ${errors.length} fail`);

if (errors.length) process.exit(1);
process.exit(0);
