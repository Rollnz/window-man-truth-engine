# 🚀 PHASE 1 IMPLEMENTATION GUIDE
## Its Window Man - 30-Day Launch Plan

---

## ✅ COMPLETED TASKS

### Day 1-3: Foundation
- [x] GTM installed in index.html
- [x] GTM helper library created (`src/lib/gtm.ts`)
- [x] Reality Check conversion CTAs added
- [x] Reality Check GTM tracking implemented

**Next: Replace `GTM-XXXXXXX` with your actual GTM ID in:**
- `index.html` (line 9)
- `src/lib/gtm.ts` (line 8)

---

## 📋 REMAINING TASKS

### **DAY 4-5: Cost Calculator Conversion Fix** (3 hours)

**File to modify:** `src/pages/CostCalculator.tsx`

**Changes needed:**

1. Import conversion modals and GTM:
```typescript
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import { trackLeadCapture, trackConsultation, trackToolCompletion } from '@/lib/gtm';
```

2. Add state for modals (around line 23, after existing state):
```typescript
const [showLeadModal, setShowLeadModal] = useState(false);
const [showConsultModal, setShowConsultModal] = useState(false);
```

3. Add handlers (around line 60, after handleCalculate):
```typescript
const handleEmailReport = () => {
  setShowLeadModal(true);
};

const handleScheduleConsult = () => {
  setShowConsultModal(true);
};

const handleLeadSuccess = (leadId: string) => {
  updateFields({ leadId });
  setShowLeadModal(false);
  
  trackLeadCapture({
    sourceTool: 'cost-calculator',
    email: sessionData.email || '',
    leadScore: projection?.year5 ? Math.min(projection.year5 / 100, 100) : 0,
  });
};

const handleConsultSuccess = () => {
  updateFields({ consultationRequested: true });
  setShowConsultModal(false);
  
  trackConsultation({
    name: sessionData.name || '',
    phone: sessionData.phone || '',
    email: sessionData.email || '',
  });
};
```

4. Track tool completion (in handleCalculate, after setShowResults(true)):
```typescript
trackToolCompletion({
  toolName: 'cost-calculator',
  score: result.year5,
});
```

5. Add conversion section (after BreakEvenIndicator, before "Recalculate" button):
```typescript
{/* NEW: Conversion Section */}
<div className="p-6 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
  <h3 className="text-xl font-semibold mb-2 text-destructive">
    Stop Losing ${projection.daily.toFixed(2)} Per Day!
  </h3>
  <p className="text-muted-foreground mb-4">
    You're on track to lose ${projection.year5.toLocaleString()} over 5 years. 
    Let's create your personalized savings plan.
  </p>
  
  <div className="flex flex-col sm:flex-row gap-3">
    <Button 
      size="lg"
      className="flex-1"
      onClick={handleEmailReport}
    >
      <Mail className="mr-2 h-5 w-5" />
      Email My Cost Analysis
    </Button>
    
    <Button
      size="lg"
      variant="outline"
      className="flex-1"
      onClick={handleScheduleConsult}
    >
      <Calendar className="mr-2 h-5 w-5" />
      Get Free Assessment
    </Button>
  </div>
</div>
```

6. Add modals (before closing </div> of main container):
```typescript
{/* Conversion Modals */}
<LeadCaptureModal
  isOpen={showLeadModal}
  onClose={() => setShowLeadModal(false)}
  onSuccess={handleLeadSuccess}
  sourceTool="cost-calculator"
  sessionData={sessionData}
/>

<ConsultationBookingModal
  isOpen={showConsultModal}
  onClose={() => setShowConsultModal(false)}
  onSuccess={handleConsultSuccess}
  sessionData={sessionData}
/>
```

7. Add imports at top:
```typescript
import { Mail, Calendar } from 'lucide-react';
```

**✅ Test:**
- Complete calculator
- Click "Email My Cost Analysis" → Modal opens → Submit → Success
- Click "Get Free Assessment" → Modal opens → Submit → Success
- Check console for GTM events

---

### **DAY 6: Add Lead Capture Modal Copy** (30 mins)

**File to modify:** `src/components/conversion/LeadCaptureModal.tsx`

Find this section (around line 164):
```typescript
} else if (isRiskDiagnostic) {
  modalTitle = 'Email My Protection Plan';
  // ...
}
```

**Add these two blocks before the closing `}`:**

```typescript
else if (sourceTool === 'reality-check') {
  modalTitle = 'Email My Reality Report';
  modalDescription = `Your Reality Score of ${sessionData.realityCheckScore} shows ${
    sessionData.realityCheckScore >= 76 ? 'urgent action is needed' : 'room for improvement'
  }. Get your complete report with personalized action steps.`;
  buttonText = 'Send My Report';
  successTitle = 'Report Sent!';
  successDescription = 'Check your inbox for your complete Reality Check analysis.';
}
else if (sourceTool === 'cost-calculator') {
  modalTitle = 'Email My Cost Analysis';
  modalDescription = `You're losing $${Math.round(sessionData.costOfInactionTotal || 0).toLocaleString()} over 5 years. Get your complete breakdown with savings strategies.`;
  buttonText = 'Send My Analysis';
  successTitle = 'Analysis Sent!';
  successDescription = 'Check your inbox for your personalized cost breakdown and savings plan.';
}
```

---

### **DAY 7-9: Facebook CAPI Setup** (4 hours)

#### **Step 1: Get Facebook Credentials** (1 hour)

1. Go to Facebook Events Manager: https://business.facebook.com/events_manager2
2. Select your Pixel
3. Click "Settings"
4. Under "Conversions API", click "Generate Access Token"
5. Copy:
   - **Pixel ID**: `1234567890` (example)
   - **Access Token**: `EAAG...` (long string)

#### **Step 2: Add to Environment Variables** (5 mins)

**Locally** (`.env` file):
```bash
VITE_FB_PIXEL_ID=YOUR_PIXEL_ID_HERE
VITE_FB_CAPI_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE
```

**Vercel** (Project Settings → Environment Variables):
```
VITE_FB_PIXEL_ID = YOUR_PIXEL_ID_HERE
VITE_FB_CAPI_ACCESS_TOKEN = YOUR_ACCESS_TOKEN_HERE
```

#### **Step 3: Update save-lead Edge Function** (2 hours)

**File:** `supabase/functions/save-lead/index.ts`

**Add at top:**
```typescript
import { createHash } from "https://deno.land/std@0.192.0/node/crypto.ts";

function hashSHA256(text: string): string {
  return createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}
```

**Add after lead saved to database (around line 30-40):**
```typescript
// Facebook Conversions API
try {
  const fbPixelId = Deno.env.get('VITE_FB_PIXEL_ID');
  const fbAccessToken = Deno.env.get('VITE_FB_CAPI_ACCESS_TOKEN');
  
  if (fbPixelId && fbAccessToken) {
    const fbPayload = {
      data: [{
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: req.headers.get('referer') || 'https://itswindowman.com',
        user_data: {
          em: [hashSHA256(email)],
          ph: phone ? [hashSHA256(phone)] : undefined,
          client_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0],
          client_user_agent: req.headers.get('user-agent'),
        },
        custom_data: {
          source_tool: sourceTool,
          currency: 'USD',
          value: consultationRequested ? 200.00 : 50.00,
        },
      }],
      access_token: fbAccessToken,
    };
    
    await fetch(`https://graph.facebook.com/v18.0/${fbPixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fbPayload),
    });
    
    console.log('[CAPI] Event sent to Facebook');
  }
} catch (error) {
  console.error('[CAPI] Error sending to Facebook:', error);
  // Don't fail the request if CAPI fails
}
```

#### **Step 4: Deploy Edge Function** (10 mins)

```bash
# In your terminal
cd supabase/functions
supabase functions deploy save-lead --no-verify-jwt
```

#### **Step 5: Test CAPI** (30 mins)

1. Create test lead (Reality Check or Cost Calculator)
2. Submit email
3. Go to Facebook Events Manager → Test Events
4. You should see "Lead" event with:
   - Event source: "website"
   - Event name: "Lead"
   - User data: Hashed email
5. Check "Match Quality" score (should be 4-6/10)

**✅ Success Criteria:**
- Events appear in Facebook Events Manager
- Match quality > 3/10
- No errors in Supabase logs

---

### **DAY 10-14: INTERNAL CRM BUILD** (20 hours)

**RECOMMENDATION:** Use **Manus.ai** or **Lovable** for rapid CRM development.

#### **Why Manus/Lovable for CRM:**
- ✅ **Fast**: Build in 4-6 hours vs 20 hours manual coding
- ✅ **AI-Powered**: Describe features, get working code
- ✅ **Supabase Integration**: Built-in support
- ✅ **Beautiful UI**: shadcn/ui components
- ✅ **Kanban Board**: Built-in components

#### **CRM Feature Requirements**

**Tell Manus/Lovable:**

> "Create a CRM dashboard for lead management with these features:
> 
> 1. **Dashboard Page** (`/crm/dashboard`)
>    - Stats cards: Today's leads, Hot leads, Consultations, Avg score
>    - Recent leads table (20 most recent)
>    - Real-time updates using Supabase Realtime
>    - Sound notification on new lead
> 
> 2. **Leads List Page** (`/crm/leads`)
>    - Kanban board view with 4 columns:
>      - New (lead_temperature = 'cold')
>      - Warm (lead_temperature = 'warm')
>      - Hot (lead_temperature = 'hot')
>      - Contacted
>    - Drag-and-drop to change status
>    - Filter by: Date, Source tool, Temperature
>    - Search by: Email, Name
>    - Click card to view detail
> 
> 3. **Lead Detail Page** (`/crm/leads/:id`)
>    - Lead info (name, email, phone, source, score)
>    - Session data (all tools completed, scores)
>    - Timeline of events (tool started, completed, etc.)
>    - Distribution log (sent to GHL, status)
>    - Update status dropdown
>    - Add notes field
>    - Mark as "Appointment Booked" or "Sold"
> 
> 4. **Data Models**:
>    - Use existing `leads` table from Supabase
>    - Add `status` field: 'new', 'contacted', 'appointment', 'sold', 'lost'
>    - Add `notes` field: TEXT
>    - Add `last_contacted` field: TIMESTAMPTZ
> 
> 5. **Protected Routes**:
>    - Require authentication (use existing AuthGuard)
>    - Only you can access (check email = your@email.com)
> 
> 6. **Real-time Features**:
>    - Use Supabase Realtime subscriptions
>    - New lead appears immediately
>    - Status changes sync across tabs
>    - Play notification.mp3 on new lead"

#### **Database Migration for CRM**

**File:** `supabase/migrations/006_crm_enhancements.sql`

```sql
-- Add CRM fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS appointment_booked BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sold BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sale_amount NUMERIC(10,2);

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(lead_temperature);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- Add view for kanban board
CREATE OR REPLACE VIEW crm_kanban_leads AS
SELECT 
  id,
  email,
  name,
  phone,
  source_tool,
  lead_score,
  lead_temperature,
  status,
  created_at,
  last_contacted,
  appointment_booked,
  sold,
  CASE 
    WHEN sold THEN 'sold'
    WHEN appointment_booked THEN 'appointment'
    WHEN status = 'contacted' THEN 'contacted'
    WHEN lead_temperature = 'hot' THEN 'hot'
    WHEN lead_temperature = 'warm' THEN 'warm'
    ELSE 'new'
  END as kanban_column
FROM leads
ORDER BY created_at DESC;
```

**Run migration:**
```bash
# In Supabase dashboard
# SQL Editor → New Query → Paste above → Run
```

#### **Feedback Loop: Marking Appointments & Sales**

**Feature:** Update lead status to push data back to Facebook

**Implementation** (in Lead Detail page):

```typescript
const handleMarkAppointment = async () => {
  // Update in database
  await supabase
    .from('leads')
    .update({ 
      appointment_booked: true, 
      status: 'appointment',
      last_contacted: new Date().toISOString(),
    })
    .eq('id', leadId);
  
  // Send to Facebook CAPI (for optimization)
  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-conversion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      leadId: leadId,
      eventName: 'ScheduleAppointment',
      value: 200.00,
    }),
  });
};

const handleMarkSold = async (saleAmount: number) => {
  // Update in database
  await supabase
    .from('leads')
    .update({ 
      sold: true, 
      status: 'sold',
      sold_at: new Date().toISOString(),
      sale_amount: saleAmount,
    })
    .eq('id', leadId);
  
  // Send to Facebook CAPI (for optimization)
  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-conversion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      leadId: leadId,
      eventName: 'Purchase',
      value: saleAmount,
    }),
  });
};
```

**Create new Edge Function** (`supabase/functions/facebook-conversion/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from "https://deno.land/std@0.192.0/node/crypto.ts";

function hashSHA256(text: string): string {
  return createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

serve(async (req) => {
  const { leadId, eventName, value } = await req.json();
  
  // Get lead from database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();
  
  if (!lead) {
    return new Response(JSON.stringify({ error: 'Lead not found' }), { status: 404 });
  }
  
  // Send to Facebook CAPI
  const fbPixelId = Deno.env.get('VITE_FB_PIXEL_ID');
  const fbAccessToken = Deno.env.get('VITE_FB_CAPI_ACCESS_TOKEN');
  
  const fbPayload = {
    data: [{
      event_name: eventName, // 'ScheduleAppointment' or 'Purchase'
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'crm',
      user_data: {
        em: [hashSHA256(lead.email)],
        ph: lead.phone ? [hashSHA256(lead.phone)] : undefined,
      },
      custom_data: {
        source_tool: lead.source_tool,
        currency: 'USD',
        value: value,
      },
    }],
    access_token: fbAccessToken,
  };
  
  await fetch(`https://graph.facebook.com/v18.0/${fbPixelId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fbPayload),
  });
  
  return new Response(JSON.stringify({ success: true }));
});
```

**Deploy:**
```bash
supabase functions deploy facebook-conversion --no-verify-jwt
```

---

### **DAY 15-21: GOHIGHLEVEL INTEGRATION** (When API arrives)

#### **Step 1: Get API Credentials from Contractor**

Request:
- [ ] API Key (or OAuth credentials)
- [ ] Location IDs for all 7 locations
- [ ] Webhook URL (if they want instant notifications)

#### **Step 2: Database Migrations**

Already done in Phase 1 blueprint (migration 004).

#### **Step 3: Lead Scoring Function**

**File:** `supabase/functions/calculate-lead-score/index.ts`

Already provided in blueprint. Copy from PHASE1_IMPLEMENTATION_GUIDE.

#### **Step 4: Lead Distribution Function**

**File:** `supabase/functions/distribute-lead/index.ts`

Already provided in blueprint. Copy from PHASE1_IMPLEMENTATION_GUIDE.

#### **Step 5: Test Distribution**

```bash
# Create test lead in your CRM
# Click "Distribute to GHL"
# Check GHL dashboard for contact
# Verify tags and custom fields
```

---

### **DAY 22-28: TESTING & QA** (8 hours)

#### **Checklist:**

**Conversion Flows:**
- [ ] Reality Check: Complete → Email button → Modal → Submit → Success
- [ ] Reality Check: Results → Consultation button → Modal → Submit → Success
- [ ] Cost Calculator: Complete → Email button → Modal → Submit → Success
- [ ] Cost Calculator: Results → Consultation button → Modal → Submit → Success
- [ ] Risk Diagnostic: Works (already had conversion)
- [ ] Expert Chat: Works (already had conversion)
- [ ] Claim Survival: Works (already had conversion)
- [ ] Quote Scanner: Works (already had conversion)
- [ ] Fast Win: Works (already had conversion)

**Tracking:**
- [ ] GTM events fire (check console: `[GTM Event] lead_captured`)
- [ ] Facebook CAPI events appear in Events Manager
- [ ] Lead saved to Supabase `leads` table
- [ ] Lead appears in CRM dashboard immediately
- [ ] Notification sound plays

**CRM:**
- [ ] Dashboard stats update in real-time
- [ ] Kanban board drag-and-drop works
- [ ] Lead detail shows all info
- [ ] Mark appointment → Updates status → Sends to Facebook
- [ ] Mark sold → Updates status → Sends to Facebook

**Mobile:**
- [ ] All tools work on iPhone
- [ ] All tools work on Android
- [ ] Modals display correctly
- [ ] No console errors

**Performance:**
- [ ] Lighthouse score > 85
- [ ] Page load < 3 seconds
- [ ] No layout shifts

---

### **DAY 29-30: LAUNCH!** 🚀

#### **Pre-Launch Checklist:**
- [ ] All conversion flows tested
- [ ] GTM + Facebook CAPI verified
- [ ] CRM dashboard accessible
- [ ] GHL integration tested
- [ ] Mobile tested
- [ ] Vercel deployment stable

#### **Launch Day:**
1. **Morning**: Final production deploy
2. **Noon**: Announce to contractor
3. **Afternoon**: Launch ads (start small: $50/day)
4. **Evening**: Monitor first leads

#### **First Week Monitoring:**
- Check CRM hourly
- Monitor conversion rates
- Check lead distribution
- Fix issues immediately
- Scale ad spend gradually

---

## 📊 **SUCCESS METRICS**

### **Week 1 Goals:**
- [ ] 10-20 leads from ads
- [ ] 95%+ tracking accuracy
- [ ] 0 distribution failures
- [ ] < 5 bugs reported

### **Month 1 Goals:**
- [ ] 1,500 leads (50/day)
- [ ] 15-25% conversion rate (visitors → leads)
- [ ] 30%+ hot lead rate
- [ ] 10-15% consultation rate
- [ ] $45,000-$112,500 revenue

---

## 🆘 **TROUBLESHOOTING**

### **GTM Events Not Firing:**
- Check console for `[GTM Event]` logs
- Verify `window.dataLayer` exists
- Check GTM Preview mode

### **Facebook CAPI Not Working:**
- Check Supabase function logs
- Verify Pixel ID and Access Token
- Check Events Manager → Test Events

### **CRM Not Showing Leads:**
- Check Supabase table `leads`
- Verify real-time subscription
- Check browser console for errors

### **Lead Distribution Failing:**
- Check `lead_distribution_log` table
- Verify GHL API key valid
- Check GHL location IDs correct

---

## 💰 **COST TRACKER**

### **Monthly:**
- Vercel: $0 (free tier)
- Supabase: $25 (Pro tier)
- Facebook/Google Ads: $1,500-3,000 (contractor pays)
- **Total (Your Cost): $25/month**

### **One-Time:**
- Manus.ai subscription (if used): $20/month (optional)
- Developer help (if hired): $500-1,000 (optional)

---

## 🎓 **LEARNING RESOURCES**

### **For You:**
- GTM Tutorial: https://analytics.google.com/analytics/academy/
- Supabase Docs: https://supabase.com/docs
- Facebook CAPI Guide: https://developers.facebook.com/docs/marketing-api/conversions-api

### **For Future Devs:**
- This guide
- Existing codebase
- Phase 2 roadmap (coming after Phase 1 launch)

---

## 📞 **NEXT STEPS**

1. ✅ Review this guide
2. ✅ Get Facebook Pixel ID + CAPI token (Day 7)
3. ✅ Complete Cost Calculator fix (Day 4-5)
4. ✅ Test all conversion flows (Day 6)
5. ✅ Build CRM in Manus/Lovable (Day 10-14)
6. ⏳ Wait for GHL API (Week 3)
7. ✅ Launch! (Day 29-30)

---

**Questions? Issues? Stuck on a task?**

Document the problem here and we'll troubleshoot together! 🚀
