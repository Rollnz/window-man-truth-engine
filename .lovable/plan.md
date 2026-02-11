

# Fix H1 Capitalization to Match Title Case

## Change

### `src/components/sample-report/HeroSection.tsx` (line 118)

Update the personalized H1 text from sentence case to Title Case to match the fallback:

**Before:**
```
<span className="text-primary">{safeFirstName}</span>, see exactly what your AI audit looks like
```

**After:**
```
<span className="text-primary">{safeFirstName}</span>, See Exactly What Your AI Audit Looks Like
```

Single line change. Nothing else is touched.

