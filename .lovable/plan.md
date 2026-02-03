
# Accessibility & Focus Management Site-Wide Update

## Summary
Implement a comprehensive accessibility update addressing focus trapping, missing labels, keyboard navigation, skip-to-content links, and ARIA attributes across all modals and forms.

---

## Issues Found During Audit

| Issue | Location | Priority |
|-------|----------|----------|
| **Missing Skip-to-Content link** | Site-wide (no implementation exists) | 🔴 High |
| **Textarea missing label** | `src/components/expert/ChatInput.tsx` line 33 | 🟡 Medium |
| **Notes textarea missing label** | `src/components/lead-detail/NotesWidget.tsx` line 51 | 🟡 Medium |
| **Quote Q&A input missing label** | `src/components/quote-scanner/QuoteQA.tsx` line 33 | 🟡 Medium |
| **No autoFocus on some modals** | Various lead capture modals | 🟡 Medium |
| **Focus restoration not explicit** | Radix handles this, but needs verification | 🟢 Low |

---

## Changes

### 1. Add Skip-to-Content Link (Site-Wide)

**File: `index.html`**

Add skip link as first focusable element in body:

```html
<body>
  <a href="#main-content" class="skip-to-content">Skip to main content</a>
  <div id="root"></div>
  ...
</body>
```

**File: `src/index.css`** (or create new accessibility CSS)

Add skip link styling (visible only on focus):

```css
.skip-to-content {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 9999;
}

.skip-to-content:focus {
  position: fixed;
  top: 0;
  left: 0;
  width: auto;
  height: auto;
  padding: 1rem 1.5rem;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-weight: 600;
  text-decoration: none;
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

**File: `src/App.tsx`**

Add `id="main-content"` to main content wrapper:

```tsx
<main id="main-content" tabIndex={-1}>
  {/* Routes */}
</main>
```

---

### 2. Fix Missing Textarea Label on /expert Page

**File: `src/components/expert/ChatInput.tsx`**

Add visually hidden label and aria-label for the textarea:

```tsx
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

// In the component:
<div className="flex gap-2 p-4 border-t border-border bg-background/80 backdrop-blur">
  <VisuallyHidden>
    <label htmlFor="expert-chat-input">Ask a question about impact windows</label>
  </VisuallyHidden>
  <Textarea 
    id="expert-chat-input"
    value={input} 
    onChange={e => setInput(e.target.value)} 
    onKeyDown={handleKeyDown} 
    placeholder="Ask about impact windows, energy savings, or your specific situation..." 
    className="min-h-[60px] max-h-[120px] resize-none" 
    disabled={isLoading || disabled}
    aria-label="Ask a question about impact windows, energy savings, or your specific situation"
  />
  ...
</div>
```

---

### 3. Fix Notes Widget Textarea Label

**File: `src/components/lead-detail/NotesWidget.tsx`**

Add proper label association:

```tsx
<div className="space-y-2">
  <label htmlFor="internal-note" className="sr-only">
    Add internal note about this lead
  </label>
  <Textarea
    id="internal-note"
    placeholder="Add a note about this lead..."
    value={content}
    onChange={(e) => setContent(e.target.value)}
    onKeyDown={handleKeyDown}
    rows={3}
    className="resize-none text-sm"
    aria-label="Add internal note about this lead"
  />
  ...
</div>
```

---

### 4. Fix Quote Q&A Input Label

**File: `src/components/quote-scanner/QuoteQA.tsx`**

Add proper label:

```tsx
<form onSubmit={handleSubmit} className="flex gap-2">
  <label htmlFor="quote-qa-input" className="sr-only">
    Ask the AI Expert about your quote
  </label>
  <Input
    id="quote-qa-input"
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    placeholder="e.g. Is the permit included?"
    disabled={disabled || isAsking}
    className="flex-1"
    aria-label="Ask the AI Expert about your quote"
  />
  ...
</form>
```

---

### 5. Verify & Enhance Modal Focus Management

**File: `src/components/forms/TrustModal.tsx`**

Radix Dialog already handles focus trapping by default. Add explicit props to ensure focus management:

```tsx
<DialogContent
  hideCloseButton={lockLevel !== 'soft'}
  onInteractOutside={handleInteractOutside}
  onPointerDownOutside={handlePointerDownOutside}
  onEscapeKeyDown={handleEscapeKeyDown}
  // Ensure ARIA attributes for screen readers
  role="dialog"
  aria-modal="true"
  className={cn(
    // ... existing styles
  )}
  {...props}
>
```

**Note:** Radix DialogContent already includes `role="dialog"` and `aria-modal="true"` by default, but we should verify this is not being overridden.

---

### 6. Enhance Focus Restoration on Modal Close

**File: `src/lib/formAccessibility.ts`**

Add a hook for explicit focus restoration (optional enhancement):

```tsx
/**
 * Hook to manage focus restoration when modals close
 * Radix handles this, but this provides explicit control if needed
 */
export function useFocusRestore() {
  const triggerRef = useRef<HTMLElement | null>(null);
  
  const saveTrigger = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement;
  }, []);
  
  const restoreFocus = useCallback(() => {
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);
  
  return { saveTrigger, restoreFocus };
}
```

---

### 7. Audit Form Error ARIA Attributes

**File: `src/components/ui/NameInputPair.tsx`**

Ensure error messages are properly linked:

```tsx
<Input
  id={`${baseId}-firstName`}
  value={firstName}
  onChange={(e) => onFirstNameChange(e.target.value)}
  disabled={disabled}
  autoFocus={autoFocus}
  aria-invalid={!!errors.firstName}
  aria-describedby={errors.firstName ? `${baseId}-firstName-error` : undefined}
  className={cn(
    inputHeight,
    errors.firstName && "border-destructive focus-visible:ring-destructive"
  )}
/>
{errors.firstName && (
  <p id={`${baseId}-firstName-error`} className="text-xs text-destructive" role="alert">
    {errors.firstName}
  </p>
)}
```

---

### 8. Add Screen Reader Utility Classes

**File: `src/index.css`**

Add standard screen reader only class:

```css
/* Screen reader only - visually hidden but accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Becomes visible on focus (for skip links) */
.sr-only-focusable:focus,
.sr-only-focusable:active {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `index.html` | Add skip-to-content link |
| `src/index.css` | Add skip-link and sr-only styles |
| `src/App.tsx` | Add `id="main-content"` to main wrapper |
| `src/components/expert/ChatInput.tsx` | Add label and aria-label to textarea |
| `src/components/lead-detail/NotesWidget.tsx` | Add label and aria-label to textarea |
| `src/components/quote-scanner/QuoteQA.tsx` | Add label and aria-label to input |
| `src/components/ui/NameInputPair.tsx` | Ensure aria-invalid and aria-describedby on all inputs |
| `src/lib/formAccessibility.ts` | Add useFocusRestore hook (optional) |

---

## Technical Notes

### Radix UI Focus Behavior (Already Working)
- **Focus Trapping**: Radix Dialog traps focus by default - Tab/Shift+Tab cycle within modal
- **Initial Focus**: First focusable element receives focus on open
- **Focus Restoration**: Focus returns to trigger element on close
- **aria-modal**: Automatically set to `true` on DialogContent

### What Was Already Correct
- Button component has proper `focus-visible:ring-2 focus-visible:ring-ring` styling
- Input component has `focus-visible:ring-2 focus-visible:ring-primary` styling
- Most lead capture modals already have `autoFocus` on first input
- TrustModal properly wraps DialogContent with accessibility fallbacks
- Most forms already have `aria-invalid` and `aria-describedby` for errors

### Testing Checklist
After implementation:
1. Tab through page - verify skip link appears first
2. Open modal - verify focus moves to first input
3. Tab through modal - verify focus stays trapped
4. Close modal - verify focus returns to trigger button
5. Test with screen reader - verify all form fields announced correctly
6. Verify all interactive elements have visible focus rings

