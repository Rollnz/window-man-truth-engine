# Technical Architecture

This document describes the technical architecture of the Window Truth Engine platform.

## System Overview

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ HTTPS
       ├──────────────────────────────────────┐
       │                                       │
       ▼                                       ▼
┌──────────────┐                      ┌────────────────┐
│  React App   │                      │   Supabase     │
│  (Vite SPA)  │◄────────────────────►│   Backend      │
└──────────────┘    Supabase Client   └────────────────┘
       │                                       │
       │                               ┌───────┴────────┐
       │                               │                │
       │                               ▼                ▼
       │                        ┌──────────┐    ┌──────────┐
       │                        │PostgreSQL│    │   Auth   │
       │                        │ Database │    │ Service  │
       │                        └──────────┘    └──────────┘
       │
       ▼
┌──────────────┐
│  Local       │
│  Storage     │
└──────────────┘
```

## Frontend Architecture

### Technology Stack

**Core:**
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.3.4

**Routing:**
- React Router DOM 6.26.0

**Styling:**
- Tailwind CSS 3.4.1
- shadcn/ui (Radix UI primitives)
- Lucide React (icons)

**State Management:**
- React hooks (useState, useEffect, useContext)
- No global state library (intentional simplicity)
- Supabase for server state

**Data Fetching:**
- React Query (TanStack Query) 4.36.1
- Supabase client

### Directory Structure

```
src/
├── components/
│   ├── conversion/              # Lead capture components
│   │   ├── LeadCaptureModal.tsx
│   │   ├── ConsultationBookingModal.tsx
│   │   └── IntelLeadModal.tsx
│   ├── home/                    # Homepage sections
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── Footer.tsx
│   ├── navigation/              # Navigation components
│   │   ├── Navbar.tsx
│   │   ├── MinimalFooter.tsx
│   │   └── MobileMenu.tsx
│   ├── tools/                   # Tool-specific components
│   │   ├── ProgressBar.tsx
│   │   ├── QuestionCard.tsx
│   │   └── ResultsCard.tsx
│   ├── auth/                    # Authentication
│   │   └── AuthGuard.tsx
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ... (30+ components)
├── hooks/
│   ├── usePageTracking.ts       # Auto page view tracking
│   ├── useSessionData.ts        # Session management
│   └── useToolProgress.ts       # Tool completion tracking
├── lib/
│   ├── windowTruthClient.ts     # Analytics & API client
│   ├── supabase.ts              # Supabase client config
│   └── utils.ts                 # Utility functions
├── pages/                       # Route components (20+ files)
│   ├── Index.tsx                # Homepage
│   ├── RiskDiagnostic.tsx       # Interactive tools
│   ├── Analytics.tsx            # Analytics dashboard
│   ├── Privacy.tsx              # Legal pages
│   └── ...
├── App.tsx                      # Route configuration
└── main.tsx                     # Entry point
```

### Component Patterns

#### Page Components

All page components follow this pattern:

```typescript
import { usePageTracking } from '@/hooks/usePageTracking';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';

export default function MyPage() {
  // Track page view on mount
  usePageTracking('page-identifier');

  return (
    <div className="min-h-screen bg-background">
      {/* Page content */}

      {/* Footer for navigation */}
      <MinimalFooter />
    </div>
  );
}
```

#### Interactive Tools

Tools use a multi-step pattern with progress tracking:

```typescript
interface Answer {
  // Tool-specific answer shape
}

export default function MyTool() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answer>>({});

  const handleNext = () => {
    if (isFinalStep) {
      // Log completion event
      logEvent({
        event_name: 'tool_completed',
        tool_name: 'my-tool',
        params: { /* results */ }
      });
      setStep(step + 1);
    }
  };

  return (
    <div>
      {step < finalStep && <QuestionView />}
      {step === finalStep && <ResultsView />}
    </div>
  );
}
```

#### Conversion Modals

Modals track open/abandon events:

```typescript
export function MyModal({ isOpen, onClose }) {
  const [modalOpenTime, setModalOpenTime] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setModalOpenTime(Date.now());
      logEvent({ event_name: 'modal_open', ... });
    }
  }, [isOpen]);

  const handleClose = () => {
    const timeSpent = Math.round((Date.now() - modalOpenTime) / 1000);
    logEvent({
      event_name: 'modal_abandon',
      params: { time_spent_seconds: timeSpent }
    });
    onClose();
  };

  return <Dialog open={isOpen} onOpenChange={handleClose}>...</Dialog>;
}
```

### Custom Hooks

#### usePageTracking

Automatically tracks page views on component mount:

```typescript
export function usePageTracking(toolName: string) {
  useEffect(() => {
    const referrer = document.referrer || 'direct';
    const path = window.location.pathname;

    logEvent({
      event_name: 'page_view',
      tool_name: toolName,
      page_path: path,
      params: { referrer, search: window.location.search }
    });
  }, []); // Only fire once
}
```

#### useSessionData

Manages session creation and persistence:

```typescript
export function useSessionData() {
  const [sessionData, setSessionData] = useState(() => {
    return getOrCreateSession();
  });

  useEffect(() => {
    // Update last_activity every 30 seconds
    const interval = setInterval(() => {
      updateSessionActivity(sessionData.session_id);
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionData]);

  return sessionData;
}
```

### Routing Configuration

Routes are defined in `App.tsx`:

```typescript
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Index />} />
    <Route path="/tools" element={<Tools />} />

    {/* Tool routes */}
    <Route path="/reality-check" element={<RealityCheck />} />
    {/* ... 10+ more tools */}

    {/* Protected routes */}
    <Route
      path="/vault"
      element={<AuthGuard><Vault /></AuthGuard>}
    />

    {/* Legal routes */}
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />

    {/* 404 catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

## Backend Architecture (Supabase)

### Database Schema

#### wm_sessions

Stores anonymous user sessions:

```sql
CREATE TABLE wm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  screen_resolution TEXT,
  referrer TEXT,
  landing_page TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_session_id ON wm_sessions(session_id);
CREATE INDEX idx_sessions_created_at ON wm_sessions(created_at DESC);
```

#### wm_events

Stores all analytics events:

```sql
CREATE TABLE wm_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT REFERENCES wm_sessions(session_id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  tool_name TEXT,
  page_path TEXT,
  params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_session_id ON wm_events(session_id);
CREATE INDEX idx_events_event_name ON wm_events(event_name);
CREATE INDEX idx_events_tool_name ON wm_events(tool_name);
CREATE INDEX idx_events_created_at ON wm_events(created_at DESC);
CREATE INDEX idx_events_params ON wm_events USING GIN (params);
```

#### wm_leads

Stores captured lead information:

```sql
CREATE TABLE wm_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT REFERENCES wm_sessions(session_id),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  source_tool TEXT,
  lead_type TEXT, -- 'email_only', 'full_contact', 'booking'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON wm_leads(email);
CREATE INDEX idx_leads_session_id ON wm_leads(session_id);
CREATE INDEX idx_leads_created_at ON wm_leads(created_at DESC);
```

#### vault_documents (Protected)

Stores user-uploaded documents (requires auth):

```sql
CREATE TABLE vault_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT, -- 'quote', 'insurance', 'photo', 'contract'
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vault_user_id ON vault_documents(user_id);
CREATE INDEX idx_vault_created_at ON vault_documents(created_at DESC);

-- Row Level Security
ALTER TABLE vault_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON vault_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON vault_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Authentication

Supabase Auth handles user authentication:

- Magic link email authentication
- Session management
- JWT tokens
- Row Level Security (RLS) policies

**AuthGuard Component:**

```typescript
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useSession();

  if (isLoading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/auth" />;

  return <>{children}</>;
}
```

### Edge Functions

Located in `supabase/functions/`:

#### quote-scanner

Processes uploaded contractor quotes (OCR + analysis):

```typescript
Deno.serve(async (req) => {
  const { file, session_id } = await req.json();

  // Process quote document
  const analysis = await analyzeQuote(file);

  // Store results
  await supabase
    .from('quote_analyses')
    .insert({ session_id, analysis });

  return new Response(JSON.stringify(analysis));
});
```

## Data Flow

### Analytics Event Flow

```
User Action
    ↓
React Component
    ↓
logEvent() call
    ↓
windowTruthClient.ts
    ↓
Supabase Client
    ↓
Supabase API
    ↓
PostgreSQL (wm_events table)
    ↓
Analytics Dashboard Query
    ↓
Display in UI
```

### Lead Capture Flow

```
User fills form
    ↓
Modal component
    ↓
Submit handler
    ↓
Supabase insert (wm_leads)
    ↓
logEvent('lead_captured')
    ↓
Success state / redirect
```

### Page View Flow

```
Component mounts
    ↓
usePageTracking() hook
    ↓
useEffect runs once
    ↓
logEvent('page_view')
    ↓
Session updated (last_activity)
    ↓
Event stored in wm_events
```

## Performance Optimizations

### Code Splitting

- React.lazy() for route-based code splitting
- Dynamic imports for heavy components
- Smaller initial bundle size

### Caching

- React Query caching for API responses
- Browser localStorage for session data
- Service worker for offline support (future)

### Database Indexing

All frequently queried columns have indexes:
- `session_id` - JOIN performance
- `event_name` - Filter performance
- `created_at` - Date range queries
- JSONB GIN index on `params` - JSON queries

### Asset Optimization

- SVG icons from Lucide (tree-shakeable)
- Tailwind CSS purging (production builds)
- Vite asset optimization
- Lazy loading images

## Security

### Frontend

- No API keys in client code
- Environment variables for config
- HTTPS only
- CSP headers

### Backend

- Row Level Security (RLS) on all tables
- JWT authentication
- Supabase Auth for identity
- Rate limiting on edge functions

### Data Privacy

- No PII in analytics events
- Anonymous session IDs
- GDPR/CCPA compliant
- User data deletion on request

## Deployment

### Build Process

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build production bundle
npm run build

# Preview build
npm run preview
```

### Environment Variables

Required for deployment:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Hosting

- **Platform:** Lovable Cloud
- **CDN:** Cloudflare (automatic)
- **SSL:** Automatic HTTPS
- **Deploy:** Git push to main branch

### CI/CD

Automated deployment pipeline:
1. Push to Git
2. Lovable Cloud detects change
3. Build triggered
4. Tests run (future)
5. Deploy to production
6. Invalidate CDN cache

## Monitoring

### Metrics Tracked

- Page load times (Web Vitals)
- API response times
- Error rates
- User sessions
- Conversion rates

### Error Handling

```typescript
// Global error boundary
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>

// API error handling
try {
  await logEvent(event);
} catch (error) {
  console.error('Analytics error:', error);
  // Don't block user experience
}
```

## Future Enhancements

### Planned Features

1. **Vault Subscriptions**
   - Stripe integration
   - Subscription management
   - Tiered pricing ($9-$39/mo)

2. **Beat Your Quote**
   - Quote upload/OCR
   - Contractor matching
   - Automated pricing analysis

3. **Expert Review System**
   - Video review generation
   - PDF report creation
   - Contractor recommendations

4. **Enhanced Analytics**
   - Funnel visualization
   - Cohort analysis
   - A/B testing framework

### Technical Debt

- [ ] Add comprehensive unit tests
- [ ] Implement E2E testing (Playwright)
- [ ] Add Storybook for component docs
- [ ] Optimize bundle size further
- [ ] Add service worker for offline support
- [ ] Implement proper error tracking (Sentry)

---

**Last Updated:** 2025-01-03
