
# Update LeadCaptureModal (quote-scanner variant) to Match New Design

## Component Being Changed

**`src/components/conversion/LeadCaptureModal.tsx`** -- the `LeadCaptureModal` component, specifically when `sourceTool === 'quote-scanner'`. This is the modal triggered from "Upload Your Quote" on the `/ai-scanner` page.

## What Will Change (quote-scanner variant only)

All other `sourceTool` variants remain untouched.

### 1. Copy Updates (lines 291-296)

| Field | Before | After |
|-------|--------|-------|
| `modalTitle` | "Unlock Your Quote Analysis" | "Unlock Your Full Analysis" |
| `modalDescription` | "Get your complete 5-point breakdown plus AI-generated negotiation scripts to save thousands." | "Your quote has been analyzed. Enter your details to see the complete breakdown, warnings, and recommendations." |
| `buttonText` | "Unlock My Report" | "Unlock My Score Now" |

### 2. Header Icon

When `isQuoteScanner`, replace the Mail icon circle with a **Lock** icon (matching the right screenshot). Add `Lock` to the lucide-react imports.

### 3. Trust Banner

Add a green trust banner (only for quote-scanner variant) below the description, above the form:
- Rounded pill with `bg-green-50 border border-green-200`
- CheckCircle2 icon + text: **"Your data is secure."** + "Your Report is Securely Saved in Your Vault."
- Import `CheckCircle2` from lucide-react.

### 4. Form Labels

For the quote-scanner variant:
- **Email**: Change label from "Email Address" to "Email *" with a Mail icon
- **Phone**: Change label from "Phone Number" to "Phone *" with a Phone icon, no "(optional)" text

### 5. SMS Consent Checkbox

Add a checkbox row between Phone and the CTA button (quote-scanner only):
- Checkbox + text: "I agree to receive SMS updates about my quote analysis. Message & data rates may apply. Reply STOP to unsubscribe."
- Visual only, not a blocking validation field. Track consent in the `smsConsent` state variable.

### 6. CTA Button

For quote-scanner variant:
- Change icon from Mail to Lock
- Text already updated via `buttonText` above

### 7. Footer Text

Add a footer line below the CTA (quote-scanner only):
- "By submitting, you agree to our Terms of Service and Privacy Policy. We'll send your analysis to this email."
- Style: `text-xs text-slate-500 text-center`

## What Does NOT Change

- Props interface (`LeadCaptureModalProps`)
- Form validation logic (firstName, lastName, email, phone -- all same schemas)
- `NameInputPair` component usage (already renders First Name / Last Name side-by-side)
- Submission handler and API call to `save-lead`
- GTM/tracking events
- All other `sourceTool` variants (comparison-tool, risk-diagnostic, etc.)
- Success state UI
- Double-submit protection via `useFormLock`

## Technical Details

### Imports to Add
- `Lock`, `CheckCircle2`, `Phone` from `lucide-react`
- `Checkbox` from `@/components/ui/checkbox`
- `useState` for `smsConsent` (already imported)

### New State
- `const [smsConsent, setSmsConsent] = useState(false);`

### Conditional Rendering Pattern
All new elements (trust banner, SMS checkbox, footer) will be wrapped in `{isQuoteScanner && (...)}` guards so zero impact on other tool variants.
