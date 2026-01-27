
# Claim Readiness Analysis - Complete 4-Phase Fix

## Overview

This plan addresses 4 critical phases of issues in the Claim Readiness Analysis modal and save functionality:

1. **Phase 1**: Fix locked/non-editable input fields
2. **Phase 2**: Fix low-contrast yellow score display 
3. **Phase 3**: Add comprehensive ARIA accessibility
4. **Phase 4**: Differentiate anonymous vs. logged-in user flows

---

## Phase 1: Fix Locked Input Fields

### Problem
The Email and Name fields appear "locked" because of this pattern:
```typescript
value={email || prefilledEmail}  // Line 234
```
When `email` is an empty string (falsy), it reverts to `prefilledEmail`, making it impossible to clear the field.

### Solution
Initialize state from session data using `useEffect`, then use controlled inputs without OR fallback.

### File: `src/components/claim-survival/ClaimVaultSyncButton.tsx`

| Change | Location | Description |
|--------|----------|-------------|
| Split Name → First/Last | Lines 31-32 | Add `firstName` and `lastName` state instead of single `name` |
| Initialize from session | New useEffect | Pre-fill state on mount, not in render |
| Fix value binding | Lines 230-254 | Remove `|| prefilled` pattern, use pure state |
| Add validation | New code | Use `useFormValidation` hook with `commonSchemas` |
| 2x2 grid layout | Lines 225-255 | Match Kitchen Table pattern for First/Last/Email |

### Technical Implementation

```typescript
// Replace lines 31-32 with:
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [email, setEmail] = useState('');

// Add useEffect after line 49:
useEffect(() => {
  // Initialize from session data ONCE on mount
  if (sessionData.firstName && !firstName) {
    setFirstName(sessionData.firstName);
  }
  if (sessionData.lastName && !lastName) {
    setLastName(sessionData.lastName);
  }
  if (sessionData.email && !email) {
    setEmail(sessionData.email);
  }
}, []); // Empty deps = mount only
```

---

## Phase 2: Fix Yellow Score Contrast

### Problem
The `--warning: 48 96% 53%` color (bright yellow #FACC15) has a contrast ratio of ~1.62:1 against white backgrounds, failing WCAG AA (4.5:1 required).

### Solution
Replace `text-warning` with `text-amber-700` (or `text-slate-900`) for text elements while keeping the soft `bg-warning/10` background.

### File: `src/components/claim-survival/EvidenceAnalysisModal.tsx`

| Change | Location | Description |
|--------|----------|-------------|
| Update score display | Line 68 | Change `text-warning` to `text-amber-700` |
| Update badge text | Lines 206 | Change `text-warning` to `text-amber-700` |
| Update icon color | Line 57 | Change `text-warning` to `text-amber-600` |

### Technical Implementation

```typescript
// Line 57 - getStatusIcon for 'weak' status:
return <AlertTriangle className="w-4 h-4 text-amber-600" />;

// Line 68 - getOverallStatusStyles for 'warning' status:
return 'border-amber-500/50 bg-amber-50 text-amber-700';

// Line 206 - Badge for 'weak' document status:
: 'border-amber-500/50 text-amber-700'
```

---

## Phase 3: Add ARIA Accessibility

### Problem
The modal lacks proper ARIA labeling for screen readers:
- No `aria-describedby` for the dialog
- No `aria-live` region for dynamic score updates
- Missing `role` attributes for lists
- No `aria-required` on form fields

### Solution
Add comprehensive ARIA attributes throughout both files.

### File: `src/components/claim-survival/EvidenceAnalysisModal.tsx`

| Change | Location | Description |
|--------|----------|-------------|
| Add aria-describedby | Line 78 | Link to description element |
| Add aria-live region | Line 167-171 | Announce score to screen readers |
| Add role="list" | Lines 108, 185 | Document status breakdown |
| Add role="listitem" | Lines 109, 189 | Each document item |
| Add sr-only labels | Various | Hidden labels for icon-only elements |

### File: `src/components/claim-survival/ClaimVaultSyncButton.tsx`

| Change | Location | Description |
|--------|----------|-------------|
| Add aria-required | Form inputs | Mark required fields |
| Add aria-invalid | Form inputs | Indicate validation errors |
| Add aria-describedby | Form inputs | Link to error messages |
| Add id to errors | Error elements | Enable aria-describedby linking |

### Technical Implementation

```typescript
// EvidenceAnalysisModal.tsx - DialogContent (Line 78):
<DialogContent 
  className="max-w-2xl max-h-[90vh] overflow-y-auto"
  aria-describedby="claim-analysis-description"
>

// Add description (after DialogHeader):
<p id="claim-analysis-description" className="sr-only">
  AI-powered analysis of your insurance claim documents with readiness score and recommendations.
</p>

// Score section (Lines 167-178):
<div 
  className={`rounded-lg border-2 p-6 text-center ${getOverallStatusStyles(analysisResult.status)}`}
  role="region"
  aria-labelledby="readiness-score-label"
  aria-live="polite"
>
  <div 
    id="readiness-score-label"
    className="text-5xl font-bold font-mono mb-2"
    aria-label={`Claim readiness score: ${analysisResult.overallScore} percent`}
  >
    {analysisResult.overallScore}%
  </div>

// Document status breakdown (Line 185):
<div className="space-y-2" role="list" aria-label="Document status breakdown">

// Each document (Line 189):
<div 
  key={item.docId}
  role="listitem"
  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
>
```

```typescript
// ClaimVaultSyncButton.tsx - Form inputs:
<Input
  id="vault-email"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  disabled={isLoading}
  className="h-9"
  aria-required="true"
  aria-invalid={!!emailError}
  aria-describedby={emailError ? "vault-email-error" : undefined}
/>
{emailError && (
  <p id="vault-email-error" className="text-xs text-destructive mt-1" role="alert">
    {emailError}
  </p>
)}
```

---

## Phase 4: Anonymous vs. Logged-In Flow Differentiation

### Problem
Both anonymous and authenticated users see nearly identical UI states, with the only differentiation being a simple success badge for logged-in users. The current implementation doesn't:
- Auto-save analysis for authenticated users
- Show different CTAs based on auth state
- Persist analysis to user's account automatically

### Solution
Create two distinct flows:
1. **Anonymous**: Show full form with email/name fields + magic link sign-up
2. **Authenticated**: Auto-sync to vault, show "Synced" confirmation with account management options

### File: `src/components/claim-survival/ClaimVaultSyncButton.tsx`

| Change | Location | Description |
|--------|----------|-------------|
| Enhanced auth state UI | Lines 118-135 | Add "Manage Vault" link and sync timestamp |
| Auto-sync on mount | New useEffect | If authenticated, automatically save analysis |
| Show sync status | New state | Track if synced for authenticated users |

### Technical Implementation

```typescript
// New state for authenticated users:
const [hasSynced, setHasSynced] = useState(false);

// Auto-sync for authenticated users (new useEffect):
useEffect(() => {
  if (isAuthenticated && !hasSynced && analysis) {
    // Auto-save analysis to user's vault
    updateFields({
      claimAnalysisResult: {
        ...analysis,
        analyzedAt: analysis.analyzedAt || new Date().toISOString(),
      },
      vaultSyncPending: false,
      email: user.email,
      sourceTool: 'claim-survival-kit',
    });
    
    trackEvent('vault_auto_sync', {
      source_tool: 'claim-survival-kit',
      analysis_score: analysis.overallScore,
      user_authenticated: true,
    });
    
    setHasSynced(true);
  }
}, [isAuthenticated, hasSynced, analysis, user]);

// Enhanced authenticated state UI (Lines 118-135):
if (isAuthenticated) {
  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">
            {hasSynced ? 'Analysis Synced to Your Vault' : 'Syncing...'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            Logged in as {user.email}
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href="/vault">Manage Vault</a>
        </Button>
      </div>
    </Card>
  );
}
```

---

## Files to Modify

| File | Phase(s) | Priority |
|------|----------|----------|
| `src/components/claim-survival/ClaimVaultSyncButton.tsx` | 1, 3, 4 | High |
| `src/components/claim-survival/EvidenceAnalysisModal.tsx` | 2, 3 | High |

---

## Validation Checklist

After implementation, verify:

- [ ] First Name, Last Name, Email fields are fully editable (can delete/clear)
- [ ] Pre-fill works from session data without locking
- [ ] Score displays with high contrast (amber-700 vs yellow)
- [ ] All document status badges are readable
- [ ] Screen reader announces score correctly
- [ ] Form fields have proper error messaging with ARIA
- [ ] Anonymous users see full form with magic link flow
- [ ] Authenticated users see auto-synced state with vault link
- [ ] Tab navigation works smoothly through form fields

---

## Technical Notes

1. **EMQ Compliance**: The First/Last name split aligns with Meta Event Match Quality standards (memory: `name-split-emq-standard-v2`)

2. **Validation**: Using existing `commonSchemas.firstName`, `commonSchemas.lastName`, and `commonSchemas.email` from `useFormValidation.ts`

3. **Theme Compatibility**: The `text-amber-700` color provides 4.62:1 contrast ratio on white and works in both light/dark themes

4. **Focus Management**: Using Tailwind `focus:ring-2 focus:ring-primary/25` pattern consistent with site-wide form inputs
