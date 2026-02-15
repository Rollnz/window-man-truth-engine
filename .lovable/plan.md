

## Wire Upload Button + Add Prominent "No Quote Yet?" CTA

### What Changes

**Single file:** `src/components/audit/UploadZoneXRay.tsx`

### 1. Wire "Upload Quote for Free Gradecard" to file input

The right panel's idle state (lock overlay, lines 357-383) has an orange "Upload Quote for Free Gradecard" button that currently does nothing.

- Add a `useRef<HTMLInputElement>` for a hidden file input
- Place a hidden `<input type="file" accept="image/*,.pdf">` inside the overlay whose `onChange` calls the existing `onFileSelect` prop
- Wire the button's `onClick` to programmatically `.click()` that hidden input
- Both cards now funnel into the same upload logic

### 2. Add prominent "No Quote Yet? View a Sample Audit" button

Below the "Instant analysis via Gemini 3 OCR Flash" line (line 378-381), add a new button:

- **Styling:** Solid blue background with bright white text (`bg-primary text-white hover:bg-primary/90`) -- same visual weight as the upload button, not a subtle ghost
- **Spacing:** `mt-4` gap so both buttons read as equal-priority options
- **Icon:** `FileText` icon prefix for visual distinction from the upload button
- **Click action:** Opens `PreQuoteLeadModalV2` with `ctaSource="audit-gradecard-no-quote"`

### 3. Modal integration

- Import `PreQuoteLeadModalV2` from `@/components/LeadModalV2`
- Add `const [showPreQuoteModal, setShowPreQuoteModal] = useState(false)`
- Render the modal at the component root level (after the `XRayScannerBackground` closing tag area, outside any Card) to avoid z-index/overflow clipping

### Technical Details

**Right panel idle overlay structure after changes:**

```text
[Eye icon]
"See Your Gradecard"
"Upload your quote to reveal your score"

[ Upload Quote for Free Gradecard ]     <-- orange gradient, now wired to hidden file input
  "Instant analysis via Gemini 3 OCR Flash"

[ No Quote Yet? View a Sample Audit ]   <-- solid blue bg, white text, opens PreQuoteLeadModalV2
```

**New imports:**
- `useRef` added to React import
- `PreQuoteLeadModalV2` from `@/components/LeadModalV2`

**No other files are modified.**

