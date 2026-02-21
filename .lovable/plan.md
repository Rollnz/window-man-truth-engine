

# Replace FAQ "Call Window Man" Link with Click-to-Call

## What Changes

**File: `src/components/sample-report/FAQSection.tsx`**

1. Import `CallWindowManButton` from `@/components/consultation/CallWindowManButton`.
2. Replace the plain `<button>` element at the bottom of the FAQ section (line 75) with `<CallWindowManButton source="faq_section" variant="outline" size="sm" />` styled inline to match the current link appearance.
3. Since the `onOpenPreQuoteModal` prop is no longer needed by this section's footer, it can remain on the interface (other components may still use it), but the bottom link will no longer call it.

## What Does NOT Change

- The FAQ questions, answers, accordion behavior, and layout remain untouched.
- The `CallWindowManButton` component itself is not modified -- it already implements the exact mobile-dial / desktop-reveal logic.
- No other files are affected.

## Technical Detail

The current code at line 75:
```
<button onClick={() => onOpenPreQuoteModal?.('faq_talk')} className="text-primary hover:underline">Call Window Man</button>
```

Will be replaced with the `CallWindowManButton` component, styled as an inline text-link to preserve the current visual appearance, passing `source="faq_section"` for analytics tracking.

