

# Add firstName Personalization to Hero H1

## Changes

### 1. `src/pages/SampleReport.tsx`

Pass `firstNameFromNav` to `HeroSection`:

```tsx
<HeroSection
  firstName={firstNameFromNav}
  onOpenLeadModal={handleOpenLeadModal}
  onOpenPreQuoteModal={handleOpenPreQuoteModal}
/>
```

### 2. `src/components/sample-report/HeroSection.tsx`

- Add `firstName?: string` to `HeroSectionProps` interface
- Destructure it in the component
- Derive `safeFirstName` using `firstName?.trim().slice(0, 24)`
- Update the H1 to prefix the name when available, keeping SEO keywords intact:

```tsx
const safeFirstName = firstName?.trim().slice(0, 24);

<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
  {safeFirstName && safeFirstName.length >= 2 ? (
    <>
      <span className="text-primary">{safeFirstName}</span>, see exactly what your AI audit looks like
    </>
  ) : (
    <>See Exactly What Your AI Audit Looks Like</>
  )}
  <span className="block text-primary">Before You Upload Anything</span>
</h1>
```

## What Is NOT Changing

- SampleReportHeader greeting badge -- stays as-is
- PreQuoteLeadModal -- zero edits
- Tracking, submission, routing -- untouched
- The "Before You Upload Anything" subtitle line -- untouched

