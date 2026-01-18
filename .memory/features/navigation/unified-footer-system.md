# Unified Footer System

## Overview
The site implements a centralized footer system managed through `PublicLayout.tsx`, which wraps all public-facing routes. This system replaces all legacy footer implementations (`Footer.tsx`, `MinimalFooter.tsx`, inline footers).

## Components

### 1. `src/components/navigation/UnifiedFooter.tsx`
Full 3-column static footer at page bottom with:
- **Top Section**: Brand info, "Explore Tools" links, "Your Privacy Matters" trust signals
- **Bottom Bar**: Copyright, CTA buttons (Build Quote, Scan Quote), legal links (Home, All Tools, Privacy, Terms)

### 2. `src/components/navigation/MobileStickyFooter.tsx`
Mobile-only sticky CTA bar with:
- Scroll-triggered hide/show animation (hides on scroll down, shows on scroll up)
- Two rows: CTAs (Build Quote, Scan Quote) and navigation links (Home, All Tools)
- Only visible on mobile (`md:hidden`)

### 3. `src/components/layout/PublicLayout.tsx`
Layout wrapper that:
- Renders `<Outlet />` for child routes
- Automatically includes both footer components
- Applies bottom padding on mobile to prevent sticky bar overlap

## Light-Surface Design Rule
Both footers use **explicit light-surface styling** regardless of global theme:
- `bg-white dark:bg-white`
- `text-slate-900` (primary text)
- `text-slate-600` (muted text)
- `border-slate-200` (borders)

This ensures high contrast and professional appearance in both light and dark modes.

## CSS Variable
Defined in `src/index.css`:
```css
--mobile-sticky-footer-h: 104px;
```
Used by `PublicLayout` for mobile bottom padding: `pb-[var(--mobile-sticky-footer-h)]`

## Z-Index Layering
- `MobileStickyFooter`: `z-40`
- Modals/Dialogs: `z-50`

## Routing Integration
In `src/App.tsx`, public routes are wrapped in `<Route element={<PublicLayout />}>`:
```tsx
<Route element={<PublicLayout />}>
  <Route path="/" element={<Index />} />
  {/* ... all public routes */}
</Route>
```

## Excluded Routes
The following routes do NOT use `PublicLayout`:
- `/vault` - Authenticated user dashboard
- `/admin/*` - All admin pages
- `/auth` - Login/signup page

## Analytics Events
Both components fire standardized tracking events:
- `footer_cta_click`: `{ cta: "build_quote"|"scan_quote", surface: "full_footer"|"sticky_footer", page: pathname }`
- `footer_nav_click`: `{ link: string, surface: string, page: pathname }`

## Lazy Loading (Homepage)
`LazyHomepageSections.tsx` exports `LazyUnifiedFooter` for progressive loading on the homepage.

## Deleted Legacy Components
- `src/components/home/Footer.tsx`
- `src/components/navigation/MinimalFooter.tsx`
- `src/components/evidence/StickyCTA.tsx`
