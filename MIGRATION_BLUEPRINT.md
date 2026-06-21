# WindowMan Truth Engine Migration Blueprint

> **Purpose**  Port the entire Lovable project (`faf9d037-b00e-4588-a259-0baf63925ffd`) into a fresh Cursor-managed repo + a fresh Supabase project, without exposing secrets and without touching production.
>
> **Audience**  Lead engineer doing the move + Cursor as a co-pilot. All shell commands assume `pnpm` by default; alternatives for `npm`, `bun`, `yarn` are noted inline.

---

## 1. Migration Assumptions

1. The source repo is the current Lovable project; the file inventory in `migration-manifest.json` was generated from a live filesystem walk on **2026-06-21**.
2. The target is a **new Git repo** edited in Cursor and a **new Supabase project** (not a fork of the source project).
3. Frontend stack: Vite 5 + React 18 + TypeScript 5 + Tailwind v3 + shadcn/ui. Backend: Supabase (Postgres + Auth + Storage + Edge Functions on Deno).
4. Package manager order of preference: **pnpm → bun → npm → yarn** (driven by which lockfile survives the copy).
5. Third-party integrations are all keyed by Edge Function secrets (Twilio Verify, Resend, Meta CAPI, PhoneCall.bot, Lovable AI Gateway). None are required to install or `pnpm build`, only to fully exercise the live flows.
6. The source project's 11 `verify_jwt = false` edge functions are intentionally public-callable. They MUST be reviewed in §8E before the target goes live.
7. Real secrets and PII never leave the original Supabase dashboard. The migration kit ships **placeholders only** (`.env.example`).

---

## 2. Repository Manifest

The full inventory is in **`migration-manifest.json`** at the repo root. It is hybrid:

- Bulk source trees (`src/components/**`, `src/pages/**`, `src/hooks/**`, `src/lib/**`, `public/**`, migrations) are described by a single `glob` entry with `migration_notes`.
- Every Edge Function, every integration file, every root config, and every file with a `contains_secret_risk` or `browser_exposed` concern is listed **explicitly**.

Field reference:

```json
{
  "path": "supabase/functions/send-otp/index.ts",
  "required": true,
  "category": "supabase_functions",
  "migration_notes": "verify_jwt=false. Twilio Verify SMS OTP.",
  "contains_secret_risk": true,
  "browser_exposed": false
}
```

`unknown_or_review_required` captures items that should never be migrated mechanically: `.env` (live secrets), `node_modules/`, Supabase CLI scratch dirs.

---

## 3. `.env.example`

See **`.env.example`** at the repo root. Two sections:

- **Top block — Frontend (`VITE_*`)** — bundled into the browser. Only safe-to-publish values.
- **Bottom block — Edge Function Secrets** — set with `supabase secrets set NAME=value`. **Never** prefix with `VITE_`. **Never** commit. **Never** import from `src/`.

| Goes in `.env.local` (frontend)             | Goes in Supabase Edge Function Secrets     | Never committed anywhere |
| ------------------------------------------- | ------------------------------------------ | ------------------------ |
| `VITE_SUPABASE_URL`                         | `SUPABASE_SERVICE_ROLE_KEY`                | Any value above          |
| `VITE_SUPABASE_PROJECT_ID`                  | `LOVABLE_API_KEY`                          |                          |
| `VITE_SUPABASE_PUBLISHABLE_KEY`             | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`      |                          |
| `VITE_APP_ENV`, `VITE_SITE_URL`             | `TWILIO_*`                                 |                          |
| Public IDs only: `VITE_GTM_CONTAINER_ID`, `VITE_META_PIXEL_ID` (if you choose to expose) | `META_ACCESS_TOKEN`, `META_TEST_EVENT_CODE`, `PHONECALLBOT_*`, `NEXTDOOR_*`, `EDGE_SHARED_SECRET`, `AUTH_HOOK_SECRET`, `LEAD_VERIFICATION_SECRET` | |

---

## 4. Supabase Dashboard Mirror Checklist

These values do **not** travel with the source files — they must be recreated in the **new** Supabase project. Tick each as you go:

**API**
- [ ] Project URL → copy into `VITE_SUPABASE_URL` and `SUPABASE_URL`
- [ ] `anon` / publishable key → `VITE_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_ANON_KEY`
- [ ] `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (Edge Function Secret only)

**Auth**
- [ ] Providers enabled (Email magic-link, Phone via Twilio — per project memory, no Google/social)
- [ ] Email templates (signup, recovery, magic-link, invite) — match notify.itswindowman.com branding
- [ ] Redirect URLs (`http://localhost:8080`, staging, prod custom domain)
- [ ] Site URL
- [ ] Auth email hook → points at deployed `auth-email-hook` function
- [ ] Phone provider → Twilio Verify Service SID

**Storage**
- [ ] Buckets created (quote uploads, document uploads) with public/private flags matching source
- [ ] Bucket policies / RLS recreated
- [ ] CORS allowed origins include the new site URL

**Database**
- [ ] Run all `supabase/migrations/*.sql` (88 files) via `supabase db push` against the **target** project ref only
- [ ] RLS enabled on every public table — re-verify after restore
- [ ] `user_roles`, `has_role`, `score_to_level`, `get_event_score`, `get_lead_quality` functions present
- [ ] Triggers active: `handle_new_user`, `handle_email_confirmed`, `handle_phone_confirmed`, `handle_new_lead_to_crm`, `handle_new_event_scoring`, indexer triggers
- [ ] Realtime publication includes the tables `useCRMLeads` subscribes to (e.g. `leads`, `pending_calls`)
- [ ] `pg_trgm` extension enabled (used by `global_search_index`)
- [ ] Scheduled jobs (`pg_cron`) recreated: `cleanup_test_data`, `cleanup_webhook_receipts`, `cleanup_rate_limits`, score backfill jobs

**Edge Functions**
- [ ] All 62 functions deployed (`supabase functions deploy --no-verify-jwt` is NOT a blanket switch — `verify_jwt` is per-function in `supabase/config.toml`)
- [ ] Every secret in `.env.example` bottom block set via `supabase secrets set`
- [ ] `verify_jwt = false` functions reviewed: `admin-trigger-analysis`, `analyze-consultation-quote`, `auth-email-hook`, `initiate-lead-verification`, `log-event`, `orchestrate-quote-analysis`, `send-otp`, `verify-lead-exists`, `verify-lead-otp`, `verify-otp`, `wm-analyze-quote`
- [ ] CORS responses include `OPTIONS` preflight from every function

**Webhooks / external callbacks**
- [ ] PhoneCall.bot outcome webhook → `phone-call-outcome` URL updated
- [ ] Twilio status callback URL (if used)
- [ ] Meta CAPI test_event_code rotated/cleared before production traffic
- [ ] Resend webhook (bounce/complaint) if configured

**Observability**
- [ ] Log retention / drains
- [ ] Dead-letter notifier subscription (`notify-dead-letter`) target email valid

---

## 5. Bundling Script

See **`scripts/bundle-migration.mjs`**. Pure Node — no external dependencies. Produces `migration-output/windowman-migration-<timestamp>.tar.gz` excluding `node_modules/`, `dist/`, `.git/`, `.env*` (keeps `.env.example`), logs, caches, and the output dir itself. Run:

```bash
node scripts/bundle-migration.mjs
```

> Optional Bash alternative (only useful when `tar` is already installed and you trust your `.gitignore`):
>
> ```bash
> tar --exclude-from=.gitignore --exclude='.env' --exclude='.env.local' \
>     --exclude='.git' --exclude='node_modules' --exclude='migration-output' \
>     -czf migration-output/windowman-$(date +%Y%m%dT%H%M%S).tar.gz .
> ```
>
> The Node version is preferred — it is deterministic, cross-platform, and ignores the host's `.gitignore` quirks.

---

## 6. Env Validation Script

See **`scripts/validate-env.mjs`**. Run after creating `.env.local`:

```bash
node scripts/validate-env.mjs
```

It:

1. Loads `.env.local` if present.
2. Fails on missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Warns on missing optional `VITE_*` and reports which Edge Function secrets are present locally vs. expected to live in Supabase only.
4. Walks `src/**/*.{ts,tsx,js,jsx}` and **fails the build** if any browser file references `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_AUTH_TOKEN`, `META_ACCESS_TOKEN`, `RESEND_API_KEY`, or other server-only secrets.

Exit code: `0` pass, `1` fail.

---

## 7. Edge Function Smoke Test Script

See **`scripts/smoke-test-edge-functions.mjs`**. Default is **dry-run** — prints URL, curl, payload, and expected response for every check, with **zero network calls**. Add `--live` to actually call the deployed functions using `SUPABASE_ANON_KEY`. Synthetic payloads only — Twilio's magic test number `+15005550006`, `smoke+test@example.invalid`, zeroed UUIDs.

```bash
# Inspect everything as curl commands, no network:
node scripts/smoke-test-edge-functions.mjs

# Hit deployed functions (still synthetic payloads):
node scripts/smoke-test-edge-functions.mjs --live

# Focused subset:
node scripts/smoke-test-edge-functions.mjs --live --only=send-otp,track
```

Meta CAPI smoke uses `TEST_EVENT_CODE` (or `META_TEST_EVENT_CODE`) so events show up in **Meta Events Manager → Test Events**, never production.

A "healthy" response is either the documented 2xx body or a 4xx that proves the function received your synthetic input and rejected it for the right reason (`invalid_code`, `missing_lead`, etc.). A 5xx or network error fails the check.

---

## 8. Source-to-Target Migration Checklist

### A. Source repo audit (before bundling)
- [ ] Confirm branch is the one you want to migrate
- [ ] Confirm lockfile (`pnpm-lock.yaml` preferred; `bun.lockb`/`package-lock.json` fallback)
- [ ] Confirm source Supabase project ref is `kffoximblqwcnznwvugu`
- [ ] Confirm edge-function list matches `supabase/functions/` (62 functions)
- [ ] Confirm migration files count (`ls supabase/migrations | wc -l` → expect 88)
- [ ] Confirm `public/` assets are present (no missing referenced images)
- [ ] Grep for env references: `rg "import\.meta\.env|Deno\.env\.get" src supabase`

### B. Target repo setup

```bash
git clone <target-repo-url>
cd <target-repo>
pnpm install         # or: npm install   /   bun install   /   yarn
pnpm dev             # http://localhost:8080
pnpm build
pnpm lint
```

Package-manager fallback rules:

- If `pnpm-lock.yaml` exists → use pnpm.
- Else if `bun.lockb`/`bun.lock` exists → use bun.
- Else if `package-lock.json` exists → use npm.
- Else if `yarn.lock` exists → use yarn.
- **Do not** delete lockfiles to "convert" managers — that drifts dependency versions silently. Switching managers requires manual approval and a re-test of the full app.

### C. Copying source files (recommended order)

1. Root config (`package.json`, lockfile, `tsconfig*`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`, `components.json`, `index.html`, `playwright.config.ts`, `vitest.config.ts`)
2. `src/` (entire tree)
3. `public/` (entire tree)
4. `supabase/config.toml` (edit `project_id` to target) + `supabase/functions/` + `supabase/migrations/`
5. `scripts/` (including the three new ones from this kit)
6. `docs/`, top-level audit `.md` files, `.lovable/`, `.memory/`

### D. Supabase migration

**Option 1 — Supabase CLI (preferred)**

```bash
supabase login
supabase link --project-ref <TARGET_PROJECT_REF>
supabase status                # confirm linked target before any push
supabase db push               # applies supabase/migrations/*.sql to TARGET
supabase functions deploy      # deploys ALL functions
# or per function:
supabase functions deploy send-otp verify-otp orchestrate-quote-analysis
```

**Option 2 — SQL dump / restore**

```bash
# From source (admin access required):
pg_dump --schema=public --no-owner --no-privileges \
        "$SOURCE_SUPABASE_DB_URL" > source_public.sql

# Review the dump for anything you don't want to migrate, then:
psql "$TARGET_SUPABASE_DB_URL" -f source_public.sql

# Re-enable RLS and re-grant explicitly — pg_dump can omit Supabase-managed grants.
```

**Safety rules — read before pushing**

- [ ] `supabase status` confirms linked project ref **matches target**
- [ ] Take a snapshot of the target before any destructive operation
- [ ] Never run `supabase db push` against the source project
- [ ] Re-review every `verify_jwt = false` function for required signature/rate-limit checks
- [ ] Re-verify RLS on every table (`SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace`)

### E. Supabase dashboard manual mirror

Run through **§4 Dashboard Mirror Checklist** in the target dashboard. Items that cannot be transferred by file copy: provider config, redirect URLs, email templates, storage policies, webhooks, scheduled jobs, function secrets, custom domain bindings.

### F. Environment injection

Frontend:
```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL / VITE_SUPABASE_PROJECT_ID / VITE_SUPABASE_PUBLISHABLE_KEY
node scripts/validate-env.mjs
```

Edge Function secrets:
```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set TWILIO_ACCOUNT_SID=...  TWILIO_AUTH_TOKEN=...  TWILIO_VERIFY_SERVICE_SID=...
supabase secrets set META_PIXEL_ID=...  META_ACCESS_TOKEN=...  META_TEST_EVENT_CODE=...
supabase secrets set PHONECALLBOT_API_KEY=...  PHONECALLBOT_WEBHOOK_SECRET=...
supabase secrets set LOVABLE_API_KEY=...
supabase secrets set EDGE_SHARED_SECRET=...  AUTH_HOOK_SECRET=...  LEAD_VERIFICATION_SECRET=...
supabase secrets list
```

Hosting provider env vars (Vercel / Netlify / Cloudflare Pages / Lovable):
- Only the `VITE_*` block is needed on the build host.
- Server-only secrets stay in Supabase Edge Function secrets — they should NEVER appear in the hosting platform's env panel.

### G. Verification protocol

```bash
pnpm install
pnpm dev                                       # boot + smoke-check homepage
pnpm build                                     # must exit 0
pnpm lint                                      # must exit 0
node scripts/validate-env.mjs                  # must exit 0
node scripts/smoke-test-edge-functions.mjs     # dry-run; review every curl
node scripts/smoke-test-edge-functions.mjs --live   # ONLY against target project
```

Browser checks (manual):
- [ ] Homepage `/` renders without console errors
- [ ] `/audit` → scanner flow loads, modal opens
- [ ] `/beat-your-quote` → dual-path flow visible
- [ ] `/vault` → public route reachable, signup magic-link triggers
- [ ] `/cost-calculator` → form submits, no env error
- [ ] `/admin/*` → blocked for unauthenticated user, allowed for admin
- [ ] No `Missing Supabase environment variable` exception
- [ ] No CORS errors in DevTools Network tab

Backend checks (manual):
- [ ] `supabase functions logs <fn>` shows your smoke-test invocations
- [ ] DB inserts visible: `wm_event_log`, `leads`, `pending_calls` (synthetic only)
- [ ] Twilio Console → Verify → Logs shows the synthetic OTP attempt
- [ ] Resend dashboard shows the smoke email
- [ ] Meta Events Manager → Test Events shows the smoke event under your test_event_code
- [ ] PhoneCall.bot dashboard shows the dry-run call request (or rejects it cleanly)

### H. Rollback plan

| Layer            | Rollback action                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Git              | `git revert <merge-sha>` on target; keep source repo untouched as the canonical fallback         |
| Edge functions   | `supabase functions deploy <fn>` from the previous git SHA, or `supabase functions delete <fn>`  |
| Database         | Restore from the snapshot taken before `db push`; never rely on `supabase db reset` in prod      |
| Env / secrets    | `supabase secrets unset KEY` for any leaked or rotated secret; rotate the secret at the provider |
| DNS / hosting    | Repoint custom domain back at the source deployment (keep source deployment alive for ≥14 days) |

---

## 9. Verification Protocol (one-page)

```bash
# Setup
pnpm install
cp .env.example .env.local && $EDITOR .env.local

# Static
node scripts/validate-env.mjs
pnpm lint
pnpm build

# Runtime (dev)
pnpm dev

# Backend wiring (dry-run first, always)
node scripts/smoke-test-edge-functions.mjs
node scripts/smoke-test-edge-functions.mjs --live   # only after manual review
```

Each command must exit `0`. The smoke-test output should show every function returning the documented 2xx or expected 4xx — not 5xx, not "network error".

---

## 10. Rollback Plan

Pre-conditions to satisfy **before** flipping traffic to the new project:

1. Source project is **read-only frozen** (no migrations, no edge deploys) for at least 14 days post-cutover.
2. DNS TTL on the production hostname is reduced to ≤300s 24h before cutover.
3. A full database snapshot of the target was taken immediately after the last `supabase db push`.
4. A copy of every Edge Function Secret value lives in 1Password / Vault (off-repo) so a re-deploy can be triggered without scraping the source dashboard.

Recovery steps if the cutover fails:

1. **DNS** — repoint to the source deployment.
2. **Git** — `git revert` the migration merge on the target.
3. **Supabase data** — restore the pre-cutover snapshot.
4. **Edge functions** — `supabase functions deploy` the previous git SHA on the target, or delete and redeploy from the source repo.
5. **Secrets** — rotate any value that may have been exposed during the move.

---

## 11. Cursor Execution Prompt

Paste the following into a fresh Cursor chat in the **target** repository after copying files. Cursor must not run any destructive Supabase command without explicit confirmation.

````
You are taking over a freshly-migrated WindowMan Truth Engine repo. Treat the migration as untrusted until verified. Do NOT run any destructive Supabase command (db push, db reset, functions delete, SQL restore, production deploy) without my explicit "go" each time.

Tasks, in order, stopping on the first failure:

1. INSPECT
   - Confirm presence of: package.json, vite.config.ts, tailwind.config.ts, tsconfig*.json, index.html, src/, public/, supabase/config.toml, supabase/functions/, supabase/migrations/, scripts/{bundle-migration.mjs,validate-env.mjs,smoke-test-edge-functions.mjs}, .env.example, MIGRATION_BLUEPRINT.md, migration-manifest.json.
   - Report which files in migration-manifest.json are missing on disk.

2. INSTALL & BUILD
   - Detect package manager from lockfile (pnpm > bun > npm > yarn).
   - Run install, then `pnpm build` (or equivalent) and `pnpm lint`.
   - Report exit codes. Do not "fix" lint errors automatically.

3. ENV WIRING
   - Run `node scripts/validate-env.mjs`.
   - Confirm src/integrations/supabase/client.ts reads only VITE_SUPABASE_URL, VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_PUBLISHABLE_KEY — no other names.
   - Grep src/ for SUPABASE_SERVICE_ROLE_KEY, TWILIO_AUTH_TOKEN, META_ACCESS_TOKEN, RESEND_API_KEY, PHONECALLBOT_API_KEY. Any hit = halt and report.

4. FUNCTION SURFACE PARITY
   - Parse supabase/config.toml. List every [functions.<name>] override.
   - List every directory under supabase/functions/.
   - Report (a) directories with no config block, (b) config blocks pointing to missing directories, (c) every function with verify_jwt = false — these are public-callable; flag for human review.

5. CLIENT/EDGE NAME PARITY
   - For every `supabase.functions.invoke('<name>')` call in src/, confirm `supabase/functions/<name>/index.ts` exists.

6. DRY-RUN SMOKE
   - Run `node scripts/smoke-test-edge-functions.mjs` (no --live).
   - Print the curl block for each function so I can copy-paste against staging.

7. STATUS REPORT
   Output a single Markdown table with columns: Step | Result | Evidence | Next action.

HALT conditions:
   - Step 1 reports any missing file required=true in migration-manifest.json.
   - Step 2 build or lint exits non-zero.
   - Step 3 env validator exits non-zero, OR src/ references a server-only secret.
   - Step 4 finds a function in code but missing on disk, or vice versa.
   - Step 5 finds an `invoke('X')` with no matching function dir.

If any HALT triggers, stop, summarize what failed, and ask me how to proceed.

NEVER run: supabase db push, supabase db reset, supabase functions delete, psql restore, `pnpm deploy`, or any hosting-provider deploy command. If I ask you to, repeat the command back to me and require me to type "CONFIRM" before executing.
````

---

**End of blueprint.** Generated 2026-06-21 against Lovable project `faf9d037-b00e-4588-a259-0baf63925ffd`.
