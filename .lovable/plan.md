

# Fix: Outcome Folders Default State and Text Wrapping

## File: `src/components/beat-your-quote/OutcomeFolders.tsx`

### Change 1: Default "WE BEAT IT" to open on load

**Line 36** -- Change initial state from `null` to `'alpha'`:

```typescript
// Before
const [activeOutcome, setActiveOutcome] = useState<'alpha' | 'bravo' | null>(null);

// After
const [activeOutcome, setActiveOutcome] = useState<'alpha' | 'bravo' | null>('alpha');
```

### Change 2: Prevent heading text from wrapping vertically on mobile

**Line 290** -- Add `whitespace-nowrap` to "WE BEAT IT" heading:

```html
<!-- Before -->
<h4 className="font-bold text-green-400 uppercase tracking-wide font-mono text-2xl">

<!-- After -->
<h4 className="font-bold text-green-400 uppercase tracking-wide font-mono text-2xl whitespace-nowrap">
```

**Line 344** -- Add `whitespace-nowrap` to "OR VALIDATE IT" heading:

```html
<!-- Before -->
<h4 className="font-bold text-tools-truth-engine uppercase tracking-wide font-mono text-xl">

<!-- After -->
<h4 className="font-bold text-tools-truth-engine uppercase tracking-wide font-mono text-xl whitespace-nowrap">
```

### Summary

| Line | What | Fix |
|------|------|-----|
| 36 | Initial state | `null` to `'alpha'` (green card open by default) |
| 290 | "WE BEAT IT" heading | Add `whitespace-nowrap` |
| 344 | "OR VALIDATE IT" heading | Add `whitespace-nowrap` |

Three single-line changes. No side effects. "OR VALIDATE IT" remains closed until tapped. Text stays horizontal on all viewports.

