

# Side-by-Side Contract Comparison Visual Refactor

## Overview
Transform the QuoteSafetyChecklist from a simple two-column list into a visual "Bad Contract vs Good Contract" metaphor that instantly communicates the comparison at a glance. The reference image shows two physical documents side-by-side—a crumpled, worn "Bad Contract" with red flags vs. a clean, professional "Good Contract" with checkmarks.

---

## Visual Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SECTION HEADER (Centered)                                   │
│     "Spot the Difference: Bad Quote vs. Good Quote"                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

Desktop Layout (lg:grid-cols-2):
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│  ❌ BAD CONTRACT                │  │  ✓ GOOD CONTRACT                │
│  ┌─────────────────────────────┐│  │┌─────────────────────────────┐  │
│  │ "Document" Container        ││  ││ "Document" Container        │  │
│  │ • Rose/Red border           ││  ││ • Emerald/Green border      │  │
│  │ • Subtle warning bg tint    ││  ││ • Subtle success bg tint    │  │
│  │ • Shadow for depth          ││  ││ • Shadow for depth          │  │
│  │                             ││  ││                             │  │
│  │ ┌──────────────────────┐   ││  ││ ┌──────────────────────┐    │  │
│  │ │ Big X Icon + Title   │   ││  ││ │ Big ✓ Icon + Title   │    │  │
│  │ │ "The Risky Quote"    │   ││  ││ │ "The Safe Quote"     │    │  │
│  │ │ (Red Flags)          │   ││  ││ │ (What to Look For)   │    │  │
│  │ └──────────────────────┘   ││  ││ └──────────────────────┘    │  │
│  │                             ││  ││                             │  │
│  │ [Expand All]               ││  ││ [Expand All]                │  │
│  │                             ││  ││                             │  │
│  │ ⚠ Vague installation...  ▼ ││  ││ 🛡 Impact rating...        ▼│  │
│  │ 📦 No specific models... ▼ ││  ││ 💨 Design pressure...      ▼│  │
│  │ ⏱ Pressure to sign...   ▼ ││  ││ 🏭 Manufacturer...         ▼│  │
│  │ ⚠ Missing permit...     ▼ ││  ││ 🔨 Installation scope...   ▼│  │
│  │ 🧾 Lump sum pricing...  ▼ ││  ││ 📄 Permit fees...          ▼│  │
│  │ 🗑 Hidden fees...       ▼ ││  ││ ✅ Warranty terms...       ▼│  │
│  │ 📊 Missing pressure...  ▼ ││  ││ 📅 Payment schedule...     ▼│  │
│  │ 🛡⚠ Vague warranty...   ▼ ││  ││ ↩ Right to Cancel...      ▼│  │
│  │                             ││  ││                             │  │
│  └─────────────────────────────┘│  │└─────────────────────────────┘  │
│                                 │  │                                 │
│  [Scan Your Quote CTA]          │  │                                 │
└─────────────────────────────────┘  └─────────────────────────────────┘

Mobile Layout (stacked, grid-cols-1):
┌─────────────────────────────────┐
│  ❌ BAD CONTRACT                │
│  [Full document card]           │
│  [Scan Your Quote CTA]          │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  ✓ GOOD CONTRACT                │
│  [Full document card]           │
└─────────────────────────────────┘
```

---

## Key Visual Elements

### 1. Document Container Styling

Each "contract" gets a wrapper that looks like a physical document:

**Bad Contract (Left/Top on mobile):**
```text
- Background: bg-white with subtle rose tint overlay (bg-rose-50/50)
- Border: 2-3px rose-400 border (border-2 border-rose-400)
- Shadow: shadow-lg for document depth
- Corner: rounded-xl for document feel
- Dark mode: bg-zinc-900 with rose-500/10 overlay
```

**Good Contract (Right/Bottom on mobile):**
```text
- Background: bg-white with subtle emerald tint overlay (bg-emerald-50/50)
- Border: 2-3px emerald-400 border (border-2 border-emerald-400)
- Shadow: shadow-lg for document depth
- Corner: rounded-xl for document feel
- Dark mode: bg-zinc-900 with emerald-500/10 overlay
```

### 2. Document Header (New Component)

Each document gets a prominent header with large icon:

**Bad Contract Header:**
```tsx
<div className="flex items-center gap-3 p-4 border-b border-rose-200">
  <XCircle className="w-10 h-10 text-rose-600" />
  <div>
    <h3 className="text-xl font-bold text-rose-700">BAD CONTRACT</h3>
    <p className="text-sm text-rose-600/80">Red Flags to Watch For</p>
  </div>
</div>
```

**Good Contract Header:**
```tsx
<div className="flex items-center gap-3 p-4 border-b border-emerald-200">
  <CheckCircle className="w-10 h-10 text-emerald-600" />
  <div>
    <h3 className="text-xl font-bold text-emerald-700">GOOD CONTRACT</h3>
    <p className="text-sm text-emerald-600/80">What to Look For</p>
  </div>
</div>
```

### 3. Order Change

**Current order:** Good Signs (left) → Red Flags (right)

**New order:** Bad Contract (left) → Good Contract (right)

This matches the reference image and follows the "problem → solution" reading pattern that's more compelling for conversion.

---

## Implementation Details

### Updated Component Structure

```tsx
return (
  <section className="py-12 md:py-16 bg-slate-50 dark:bg-zinc-950/60">
    <div className="container px-4">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
          Spot the Difference
        </h2>
        <p className="text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Know what separates a risky quote from a legitimate one.
        </p>
      </div>

      {/* Two-Column Contract Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
        
        {/* BAD CONTRACT (Left) */}
        <div className={cn(
          "rounded-xl overflow-hidden",
          "bg-white border-2 border-rose-400 shadow-lg",
          "dark:bg-zinc-900 dark:border-rose-500/50"
        )}>
          {/* Document Header */}
          <div className={cn(
            "flex items-center gap-3 p-4 border-b",
            "bg-rose-50 border-rose-200",
            "dark:bg-rose-500/10 dark:border-rose-500/30"
          )}>
            <XCircle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
            <div>
              <h3 className="text-xl font-bold text-rose-700 dark:text-rose-400">
                BAD CONTRACT
              </h3>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/60">
                Red Flags to Watch For
              </p>
            </div>
          </div>
          
          {/* Accordion Items */}
          <div className="p-4 space-y-2">
            {/* Expand All toggle */}
            {/* Map redFlags items */}
          </div>
          
          {/* CTA Button */}
          <div className="p-4 pt-0">
            <Button>Scan Your Quote for Red Flags</Button>
          </div>
        </div>

        {/* GOOD CONTRACT (Right) */}
        <div className={cn(
          "rounded-xl overflow-hidden",
          "bg-white border-2 border-emerald-400 shadow-lg",
          "dark:bg-zinc-900 dark:border-emerald-500/50"
        )}>
          {/* Document Header */}
          <div className={cn(
            "flex items-center gap-3 p-4 border-b",
            "bg-emerald-50 border-emerald-200",
            "dark:bg-emerald-500/10 dark:border-emerald-500/30"
          )}>
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                GOOD CONTRACT
              </h3>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/60">
                What to Look For
              </p>
            </div>
          </div>
          
          {/* Accordion Items */}
          <div className="p-4 space-y-2">
            {/* Expand All toggle */}
            {/* Map checklistItems */}
          </div>
        </div>
        
      </div>
    </div>
  </section>
);
```

---

## Styling Summary

| Element | Bad Contract | Good Contract |
|---------|--------------|---------------|
| **Container border** | `border-2 border-rose-400` | `border-2 border-emerald-400` |
| **Container bg** | `bg-white` / `dark:bg-zinc-900` | `bg-white` / `dark:bg-zinc-900` |
| **Header bg** | `bg-rose-50` / `dark:bg-rose-500/10` | `bg-emerald-50` / `dark:bg-emerald-500/10` |
| **Header icon** | `XCircle` (w-10 h-10, rose-600) | `CheckCircle` (w-10 h-10, emerald-600) |
| **Title text** | `text-rose-700` | `text-emerald-700` |
| **Shadow** | `shadow-lg` | `shadow-lg` |
| **Border radius** | `rounded-xl` | `rounded-xl` |

---

## Preserved Functionality

| Feature | Status |
|---------|--------|
| Interactive accordions | **Kept** - Items still expand/collapse |
| Context-aware icons | **Kept** - Each item has unique icon |
| Expand All toggle | **Kept** - Per-section toggle |
| Analytics tracking | **Kept** - Same `trackEvent` calls |
| First red flag expanded by default | **Kept** - Initial state unchanged |
| Scroll-to-upload CTA | **Kept** - Button functionality preserved |
| Mobile responsive | **Enhanced** - Stack on mobile |

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/quote-scanner/QuoteSafetyChecklist.tsx` | **MODIFY** | Refactor layout to document containers, swap column order (Bad left, Good right), add document headers with large icons, enhance container styling |

---

## Expected Visual Result

**Desktop:**
- Two side-by-side "document" cards with colored borders
- Large icons (❌ / ✓) in headers make the contrast immediately obvious
- Professional shadow creates depth, making them look like physical papers
- Accordions keep the documents from becoming too tall

**Mobile:**
- Cards stack vertically
- Bad Contract appears first (problem → solution flow)
- Full-width containers maintain the document aesthetic

**Psychological Impact:**
- Users instantly recognize "Avoid this" vs "Do this" without reading
- The visual metaphor of two contracts side-by-side triggers comparison thinking
- Red border = danger, Green border = safe (universal color associations)

