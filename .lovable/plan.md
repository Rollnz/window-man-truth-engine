
Goal: get your repo link working again now, and stop it from dropping after restart.

What I found (critical):
1) You confirmed this was connected as an existing repo import.
2) In that setup, “disconnect after restart/session” is a known weak point.
3) I can’t force-reconnect GitHub from my side in this workspace right now (no reconnectable connector is exposed to me), so the reconnect click path must be done from your UI.
4) The durable fix is to make Lovable the source of truth for the connected repo (project-created connection), then optionally mirror to your legacy repo.

Immediate recovery (bring it back up now):
1) Reset GitHub link fully
   - Desktop: Project name (top-left) → Settings → Connectors → GitHub → Disconnect.
   - Mobile: Project name (top in Chat mode) → Settings → Connectors → GitHub → Disconnect.
2) Re-authorize the GitHub app
   - Reconnect in the same GitHub settings panel.
   - Ensure repo access includes `Rollnz/window-man-truth-engine` (or “All repositories”).
3) Reconnect project to repository
   - Use “Connect project” and select the repo + correct default branch.
4) Hard session reset
   - Sign out/in of Lovable, hard refresh browser.
5) Verify end-to-end immediately
   - Make one tiny edit in Lovable, confirm commit appears in GitHub.
   - Push one tiny commit in GitHub, confirm it appears in Lovable.

Make it permanent (recommended architecture):
Option A (recommended): Lovable-managed repo as primary
1) Connect project so Lovable creates/manages the canonical repo linkage.
2) Keep that repo path/name stable (do not rename/move/delete org/repo).
3) If you must keep `Rollnz/window-man-truth-engine` as your public/main repo, add a mirror workflow:
   - Canonical (Lovable-linked repo) → mirror push to legacy repo via GitHub Action or scheduled sync.
4) Result: Lovable connection stays stable, while your existing repo still receives updates.

Option B (not recommended): keep existing direct import
- You can continue reconnecting manually, but persistence after restart may continue to be unreliable.

Why this impacts permanence:
- Your current flow depends on a link type that isn’t as durable for ongoing session persistence.
- Switching to a Lovable-owned canonical connection removes that fragile link layer and stabilizes bidirectional sync.

After this is stable, next execution sequence for your tracking work:
1) Switch DB/admin tooling to dual-read legacy + `wm_*`.
2) Switch writers to canonical `wm_*`.
3) Remove legacy bridge and clean tests.
(So GitHub instability won’t interrupt the migration again.)

Acceptance checklist (done = permanent enough to proceed):
- Reopen project after browser restart: still connected.
- Reopen after full PC restart: still connected.
- Lovable → GitHub sync works.
- GitHub → Lovable sync works.
- Default branch stays correct after restart.

If you want, once you confirm the reconnect is back up right now, I’ll give you a very short “one-shot” checklist to perform the permanent Option A migration in one pass.
