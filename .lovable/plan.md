## Plan: Save Progressive Access Model to project memory

Record the three-tier access hierarchy as a persistent project rule. No app code changes.

### Files

1. **Create `mem://architecture/progressive-access-model.md`** — feature-type memory capturing:
   - Tier 1: Top-of-funnel — no auth wall on landing/intake tools
   - Tier 2: Vault — Supabase session auth, read-only access to saved reports/history/settings, claimed post-lead
   - Tier 3: Estimate upload & AI scan — mandatory Twilio OTP every time, even for logged-in Vault users
   - Rule: Vault session (read) and OTP verification (write/scan) are independent and never collapsed

2. **Update `mem://index.md`**
   - Add one Core line: `Access tiers: no auth on top-of-funnel; Vault = Supabase session (read); estimate upload/AI scan = Twilio OTP every time, even for Vault users.`
   - Add Memories entry linking to the new file

### Why Core + detail file
The one-liner enforces the rule on every action; the detail file is loaded when work touches Vault auth, upload gating, or OTP flows. Complements existing memories (Phone-First Gated Funnel, Scanner Gate Bypass Protocol, Vault Public Access Policy) without contradicting them.
