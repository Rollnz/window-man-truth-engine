

## Plan: Fix Admin Page Login Flow

### Root Cause
The admin routes (`/admin/*`) have **no auth gate**. When you navigate to `/admin/crm`:

1. `CRMDashboard` mounts and `useCRMLeads()` immediately fires a `fetchEdgeFunction('crm-leads')` call
2. There's no active session yet (or at all), so the edge function returns **401**
3. The `authErrorHandler` tries to refresh a non-existent session, fails, and dispatches `session-expired`
4. You get the "Session Expired" overlay + redirect to `/auth` — but after arriving at `/auth`, there's no recovery because you were never logged in

The `useEffect` inside `CRMDashboard` that checks auth (line 56-60) runs **after** the hook already fired the 401 request. It's a race condition.

### Fix

**1. Wrap all admin routes in `AuthGuard` (`src/App.tsx`)**

The existing `AuthGuard` component already handles redirect-to-login with path preservation. Wrap the `AdminLayout` route:

```tsx
<Route element={<AuthGuard><AdminLayout /></AuthGuard>}>
  <Route path="/admin" element={<AdminHome />} />
  {/* ...all admin routes... */}
</Route>
```

This ensures no admin page renders (and no hooks fire) until auth is confirmed.

**2. Remove redundant auth checks from individual admin pages (`src/pages/admin/CRMDashboard.tsx`)**

Delete the `useEffect` on lines 56-60 that manually redirects to `/auth` — `AuthGuard` handles this now. Keep the `isAdmin` email check for authorization (admin vs non-admin user).

**3. Gate `useCRMLeads` data fetching behind auth readiness (`src/hooks/useCRMLeads.ts` or `CRMDashboard.tsx`)**

Move the initial `fetchLeads()` call (triggered by `quoteTab` effect on line 105-108) so it only runs when `isAuthenticated && isAdmin` is true. This prevents the 401 race.

### Files

| File | Action |
|------|--------|
| `src/App.tsx` | Wrap admin routes in `<AuthGuard>` |
| `src/pages/admin/CRMDashboard.tsx` | Remove manual auth redirect; gate fetch behind `isAdmin` |

Same pattern applies to other admin pages that have their own auth checks — they become redundant once `AuthGuard` wraps the route group.

