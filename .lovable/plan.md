
# Fix Plan: Sample Report Page Bugs

## Summary
The `/sample-report` page is crashing due to missing imports, with several additional code quality and accessibility issues that need attention.

---

## Critical Fix (Page Crash)

### FAQSection.tsx — Add Missing Imports

**Problem:** `Link` and `ROUTES` are referenced but never imported, causing immediate runtime crash.

**Solution:** Add the required imports at the top of the file.

```tsx
// Add to imports at top of file
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/navigation';
```

---

## High Priority Fixes

### 1. ScoreboardSection.tsx — RAF Cleanup

**Problem:** `requestAnimationFrame` runs without cleanup, causing state updates on unmounted components.

**Solution:** Store RAF ID and cancel on cleanup.

```tsx
function AnimatedScore({ targetScore, isVisible }: { targetScore: number; isVisible: boolean }) {
  const [score, setScore] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const duration = 1500;
    const startTime = Date.now();
    let rafId = 0;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScore(Math.round(targetScore * eased));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);  // Cleanup
  }, [targetScore, isVisible]);
  return <span>{score}</span>;
}
```

### 2. ComparisonSection.tsx — Deterministic Widths

**Problem:** `Math.random()` in JSX causes different widths on every render.

**Solution:** Use deterministic pre-computed widths.

```tsx
// Replace the Math.random() call with fixed values
{[45, 62, 55, 48, 70, 52].map((width, i) => (
  <div key={i} className="flex justify-between items-center">
    <div className="h-3 bg-muted/40 rounded" style={{ width: `${width}%` }} />
    <div className="h-3 w-16 bg-muted/40 rounded" />
  </div>
))}
```

### 3. SampleReportAccessGate.tsx — Prevent Duplicate Tracking

**Problem:** `effectiveLeadId` in dependency array causes tracking to fire twice.

**Solution:** Use a ref to ensure tracking fires only once per modal open.

```tsx
const hasFiredRef = useRef(false);

useEffect(() => {
  if (isOpen && !hasFiredRef.current) {
    hasFiredRef.current = true;
    trackModalOpen({ modalName: 'sample_report_gate', sourceTool: 'sample-report' });
    trackEvent('sample_report_gate_opened', { ... });
  }
  if (!isOpen) {
    hasFiredRef.current = false; // Reset when modal closes
  }
}, [isOpen]);
```

### 4. SampleReportAccessGate.tsx — Fire-and-Forget Tracking

**Problem:** Tracking errors bubble up and show "Unable to unlock" even when lead was saved.

**Solution:** Wrap tracking in fire-and-forget pattern.

```tsx
// After setLeadAnchor(data.leadId):
Promise.allSettled([
  awardScore({ eventType: 'LEAD_CAPTURED', sourceEntityType: 'lead', sourceEntityId: data.leadId }),
  trackLeadCapture({ leadId: data.leadId, sourceTool: 'sample_report', conversionAction: 'gate_unlock' }, values.email.trim(), phone.trim() || undefined, { hasName: true, hasPhone: !!phone.trim(), hasProjectDetails: false }),
  trackLeadSubmissionSuccess({ leadId: data.leadId, email: values.email.trim(), phone: phone.trim() || undefined, firstName: normalizedNames.firstName, lastName: normalizedNames.lastName, sourceTool: 'sample-report', eventId: `sample_report_gate:${data.leadId}`, value: 50 })
]).catch(err => console.warn('[tracking] Non-fatal error:', err));
```

---

## Medium Priority Fixes

### 5. SampleReportSection.tsx — Fix Tailwind Class

**Problem:** Malformed HSL alpha syntax in hover class.

**Solution:** Move alpha inside the `hsl()` function.

```diff
- hover:border-[hsl(var(--secondary))/0.3]
+ hover:border-[hsl(var(--secondary)/0.3)]
```

### 6. FAQSection.tsx — Add ARIA Attributes

**Problem:** FAQ accordion not accessible to screen readers.

**Solution:** Add `aria-expanded`, `aria-controls`, and `aria-hidden`.

```tsx
function FAQItem({ faq, isOpen, onToggle, index }: { faq: FAQ; isOpen: boolean; onToggle: () => void; index: number }) {
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;
  return (
    <div className="border-b border-border/50 last:border-0">
      <button 
        id={buttonId}
        onClick={onToggle} 
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between py-5 text-left..."
      >
        ...
      </button>
      <div 
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!isOpen}
        className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}
      >
        ...
      </div>
    </div>
  );
}
```

### 7. SampleReportAccessGate.tsx — Sync Email from SessionData

**Problem:** Email field doesn't update when `sessionData.email` arrives after mount.

**Solution:** Add useEffect to sync email like other fields.

```tsx
const { values, hasError, getError, getFieldProps, validateAll, setValues } = useFormValidation({ ... });

useEffect(() => { 
  if (sessionData.firstName) setFirstName(sessionData.firstName); 
  if (sessionData.lastName) setLastName(sessionData.lastName); 
  if (sessionData.phone) setPhone(sessionData.phone);
  if (sessionData.email) setValues(prev => ({ ...prev, email: sessionData.email })); // Add this
}, [sessionData, setValues]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/sample-report/FAQSection.tsx` | Add imports, ARIA attributes |
| `src/components/sample-report/ScoreboardSection.tsx` | RAF cleanup |
| `src/components/sample-report/ComparisonSection.tsx` | Deterministic widths |
| `src/components/sample-report/SampleReportAccessGate.tsx` | Fix tracking (duplicate + fire-and-forget), sync email |
| `src/components/home/SampleReportSection.tsx` | Fix Tailwind class |

---

## Verification Steps

After implementation:
1. Navigate to `/sample-report` — page should load without crash
2. Scroll to scoreboard — animation should run smoothly
3. Open lead capture modal, submit — should succeed even if tracking fails
4. Check console — no RAF/unmount warnings
5. Test FAQ with screen reader — should announce expanded/collapsed state
