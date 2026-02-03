
# Update GTM Documentation with Lovable Domain Examples

## Summary
Update the "How It Works" table in `.lovable/plan.md` to include specific Lovable domain patterns for better documentation clarity.

---

## Changes

### File: `.lovable/plan.md`

**Update lines 60-67** - Replace the current "How It Works" table with an expanded version:

```markdown
## How It Works

| Domain                                                            | GTM Loads? | Result           |
| ----------------------------------------------------------------- | ---------- | ---------------- |
| `itswindowman.com`                                                | Yes        | Full tracking    |
| `www.itswindowman.com`                                            | Yes        | Full tracking    |
| `window-truth-engine.lovable.app`                                 | No         | Console log only |
| `preview--window-truth-engine.lovable.app`                        | No         | Console log only |
| `id-preview-*--faf9d037-b00e-4588-a259-0baf63925ffd.lovable.app`  | No         | Console log only |
| `*.lovable.app` (any other)                                       | No         | Console log only |
```

**Key improvements:**
- Added your specific project domains (`window-truth-engine.lovable.app`)
- Added the versioned preview pattern (`id-preview-*--[project-id].lovable.app`)
- Fixed inconsistent quote formatting (now uses backticks consistently)
- Reordered to show specific domains first, then the catch-all pattern

---

## Files Changed

| File | Action |
|------|--------|
| `.lovable/plan.md` | Update "How It Works" table with specific domain examples |
