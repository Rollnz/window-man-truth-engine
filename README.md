# Window Truth Engine

**Florida's Impact Window Homeowner Advocate Platform**

A comprehensive web application helping Florida homeowners make informed decisions about impact window installations through free tools, educational content, and expert guidance.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Technology Stack

- **Frontend Framework:** React 18.3 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Routing:** React Router v6
- **Backend:** Supabase (PostgreSQL + Auth)
- **Analytics:** Custom event tracking system
- **Deployment:** Lovable Cloud

## 📁 Project Structure

```
window-truth-engine/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── conversion/      # Lead capture modals
│   │   ├── home/            # Homepage components
│   │   ├── navigation/      # Header, Footer, MinimalFooter
│   │   ├── tools/           # Tool-specific components
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   │   ├── usePageTracking.ts
│   │   └── useSessionData.ts
│   ├── lib/                 # Utilities and clients
│   │   ├── windowTruthClient.ts  # Analytics & API client
│   │   └── supabase.ts
│   ├── pages/               # Route components
│   │   ├── Analytics.tsx
│   │   ├── RiskDiagnostic.tsx
│   │   ├── CostCalculator.tsx
│   │   └── ... (20+ tools)
│   ├── App.tsx              # Route configuration
│   └── main.tsx             # Entry point
├── docs/                    # Documentation
│   ├── PRODUCT_SPEC.md      # Business model & features
│   ├── ARCHITECTURE.md      # Technical architecture
│   ├── CONVERSION_FLOW.md   # User journey & funnels
│   └── ANALYTICS.md         # Event tracking schema
├── supabase/
│   └── functions/           # Edge functions
└── public/                  # Static assets
```

## 🛠️ Core Features

### Interactive Tools (10 Total)
1. **Risk Diagnostic** - Multi-category home protection assessment
2. **Cost Calculator** - Financial impact of delaying window replacement
3. **Reality Check** - Window readiness assessment
4. **Vulnerability Test** - Knowledge quiz on window protection
5. **Fast Win Finder** - Quick product recommendation engine
6. **Comparison Tool** - Side-by-side product comparison
7. **Quote Scanner** - Upload and analyze contractor quotes
8. **Evidence Vault** - Secure document storage (requires auth)
9. **Intel Hub** - Educational resources and guides
10. **Claim Survival Kit** - Insurance claim preparation

### Educational Content
- Kitchen Table Defense Guide
- 11 Sales Tactics Guide
- Spec Checklist Guide
- Insurance Savings Guide

### Analytics & Tracking
- Page view tracking (all 28 routes)
- Tool completion events (5 interactive tools)
- Modal abandonment tracking (3 conversion modals)
- Lead capture analytics
- Session tracking via Supabase

## 🗺️ Routing

All routes are defined in `src/App.tsx`:

**Main Tools:**
- `/` - Homepage
- `/tools` - Tools overview
- `/risk-diagnostic` - Risk assessment tool
- `/cost-calculator` - Cost projection tool
- `/reality-check` - Window readiness check
- `/vulnerability-test` - Knowledge quiz
- `/fast-win` - Product recommendations
- `/comparison` - Product comparison
- `/quote-scanner` - Quote analysis
- `/calculate-your-estimate` - Quote builder

**Educational Pages:**
- `/kitchen-table-guide`
- `/sales-tactics-guide`
- `/spec-checklist-guide`
- `/insurance-savings-guide`
- `/claim-survival`

**Auth & Vault:**
- `/auth` - Authentication
- `/vault` - Document vault (protected route)

**Legal Pages:**
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- `/disclaimer` - Legal Disclaimer
- `/accessibility` - Accessibility Statement

**Utility:**
- `/analytics` - Analytics dashboard
- `/expert` - Expert contact
- `/intel` - Intel resources

## 📊 Analytics Events

The app tracks three main event types:

### 1. Page Views
```typescript
{
  event_name: 'page_view',
  tool_name: 'tool-identifier',
  page_path: '/path',
  params: { referrer, search }
}
```

### 2. Tool Completions
```typescript
{
  event_name: 'tool_completed',
  tool_name: 'tool-identifier',
  params: { /* tool-specific data */ }
}
```

### 3. Modal Abandonments
```typescript
{
  event_name: 'modal_abandon',
  tool_name: 'source-tool',
  params: {
    modal_type: 'lead_capture',
    time_spent_seconds: 30
  }
}
```

See `docs/ANALYTICS.md` for complete event schema.

## 🗄️ Database Schema

### Tables
- `wm_sessions` - User session tracking
- `wm_events` - Analytics events
- `wm_leads` - Lead capture data
- `vault_documents` - User uploaded documents (auth required)

See `docs/ARCHITECTURE.md` for complete schema.

## 🎨 Design System

- **Primary Color:** Blue (`--primary`)
- **Typography:** System font stack
- **Components:** shadcn/ui (Radix UI primitives)
- **Responsive:** Mobile-first approach
- **Dark Mode:** Default dark theme

### Component Libraries
- `Button` - Primary CTA component
- `Card` - Content containers
- `Modal/Dialog` - Lead capture modals
- `Form` - Input components
- `Progress` - Tool progress indicators

## 🔐 Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📝 Development Workflow

### Adding a New Tool
1. Create component in `src/pages/ToolName.tsx`
2. Add route in `src/App.tsx`
3. Implement `usePageTracking('tool-name')`
4. Add tool completion event with `logEvent()`
5. Add `MinimalFooter` component
6. Update Analytics dashboard if needed

### Adding Event Tracking
```typescript
import { logEvent } from '@/lib/windowTruthClient';

logEvent({
  event_name: 'custom_event',
  tool_name: 'tool-identifier',
  params: { /* custom data */ }
});
```

## 🚢 Deployment

The app is configured for deployment on Lovable Cloud:

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation

- **Product Spec:** `docs/PRODUCT_SPEC.md` - Business model, features, pricing
- **Architecture:** `docs/ARCHITECTURE.md` - Technical implementation details
- **Conversion Flow:** `docs/CONVERSION_FLOW.md` - User journeys and funnels
- **Analytics:** `docs/ANALYTICS.md` - Complete event tracking schema

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Commit with clear messages: `git commit -m "Add feature: description"`
4. Push to branch: `git push origin feature/your-feature`
5. Create a pull request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For questions or issues, contact the development team.

---

**Built with ❤️ for Florida Homeowners**
