
# Updated Plan: 2-Step Lead Capture Modal Flow

## Overview

The `SampleReportLeadModal` will now be a 2-step modal:
- **Step 1:** Lead capture (First Name, Last Name, Email, Phone)
- **Step 2:** Call conversion opportunity before continuing to the scanner

This maximizes phone conversions by presenting a call option at the exact moment of highest intent - right after they've committed to getting an audit.

---

## Key Changes From Previous Plan

| Aspect | Previous Plan | Updated Plan |
|--------|---------------|--------------|
| Post-submission | Immediate redirect to `/ai-scanner` | Show Step 2 with call option |
| Modal steps | Single step | 2-step flow |
| Phone conversion | Only "Talk to Window Man" buttons | Additional call prompt in modal |
| GTM events | Just `sample_report_lead_captured` | + `sample_report_modal_step2_call` and `sample_report_modal_step2_continue` |

---

## File to Create

### `src/components/sample-report/SampleReportLeadModal.tsx`

**State Machine:**
```typescript
type ModalStep = 'form' | 'call-offer';

const [step, setStep] = useState<ModalStep>('form');
const [capturedLeadId, setCapturedLeadId] = useState<string | null>(null);
```

**Step 1 (Lead Capture):**
- Form fields: First Name, Last Name, Email, Phone (all required)
- Partner consent checkbox (optional, pre-checkable via prop)
- Submit button: "Get My Free Audit"
- On success: Store `leadId`, transition to `'call-offer'` step (NOT navigate)

**Step 2 (Call Offer):**
- Headline: "Great! We've received your info."
- Subtext: "Want answers now? Call WindowMan directly."
- **Option A (Primary):** Large, prominent call button
  - Label: "Call WindowMan to Get Answers or a Better Estimate"
  - Phone: `(561) 468-5571`
  - `href="tel:+15614685571"`
  - On click: Fire `sample_report_modal_step2_call` event, then close modal (user continues to call)
- **Option B (Secondary):** Text link style
  - Label: "Continue to My Free Audit"
  - On click: Fire `sample_report_modal_step2_continue` event, navigate to `/ai-scanner?lead={leadId}#upload`

---

## Step 2 UI Visual

```text
┌─────────────────────────────────────────┐
│                                    [X]  │
│                                         │
│          ✓  Great! We've               │
│             received your info.         │
│                                         │
│     Want answers now? Call WindowMan    │
│           directly for free.            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  📞 Call WindowMan Now          │   │
│  │     (561) 468-5571              │   │
│  │     Get Answers or a Better     │   │
│  │     Estimate                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│      Continue to My Free Audit →        │
│                                         │
└─────────────────────────────────────────┘
```

---

## GTM Tracking Events

### Step 1 Events (unchanged)
```typescript
// Modal opens
trackEvent('sample_report_lead_modal_open', {
  cta_source: ctaSource,
  has_existing_lead: false
});

// Form submitted successfully
trackEvent('sample_report_lead_captured', {
  lead_id: newLeadId,
  cta_source: ctaSource,
  partner_consent: partnerConsent
});
```

### Step 2 Events (NEW)
```typescript
// User clicks call button
trackEvent('sample_report_modal_step2_call', {
  lead_id: capturedLeadId,
  cta_source: ctaSource,
  phone_number: '+15614685571'
});

// User clicks continue to audit
trackEvent('sample_report_modal_step2_continue', {
  lead_id: capturedLeadId,
  cta_source: ctaSource
});
```

---

## Implementation Details

### Modal Flow Logic

```typescript
// Step 1 submission handler
const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... validation and save-lead call ...
  
  if (data.success && data.leadId) {
    setCapturedLeadId(data.leadId);
    setLeadAnchor(data.leadId);
    
    // Track lead capture
    await trackLeadSubmissionSuccess({ ... });
    
    // Transition to Step 2 (NOT navigate)
    setStep('call-offer');
  }
};

// Step 2 call button handler
const handleCallClick = () => {
  trackEvent('sample_report_modal_step2_call', {
    lead_id: capturedLeadId,
    cta_source: ctaSource,
    phone_number: '+15614685571'
  });
  // Note: Don't close modal - let user click link naturally
  // The tel: link will trigger the call
};

// Step 2 continue handler
const handleContinueClick = () => {
  trackEvent('sample_report_modal_step2_continue', {
    lead_id: capturedLeadId,
    cta_source: ctaSource
  });
  onClose();
  navigate(`/ai-scanner?lead=${capturedLeadId}#upload`);
};
```

### Visual Priority for Step 2

The call button should be the most prominent element:
- Large size (`size="lg"`)
- Primary/CTA variant with strong color
- Phone icon
- Full width
- Subtle glow or attention animation (optional)

The continue link should be:
- Text-only or ghost button style
- Smaller font
- Below the call button
- Arrow icon to indicate progression

---

## Files to Modify

### `src/pages/SampleReport.tsx`

No changes from previous plan - same state management:
```typescript
const [showLeadModal, setShowLeadModal] = useState(false);
const [modalCtaSource, setModalCtaSource] = useState('');
const [preCheckPartnerConsent, setPreCheckPartnerConsent] = useState(false);

const handleOpenLeadModal = (ctaSource: string, preCheckConsent = false) => {
  const existingLead = getLeadAnchor();
  if (existingLead) {
    navigate(`/ai-scanner?lead=${existingLead}#upload`);
  } else {
    setModalCtaSource(ctaSource);
    setPreCheckPartnerConsent(preCheckConsent);
    setShowLeadModal(true);
  }
};

const handleLeadModalSuccess = (leadId: string) => {
  setShowLeadModal(false);
  navigate(`/ai-scanner?lead=${leadId}#upload`);
};
```

### Child Components (unchanged from previous plan)

- `SampleReportHeader.tsx` - Accept `onOpenLeadModal` prop, "Talk to Window Man" → `tel:+15614685571`
- `HeroSection.tsx` - Accept `onOpenLeadModal` prop
- `CloserSection.tsx` - Accept `onOpenLeadModal` prop, "Talk to Window Man" → `tel:+15614685571`
- `LeverageOptionsSection.tsx` - Accept `onOpenLeadModal` prop (Path B pre-checks consent)

---

## Mobile Considerations

- Phone field: `type="tel"` for numeric keyboard
- Email field: `type="email"` for email keyboard
- Call button: Large touch target (48px+ height)
- Step 2 call button: Uses `<a href="tel:...">` which works natively on mobile
- Continue link: Sufficient tap area

---

## Implementation Order

1. Create `SampleReportLeadModal.tsx` with 2-step flow
2. Update `SampleReport.tsx` with state and modal rendering
3. Update `SampleReportHeader.tsx` (modal trigger + direct phone link)
4. Update `HeroSection.tsx` (modal trigger)
5. Update `CloserSection.tsx` (modal trigger + direct phone link)
6. Update `LeverageOptionsSection.tsx` (modal trigger with pre-check)
7. Test full flow: form → step 2 → call/continue
8. Test skip logic with existing lead anchor
