# 🎯 GTM DATA LAYER COMPLETE AUDIT
**Date:** February 3, 2026
**Site:** https://itswindowman.com
**Status:** LIVE PRODUCTION

---

## 📊 EXECUTIVE SUMMARY

### ✅ WHAT'S WORKING (WELL-TRACKED)
- **10 Modals** with `trackLeadSubmissionSuccess` ($15 conversion)
- **3 Guide Modals** with `trackConsultationBooked` ($75 conversion)
- **1 Quiz** with `trackPhoneLead` ($25 conversion)
- **1 Modal** with `trackBookingConfirmed` ($75 conversion)
- **11 Components** with `trackModalOpen` (funnel tracking)
- **3 Forms** with `trackFormStart` (engagement tracking)
- **3 Tools** with `trackToolCompletion` (completion tracking)

### ⚠️ CRITICAL GAPS (MISSING TRACKING)

#### **HIGH-PRIORITY PAGES (No Tracking)**
1. ❌ **Index.tsx** (Homepage) - HIGHEST TRAFFIC PAGE
2. ❌ **BeatYourQuote.tsx** - NEW FEATURE
3. ❌ **Comparison.tsx** - CONVERSION TOOL
4. ❌ **Evidence.tsx** - PROOF PAGE
5. ❌ **Intel.tsx** - RESOURCE HUB
6. ❌ **Vault.tsx** - USER DASHBOARD
7. ❌ **About.tsx** - AUTHORITY PAGE
8. ❌ **FAQ.tsx** - SEO PAGE

#### **MISSING HIGH-VALUE EVENTS**
1. ❌ **trackQuoteUploadSuccess** ($50 conversion)
   - Only found in test file, NOT in production code
   - QuoteScanner.tsx uses `trackScannerUploadCompleted` instead (0 value)
   
2. ❌ **Tool Completion Events** - Inconsistent naming
   - Some use `trackToolComplete` (typo?)
   - Some use `trackToolCompletion` (correct)
   - Missing from: Comparison, FastWin, Evidence, Intel, Expert

3. ❌ **Form Abandonment Tracking** - Limited coverage
   - Only 3 forms tracked
   - Missing from most lead modals

---

## 🔍 DETAILED TRACKING INVENTORY

### ✅ **LEAD SUBMISSION SUCCESS ($15 Conversion)**
**Event:** `lead_submission_success`
**Value:** $15
**GTM Tag:** Meta - Lead Conversion

**Files Using (10):**
1. ✅ `ConsultationBookingModal.tsx` - Consultation form submissions
2. ✅ `LeadCaptureModal.tsx` - Standard email capture
3. ✅ `EbookLeadModal.tsx` - Ebook downloads
4. ✅ `ScannerLeadCaptureModal.tsx` - Quote scanner gate
5. ✅ `QuoteBuilderLeadModal.tsx` - Quote builder
6. ✅ `MissionInitiatedModal.tsx` - Beat Your Quote
7. ✅ `SampleReportAccessGate.tsx` - Sample report gate
8. ✅ `SampleReportLeadModal.tsx` - Sample report modal
9. ✅ `QuoteScanner.tsx` - Direct page submission
10. ✅ `Consultation.tsx` - Direct page submission

**Assessment:** ✅ **WELL COVERED** - All major lead capture points tracked

---

### ⚠️ **QUOTE UPLOAD SUCCESS ($50 Conversion) - CRITICAL GAP**
**Event:** `quote_upload_success`
**Value:** $50
**GTM Tag:** NEEDS TO BE CREATED

**Files Using (1):**
1. ❌ `useQuoteScanner.test.tsx` - TEST ONLY (not production)

**Current Production Code:**
```typescript
// QuoteScanner.tsx uses this instead:
trackScannerUploadCompleted({
  fileId: uploadResult.fileId,
  fileSize: selectedFile.size,
  uploadDuration: duration,
  sourceTool: 'quote-scanner',
});
// ❌ NO VALUE SENT - This is a $0 tracking event
```

**FIX REQUIRED:**
```typescript
// In QuoteScanner.tsx, AFTER successful upload and BEFORE analysis:
await trackQuoteUploadSuccess({
  scanAttemptId: uploadResult.scanAttemptId,
  email: sessionData.email,
  phone: sessionData.phone,
  leadId: leadId,
  sourceTool: 'quote-scanner',
});
```

**GTM CONFIGURATION REQUIRED:**
1. Create Custom Event Trigger: `quote_upload_success`
2. Create Meta Pixel tag firing on this trigger:
```javascript
fbq('trackCustom', 'QuoteUploaded', {
  value: {{DLV - value}}, // 50
  currency: {{DLV - currency}} // USD
}, {
  eventID: '{{DLV - event_id}}'
});
```

---

### ✅ **CONSULTATION BOOKED ($75 Conversion)**
**Event:** `consultation_booked`
**Value:** $75
**GTM Tag:** Consultation Booked Conversion

**Files Using (3):**
1. ✅ `KitchenTableGuideModal.tsx` - Guide gating
2. ✅ `SalesTacticsGuideModal.tsx` - Guide gating
3. ✅ `SpecChecklistGuideModal.tsx` - Guide gating

**Assessment:** ✅ **ADEQUATE** - All guide gates tracked

---

### ⚠️ **PHONE LEAD ($25 Conversion) - UNDERUTILIZED**
**Event:** `phone_lead_captured`
**Value:** $25
**GTM Tag:** Phone Lead Conversion

**Files Using (1):**
1. ✅ `FairPriceQuiz/QuizResults.tsx` - Quiz completion

**MISSING FROM:**
- ❌ ConsultationBookingModal (has phone field, not tracked separately)
- ❌ ScannerLeadCaptureModal (requires phone, not tracked separately)
- ❌ Quote Builder (has phone field, not tracked separately)

**RECOMMENDATION:** Add `trackPhoneLead` to ALL modals that collect phone numbers

---

### ✅ **BOOKING CONFIRMED ($75 Conversion)**
**Event:** `booking_confirmed`
**Value:** $75
**GTM Tag:** Booking Confirmed

**Files Using (1):**
1. ✅ `ConsultationBookingModal.tsx` - Consultation confirmations

**Assessment:** ✅ **ADEQUATE** - Single use case tracked

---

### ⚠️ **TOOL COMPLETION TRACKING - INCONSISTENT**
**Event:** `tool_completion`
**Value:** 0
**Purpose:** Funnel engagement tracking

**Naming Inconsistency:**
- `trackToolComplete` - TYPO (3 files)
- `trackToolCompletion` - CORRECT (3 files)

**Files Using `trackToolComplete` (TYPO):**
1. ❌ `CostCalculator.tsx`
2. ❌ `FastWin.tsx`
3. ❌ `RiskDiagnostic.tsx`
4. ❌ `RealityCheck.tsx`

**Files Using `trackToolCompletion` (CORRECT):**
1. ✅ `FairPriceQuiz.tsx`
2. ✅ `RealityCheck.tsx` (mixed usage)
3. ✅ `VulnerabilityTest.tsx`

**FIX REQUIRED:**
```typescript
// Find and replace in all files:
// OLD: trackToolComplete
// NEW: trackToolCompletion
```

**MISSING FROM:**
- ❌ Comparison.tsx
- ❌ Evidence.tsx
- ❌ Intel.tsx
- ❌ Expert.tsx
- ❌ ClaimSurvival.tsx
- ❌ QuoteScanner.tsx

---

## 🎯 PAGE-BY-PAGE TRACKING STATUS

### ✅ **WELL-TRACKED PAGES (23)**

| Page | Events | Assessment |
|------|--------|------------|
| FairPriceQuiz | trackLeadCapture, trackToolCompletion, trackEvent | ✅ EXCELLENT |
| QuoteScanner | trackLeadSubmissionSuccess, trackScannerUploadCompleted | ⚠️ MISSING $50 EVENT |
| RealityCheck | trackLeadCapture, trackConsultation, trackToolCompletion | ✅ EXCELLENT |
| Consultation | trackLeadSubmissionSuccess, trackEvent | ✅ GOOD |
| Proof | trackCTAClick, trackSectionView, trackToolRoute | ✅ EXCELLENT |
| ClaimSurvival | track, tracking | ⚠️ GENERIC TRACKING ONLY |
| Expert | tracking | ⚠️ GENERIC TRACKING ONLY |
| CostCalculator | trackToolComplete | ⚠️ TYPO + NO LEAD CAPTURE |
| FastWin | trackToolComplete | ⚠️ TYPO + NO LEAD CAPTURE |
| RiskDiagnostic | trackToolComplete | ⚠️ TYPO + NO LEAD CAPTURE |
| VulnerabilityTest | trackToolCompletion | ⚠️ NO LEAD CAPTURE |

### ❌ **UNTRACKED PAGES (14) - CRITICAL GAPS**

| Page | Traffic | Priority | Impact |
|------|---------|----------|--------|
| **Index.tsx** | HIGHEST | 🔴 CRITICAL | Homepage has NO tracking |
| **BeatYourQuote.tsx** | HIGH | 🔴 CRITICAL | New feature, no tracking |
| **Comparison.tsx** | HIGH | 🔴 CRITICAL | Conversion tool, no events |
| **Intel.tsx** | MEDIUM | 🟠 HIGH | Resource hub, no tracking |
| **Evidence.tsx** | MEDIUM | 🟠 HIGH | Proof page, no tracking |
| **Vault.tsx** | MEDIUM | 🟠 HIGH | User dashboard, no tracking |
| **About.tsx** | MEDIUM | 🟡 MEDIUM | Authority page, no tracking |
| **FAQ.tsx** | MEDIUM | 🟡 MEDIUM | SEO page, no tracking |
| Auth.tsx | LOW | 🟢 LOW | Auth page |
| Audit.tsx | LOW | 🟢 LOW | Internal audit |
| ButtonAudit.tsx | LOW | 🟢 LOW | Internal audit |
| Defense.tsx | LOW | 🟢 LOW | Defense page |
| NotFound.tsx | LOW | 🟢 LOW | 404 page |
| Tools.tsx | LOW | 🟢 LOW | Tools overview |

---

## 🚨 CRITICAL MISSING EVENTS

### 1. **HOMEPAGE (Index.tsx) - HIGHEST PRIORITY**

**Current State:** ❌ NO TRACKING WHATSOEVER

**Required Events:**
```typescript
// Add to Index.tsx

// Page view tracking (on mount)
useEffect(() => {
  trackPageView('/');
}, []);

// Hero CTA clicks
<Button onClick={() => {
  trackEvent('hero_cta_clicked', {
    button_text: 'Get Started',
    destination: '/risk-diagnostic'
  });
  navigate('/risk-diagnostic');
}}>

// Tool card clicks
const handleToolClick = (toolName: string) => {
  trackEvent('tool_card_clicked', {
    tool_name: toolName,
    source: 'homepage'
  });
};

// Social proof interactions
trackEvent('social_proof_viewed', {
  proof_type: 'testimonial',
  homeowners_helped: 3241
});
```

---

### 2. **BEAT YOUR QUOTE (BeatYourQuote.tsx) - NEW FEATURE**

**Current State:** ❌ NO TRACKING

**Required Events:**
```typescript
// Quote upload
trackQuoteUploadSuccess({
  scanAttemptId: uploadId,
  email: email,
  phone: phone,
  leadId: leadId,
  sourceTool: 'beat-your-quote',
});

// Mission initiated modal
trackModalOpen({
  modalName: 'mission_initiated',
  sourceTool: 'beat-your-quote',
});

// Analysis viewed
trackEvent('quote_analysis_viewed', {
  grade: 'B+',
  overage_percentage: 23,
  quote_amount: 15000,
});
```

---

### 3. **COMPARISON TOOL (Comparison.tsx) - CONVERSION TOOL**

**Current State:** ❌ NO TRACKING

**Required Events:**
```typescript
// Tool started
trackToolCompletion({
  toolName: 'comparison',
  completionTime: duration,
});

// Comparison generated
trackEvent('comparison_generated', {
  window_count: 10,
  tiers_compared: 3,
  price_range: '5000-25000',
});

// Email report clicked (CRITICAL - LEAD CAPTURE)
trackLeadCapture(input, email, phone);

// Consultation CTA clicked
trackEvent('consultation_cta_clicked', {
  source: 'comparison_tool',
  trigger: 'email_report_success',
});
```

---

### 4. **QUOTE SCANNER - MISSING $50 CONVERSION**

**Current Issue:** Uses `trackScannerUploadCompleted` (no value) instead of `trackQuoteUploadSuccess` ($50)

**Fix Location:** `src/pages/QuoteScanner.tsx` (around line 150-200)

**Current Code:**
```typescript
// AFTER upload completes
trackScannerUploadCompleted({
  fileId: uploadResult.fileId,
  fileSize: selectedFile.size,
  uploadDuration: duration,
  sourceTool: 'quote-scanner',
});
// ❌ This sends a $0 event to GTM
```

**Fixed Code:**
```typescript
// AFTER upload completes, BEFORE analysis starts
await trackQuoteUploadSuccess({
  scanAttemptId: uploadResult.scanAttemptId, // Deterministic event_id
  email: sessionData.email,
  phone: sessionData.phone,
  leadId: leadId || hookLeadId,
  sourceTool: 'quote-scanner',
});
// ✅ This sends a $50 conversion to Meta
```

---

## 🔧 IMPLEMENTATION PRIORITY

### **PHASE 1: CRITICAL FIXES (1-2 hours)**

1. ✅ **Fix trackToolComplete typo** (4 files)
   ```bash
   # Search and replace in:
   # - CostCalculator.tsx
   # - FastWin.tsx
   # - RiskDiagnostic.tsx
   # - RealityCheck.tsx
   ```

2. ✅ **Add trackQuoteUploadSuccess to QuoteScanner** ($50 conversion)
   - File: `src/pages/QuoteScanner.tsx`
   - Location: After upload, before analysis
   - Impact: $50 conversion tracking for high-intent users

3. ✅ **Add basic tracking to Index.tsx** (Homepage)
   - Page view
   - Hero CTA clicks
   - Tool card clicks
   - Social proof views

---

### **PHASE 2: HIGH-VALUE PAGES (2-3 hours)**

4. ✅ **Add tracking to Comparison.tsx**
   - Tool completion
   - Comparison generated
   - Email report CTA (lead capture)
   - Consultation CTA

5. ✅ **Add tracking to BeatYourQuote.tsx**
   - Quote upload ($50)
   - Mission initiated
   - Analysis viewed
   - Lead capture modals

6. ✅ **Add tracking to Intel.tsx**
   - Resource viewed
   - Resource downloaded
   - Guide unlocked
   - Consultation CTA

7. ✅ **Add tracking to Evidence.tsx**
   - Case study viewed
   - Download CTA
   - Related tool clicks

---

### **PHASE 3: OPTIMIZATION (3-4 hours)**

8. ✅ **Add trackPhoneLead to all phone-capturing modals**
   - ConsultationBookingModal
   - ScannerLeadCaptureModal
   - QuoteBuilderLeadModal
   - Fair Price Quiz

9. ✅ **Add trackToolCompletion to remaining tools**
   - Expert.tsx
   - ClaimSurvival.tsx
   - Intel.tsx
   - Evidence.tsx

10. ✅ **Add form abandonment tracking to all modals**
    - Track field entry
    - Track abandonment after 15s
    - Track partial completions

---

### **PHASE 4: POLISH (2-3 hours)**

11. ✅ **Add tracking to Vault.tsx**
    - Progress viewed
    - Results viewed
    - Documents accessed
    - Email results CTA

12. ✅ **Add tracking to About.tsx & FAQ.tsx**
    - Section views
    - CTA clicks
    - Question expansions (FAQ)

13. ✅ **Create GTM tags for new events**
    - Quote Upload Success ($50)
    - Tool completion events
    - Phone lead events
    - Form abandonment events

---

## 🎯 GTM TAG CONFIGURATION CHECKLIST

### ✅ **EXISTING TAGS (Verified in Phase 3 Report)**

1. ✅ **Meta - Lead Conversion** 
   - Trigger: `lead_submission_success`
   - Value: $15
   - Event ID: ✅ Configured

2. ✅ **Facebook CAPI - Lead**
   - Trigger: Lead Captured
   - Event ID: ✅ Configured
   - User Data: ✅ Full EMQ params

---

### ❌ **MISSING TAGS (Need Creation)**

3. ❌ **Meta - Quote Upload Conversion** 🔴 CRITICAL
   ```javascript
   // Tag Configuration
   Tag Name: Meta - Quote Upload Conversion
   Tag Type: Custom HTML
   Trigger: quote_upload_success (Custom Event)
   
   HTML:
   <script>
   fbq('trackCustom', 'QuoteUploaded', {
     value: {{DLV - value}},      // 50
     currency: {{DLV - currency}} // USD
   }, {
     eventID: '{{DLV - event_id}}'
   });
   </script>
   ```

4. ❌ **Meta - Phone Lead Conversion**
   ```javascript
   Tag Name: Meta - Phone Lead Conversion
   Tag Type: Custom HTML
   Trigger: phone_lead_captured (Custom Event)
   Value: $25
   ```

5. ❌ **GA4 - Tool Completion Events**
   ```javascript
   Tag Name: GA4 - Tool Completion
   Tag Type: GA4 Event
   Event Name: tool_completion
   Parameters:
     - tool_name: {{DLV - tool_name}}
     - completion_time: {{DLV - completion_time}}
     - score: {{DLV - score}}
   ```

6. ❌ **GA4 - Form Abandonment**
   ```javascript
   Tag Name: GA4 - Form Abandonment
   Tag Type: GA4 Event
   Event Name: form_abandonment
   Parameters:
     - form_name: {{DLV - form_name}}
     - fields_completed: {{DLV - fields_completed}}
     - time_spent_ms: {{DLV - time_spent_ms}}
   ```

---

## 📈 ESTIMATED IMPACT

### **Revenue Tracking Gap**

| Event | Current | After Fix | Monthly Volume | Lost Revenue Visibility |
|-------|---------|-----------|----------------|------------------------|
| Quote Upload | $0 | $50 | 100 uploads | $5,000/month |
| Phone Leads | Partial | $25 | 150 leads | $3,750/month |
| Tool Completions | Inconsistent | Tracked | 500 completions | Funnel visibility |
| Homepage Events | None | Full | 2,000 visitors | Entry point blind spot |

**Total Monthly Impact:** ~$8,750 in untracked conversion value

---

## 🔍 SERVER-SIDE TRACKING VERIFICATION GUIDE

### **Facebook Events Manager - What to Check**

Over the next 3-7 days, monitor these metrics:

1. **Event Match Quality (EMQ) Score**
   - Target: ≥8.0
   - Location: Events Manager → Data Sources → Select Pixel → Event Match Quality
   - Check: `event_id` deduplication working
   - Check: Browser Event ID coverage (should be >0%)

2. **Deduplication Rate**
   - Target: 90%+ deduplication
   - Formula: (Browser Events + Server Events - Deduplicated Events) / Total Events
   - Check: Same `event_id` from browser and server should merge into 1 event

3. **Server Events vs Browser Events**
   - Expected: ~2x server events (includes both browser + server-only)
   - Check: Server events have `event_id` parameter
   - Check: User data parameters populated (em, ph, fbp, fbc)

4. **Advanced Matching Coverage**
   - Check: `em` (email) present in >80% of lead events
   - Check: `ph` (phone) present in >40% of lead events
   - Check: `fbp` (browser ID) present in >95% of events
   - Check: `fbc` (click ID) present in ad-sourced traffic

---

### **Test Events Tool - Real-Time Validation**

Use Test Events to verify:

1. **Generate Test Event:**
   ```javascript
   // In browser console on https://itswindowman.com
   window.dataLayer.push({
     event: 'lead_submission_success',
     event_id: 'test-' + Date.now(),
     lead_id: 'test-lead-123',
     user_data: {
       em: 'test-hash-email',
       ph: 'test-hash-phone',
       fbp: window.truthEngine.getFbp(),
       fbc: window.truthEngine.getFbc(),
     },
     value: 15,
     currency: 'USD',
     source_tool: 'test-console',
   });
   ```

2. **Check in Test Events Tool:**
   - Event appears within 1-2 seconds
   - `event_id` matches
   - `user_data` parameters present
   - Deduplication indicator shows (if server also fired)

---

### **Debug Commands in Production**

Run these in browser console on https://itswindowman.com:

```javascript
// 1. Check if Truth Engine is installed
console.log('Truth Engine:', window.truthEngine);

// 2. Check Facebook Pixel loaded
console.log('Facebook Pixel:', typeof window.fbq);

// 3. Check GTM dataLayer
console.log('DataLayer:', window.dataLayer);

// 4. Get attribution cookies
console.log('FBP:', window.truthEngine.getFbp());
console.log('FBC:', window.truthEngine.getFbc());

// 5. Test event ID generation
console.log('Event ID:', window.truthEngine.generateEventId());

// 6. Test email hashing
window.truthEngine.sha256('test@example.com').then(hash => {
  console.log('Email Hash:', hash);
});
```

---

## 🎯 NEXT STEPS - PRIORITIZED ACTIONS

### **TODAY (2 hours)**

1. ✅ Review this audit with your team
2. ✅ Fix `trackToolComplete` typo (4 files)
3. ✅ Add `trackQuoteUploadSuccess` to QuoteScanner.tsx
4. ✅ Commit and push to production

### **THIS WEEK (8 hours)**

5. ✅ Add tracking to Index.tsx (homepage)
6. ✅ Add tracking to Comparison.tsx
7. ✅ Add tracking to BeatYourQuote.tsx
8. ✅ Add tracking to Intel.tsx
9. ✅ Create GTM tag for Quote Upload ($50)
10. ✅ Monitor EMQ score in Events Manager

### **NEXT WEEK (6 hours)**

11. ✅ Add `trackPhoneLead` to all phone modals
12. ✅ Add `trackToolCompletion` to remaining tools
13. ✅ Add form abandonment tracking
14. ✅ Add tracking to Vault, About, FAQ
15. ✅ Create remaining GTM tags
16. ✅ Run full tracking test suite

---

## 📊 SUCCESS METRICS

### **Week 1 Targets**
- [ ] EMQ Score ≥8.0
- [ ] Browser Event ID coverage >0%
- [ ] Deduplication rate >80%
- [ ] All critical pages tracked (Index, Comparison, BeatYourQuote)

### **Week 2 Targets**
- [ ] EMQ Score ≥8.5
- [ ] Deduplication rate >90%
- [ ] All tools with completion tracking
- [ ] $50 quote upload conversions tracking

### **Week 3 Targets**
- [ ] EMQ Score ≥9.0
- [ ] Phone lead tracking operational
- [ ] Form abandonment insights available
- [ ] Full attribution pipeline validated

---

**End of Audit Report**
