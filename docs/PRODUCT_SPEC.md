# Window Truth Engine - Product Specification

## Executive Summary

Window Truth Engine is a dual-business model platform combining:
1. **Front-Stage:** Horizons Vault - Home Protection Document Management SaaS ($9-39/month recurring)
2. **Back-Stage:** Impact Window Lead Generation + Installation Sales ($18K average transaction)

The platform uses free educational tools and content to build trust, converting users into vault subscribers while identifying high-intent leads for window installation services.

## Business Model Architecture

### Revenue Streams

**Stream 1: Vault Subscriptions (Recurring)**
- Basic Vault: $9/month ($99/year)
- Protection Vault: $15/month ($149/year) ⭐ Primary tier
- Ultimate Vault: $39/month ($399/year)

**Stream 2: Window Installation (High-Ticket)**
- Average job value: $18,000
- Direct installations (Window Guy crew)
- Contractor network referrals (5-8% commission)

**Stream 3: Services & Add-Ons**
- Expert quote reviews: FREE for vault members
- Hurricane preparedness consulting
- Insurance claim assistance
- Contractor vetting services

### Customer Lifetime Value Model

**Year 1:**
- Vault subscription: $180 (annual plan)
- Window installation: $18,000 (if converted)
- Total: $18,180

**Years 2-5:**
- Vault subscription: $180/year × 4 = $720
- Referral opportunities: 1-2 friends × $18,000 = $18,000-36,000
- Total LTV: $36,900 - $54,900 from single customer

### Market Positioning

**"The Kayak for Impact Windows"**
- Aggregate pricing from multiple contractors
- "Beat Your Quote" guarantee
- Homeowner advocate (not contractor salesperson)
- Education-first approach builds trust

---

## Core Features & Implementation Status

### 1. Interactive Diagnostic Tools (Built ✅)

All 10 tools are live with full tracking:
- Risk Diagnostic
- Cost Calculator
- Reality Check
- Vulnerability Test
- Fast Win Finder
- Comparison Tool
- Quote Scanner
- Evidence Vault
- Intel Hub
- Claim Survival Kit

### 2. Analytics & Tracking System (Built ✅)

Complete event tracking system with:
- Page views (28 routes)
- Tool completions (5 tools)
- Modal opens/abandons (3 modals)
- Session tracking
- Analytics dashboard

### 3. Vault System (Planned 📋)

Subscription-based document management system.

See "Vault Implementation Plan" section below for details.

### 4. Beat Your Quote Guarantee (Planned 📋)

Quote analysis and contractor matching platform.

See "Beat Your Quote Implementation Plan" section below for details.

### 5. Expert Review Process (Planned 📋)

Personalized quote analysis and recommendations.

See "Expert Review Implementation Plan" section below for details.

---

## Vault Implementation Plan

### Pricing Tiers

**Basic Vault - $9/month ($99/year)**
- 5GB document storage
- Quote comparison tools
- Annual hurricane reminders
- Email support

**Protection Vault - $15/month ($149/year) ⭐ MOST POPULAR**
- 25GB storage
- SMS hurricane alerts
- Annual photo reminder service
- Insurance policy analysis
- Contractor license verification
- Priority email support

**Ultimate Vault - $39/month ($399/year)**
- Unlimited storage
- Priority expert review (24hr response)
- Quarterly home documentation check-ins
- White-glove insurance claim assistance
- Concierge contractor matching
- Phone support + dedicated account manager

### Onboarding Flow

**Page 1: Account Creation**
- Minimal form (name, email, phone, password)
- SMS opt-in checkbox
- Free 14-day trial messaging
- No credit card required

**Page 2: Welcome / Value Reinforcement**
- Progress bar (Step 2 of 4)
- What happens next (numbered list)
- Visual: Documents flying into vault animation
- CTA: Continue to upload

**Page 3: Document Upload**
- Drag-and-drop interface
- Recommended uploads checklist
- Side panel explaining benefits
- Security messaging
- CTA: Continue or Skip

**Page 4: Plan Selection**
- Three pricing cards side-by-side
- Monthly/Annual toggle
- Social proof testimonials below
- Money-back guarantee
- Clear FAQ section

**Page 5: Payment (Stripe)**
- Payment form (left column)
- Order summary (right column)
- Trial terms clearly stated
- Secure payment messaging

**Page 6: Dashboard**
- Protection status progress bar
- Document library
- Hurricane season countdown
- Expert review CTA
- Action items for completion

### Dashboard Features

**Modules:**
1. Protection Status (completion percentage)
2. Document Library (uploaded files)
3. Hurricane Season (countdown + preparedness score)
4. Expert Review (request CTA)
5. Quick Actions (upload, share, download)

### Technical Requirements

**Frontend:**
- Subscription pricing page
- Onboarding flow (6 pages)
- Dashboard interface
- Document upload component
- Payment form (Stripe Elements)

**Backend:**
- Stripe integration (subscriptions API)
- Trial period logic (14 days)
- Document storage (Supabase Storage)
- User authentication (Supabase Auth)
- Subscription management
- Webhook handlers (payment events)

**Database Tables:**
- `subscriptions` (user, plan, status, trial_end)
- `vault_documents` (user, file, metadata)
- `payment_methods` (user, stripe_customer_id)

---

## Beat Your Quote Implementation Plan

### User Flow

1. User uploads contractor quote (PDF/photo)
2. System analyzes quote (OCR + red flag detection)
3. User auto-enrolled in free vault tier
4. System sends quote to contractor network
5. Contractors submit competing bids
6. User receives analysis + options
7. User selects contractor (Window Guy or partner)
8. Booking/conversion

### Quote Analysis Features

**Automated Analysis:**
- OCR text extraction
- Price comparison vs. market rates
- Red flag detection algorithm
- Material spec verification
- Contractor license lookup (Florida database)

**Red Flags Detected:**
- "Permit exemption" claims
- Vague material specifications ("standard grade")
- Inflated labor charges (>20% above market)
- Missing warranty terms
- Unlicensed contractors
- Code compliance issues

**Market Rate Database:**
- Price per square foot by region
- Material cost benchmarks
- Labor rate standards
- Seasonal pricing variations

### Contractor Network

**Network Tiers:**
- Tier 1: Premium (5% referral fee, first priority)
- Tier 2: Reliable (6% referral fee, second priority)
- Tier 3: Volume (7-8% referral fee, overflow)

**Requirements:**
- Florida contractor license (verified)
- General liability insurance ($1M+)
- 4.5+ star rating (Google/BBB)
- Manufacturer certifications
- Background check
- W9 on file

**Matching Algorithm:**
- Geographic service area
- Job size/complexity
- Availability/timeline
- Pricing tier
- Specialization match

### Technical Requirements

**Frontend:**
- Quote upload page
- Drag-and-drop file upload
- Progress indicators
- Results/analysis page
- Contractor comparison cards

**Backend:**
- OCR service (Google Vision API or Tesseract)
- PDF parsing library
- Contractor database
- Email notification system
- Red flag detection algorithm
- Market rate pricing database

**Database Tables:**
- `uploaded_quotes` (user, file, extracted_data)
- `quote_analyses` (quote, red_flags, market_comparison)
- `contractors` (profile, tier, service_area)
- `contractor_bids` (quote, contractor, price)

---

## Expert Review Implementation Plan

### Review Types

**Option A: Video Review (Loom)**
- 10-15 minute screen recording
- Annotate quote documents in real-time
- Conversational, educational tone
- Specific line-by-line analysis
- Clear recommendations
- CTA to book call

**Option B: PDF Report**
- Branded template
- 5-7 pages
- Executive summary
- Detailed quote analysis
- Market rate comparison
- Red flag callouts
- Recommended actions

### Review Report Structure

**Executive Summary**
- Overall assessment
- Critical issues count
- Savings opportunity
- Bottom-line recommendation

**Quote #1 Analysis**
- What they got right (✓)
- Red flags identified (🚩)
- Concerns to address (⚠️)
- Financial impact breakdown

**Quote #2 Analysis**
- Same structure as Quote #1

**Market Rate Analysis**
- Fair market range for job
- How quotes compare
- Pricing context

**Recommendations**
- Prioritized action items
- Negotiation strategies
- Questions to ask contractors
- Next steps

**CTA Section**
- Book 15-min call (Calendly link)
- Get third quote option
- Text/call direct line

### Follow-Up Automation

**24 Hours After Report:**
- Email: "Did you get the report?"
- Offer to explain on call
- No-pressure tone

**48 Hours:**
- Phone call (if no response)
- Check understanding
- Answer questions
- Offer Window Guy quote

**72 Hours:**
- Email: "One more thing..."
- Position as third data point
- Win-win framing
- Scarcity (limited slots)
- Book estimate CTA

### Technical Requirements

**Frontend:**
- Review request form
- Calendly integration
- Report viewer/download

**Backend:**
- PDF generation library (jsPDF or similar)
- Email templates
- Loom API integration (optional)
- CRM for tracking reviews
- Automated follow-up sequences

**Database Tables:**
- `expert_reviews` (user, quotes, status, report_url)
- `review_requests` (user, focus_areas, concerns)
- `follow_up_log` (review, action, timestamp)

---

## PDF Lead Magnets Plan

### 1. Red Flag Checklist

**Content (23 pages):**
- 47 contractor red flags
- Permit scams explained
- Material swap tricks
- Labor padding techniques
- Contract terms to avoid
- Verification processes
- Word-for-word scripts

**Landing Page:**
- Headline: "47 Red Flags Contractors Hope You Never See"
- Social proof: Download count
- PDF mockup visual
- Email capture form
- Testimonials
- Cross-links to tools

**Ad Angles:**
- "Contractors hate this checklist"
- "$4,200 in BS - see these 3 lines"
- "Saved me $6,200" testimonial

### 2. Buyer's Blueprint

**Content (25 pages):**
- Pricing guide by home size
- Material quality breakdown
- Code requirements by county
- 20 questions for contractors
- Permit process checklist
- Financing options
- Timeline expectations

**Landing Page:**
- Headline: "Impact Window Buyer's Blueprint"
- Positioning: For overwhelmed beginners
- Step-by-step guide promise

**Ad Angles:**
- "Where do I even start?"
- "Don't make the mistake 83% make"
- "What I wish I knew before"

### 3. Hurricane Calculator

**Content (18 pages):**
- Risk scoring methodology
- Failure probability tables
- Damage cost estimates
- Insurance premium analysis
- NOAA data visualization
- Preparation checklist

**Landing Page:**
- Headline: "What's Your Hurricane Damage Risk?"
- Countdown: "47 days until season"
- Interactive calculator + PDF

**Ad Angles:**
- "Is your home ready?"
- "My windows held, neighbor's exploded"
- Hurricane season urgency

### Technical Requirements

**Frontend:**
- PDF landing pages (3)
- Email capture forms
- Thank you pages
- Cross-linking strategy

**Backend:**
- Email delivery automation
- PDF storage (CDN)
- Download tracking
- Nurture sequences

---

## Marketing Strategy

### Traffic Acquisition

**Facebook Ads:**
- PDF downloads ($5-10 CPL)
- Tool usage ($8-15 CPL)
- Beat Your Quote ($12-20 CPL)
- Retargeting campaigns

**Google Ads:**
- Search: "impact windows [city]"
- Search: "hurricane windows cost"
- Search: "contractor scams florida"
- Display retargeting

**SEO:**
- Blog: Educational content
- Local: City-specific pages
- Tools: Interactive calculators
- Reviews: Schema markup

### Conversion Funnels

**Funnel 1: PDF → Email → Tool → Vault**
1. Facebook ad to PDF page
2. Email capture + PDF delivery
3. Email sequence with tool CTAs
4. Tool completion + vault signup
5. Subscription conversion

**Funnel 2: Tool → Modal → Vault → Review**
1. Organic/ad to tool page
2. Tool completion
3. Modal lead capture
4. Vault trial signup
5. Quote upload
6. Expert review
7. Installation booking

**Funnel 3: Beat Your Quote → Vault → Booking**
1. Ad to Beat Your Quote page
2. Quote upload
3. Auto vault enrollment
4. Expert analysis
5. Contractor options
6. Selection + booking

### Email Automation

**PDF Download Sequence (14 days):**
- Day 0: PDF delivery + welcome
- Day 2: "Found any red flags?" + tool CTA
- Day 5: Vault trial offer
- Day 7: Case study
- Day 14: Hurricane reminder

**Vault Trial Sequence (30 days):**
- Day 0: Welcome + onboarding
- Day 3: Upload reminder
- Day 7: Expert review offer
- Day 12: Trial ending warning
- Day 15: Payment confirmation
- Day 30: Referral ask

**Expert Review Follow-Up:**
- Hour 0: Review delivery
- Hour 24: "Did you see it?"
- Hour 48: Phone call
- Hour 72: Third quote offer

### SMS Campaigns

**Hurricane Alerts:**
- Storm formation
- 5-day forecast
- Preparation reminders
- Post-storm check-in

**Vault Engagement:**
- Annual photo reminders
- Document expiration
- Maintenance tips

**Conversion:**
- Review ready
- Estimate booked
- Appointment reminder

---

## Key Performance Indicators

### Acquisition
- Website visitors: 10K/month (goal)
- Cost per lead: $15-25
- Cost per vault signup: $50-75
- Cost per customer: $200-350

### Engagement
- Tool completion rate: 60%+
- Modal conversion: 15%+
- Vault trial signup: 25%+

### Retention
- Trial → paid: 40%+
- Monthly churn: <5%
- Avg lifetime: 3+ years

### Revenue
- Vault MRR: Target $10K/month
- Installation revenue: $150K/month
- Referral revenue: $30K/month
- **Total: $190K/month**

---

## Implementation Roadmap

### Phase 1: Foundation (Complete ✅)
- [x] 10 diagnostic tools
- [x] Analytics system
- [x] Legal pages
- [x] Navigation improvements

### Phase 2: Vault MVP (Weeks 1-6)
- [ ] Pricing page design
- [ ] Stripe integration
- [ ] Trial system logic
- [ ] Document upload UI
- [ ] Vault dashboard
- [ ] Authentication

### Phase 3: Beat Your Quote (Weeks 7-10)
- [ ] Upload page
- [ ] OCR integration
- [ ] Red flag algorithm
- [ ] Contractor database
- [ ] Matching logic

### Phase 4: Expert Review (Weeks 11-14)
- [ ] Request workflow
- [ ] PDF generator
- [ ] Video integration
- [ ] Follow-up automation

### Phase 5: Marketing (Weeks 15+)
- [ ] 3 PDF lead magnets
- [ ] Landing pages
- [ ] Email sequences
- [ ] Ad campaigns
- [ ] Contractor recruitment

---

## 6-Month Success Metrics

**Users:**
- 10,000 monthly visitors
- 1,000 tool completions
- 500 PDF downloads
- 300 vault trials
- 120 paying subscribers
- 15 installations/month

**Revenue:**
- Vault MRR: $1,800
- Installations: $270K/month
- Referrals: $36K/month
- **Total: $307,800/month**

**Year 1 Projection: $3.7M**

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-03  
**Owner:** Product Team
