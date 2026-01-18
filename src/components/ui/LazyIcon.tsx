/**
 * LazyIcon - Dynamic icon loader for Lucide React
 * Uses dynamic imports to only load icons when needed
 * Reduces initial bundle size by deferring icon loading
 */
import React, { lazy, Suspense, memo } from 'react';
import type { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

// Fallback placeholder while icon loads
const IconFallback = memo(({ size = 24 }: { size?: number }) => (
  <div 
    style={{ width: size, height: size }} 
    className="bg-muted/50 rounded animate-pulse"
  />
));
IconFallback.displayName = 'IconFallback';

// Type for valid icon names
export type IconName = keyof typeof dynamicIconImports;

interface LazyIconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

// Cache for loaded icon components
const iconCache = new Map<IconName, React.LazyExoticComponent<React.ComponentType<LucideProps>>>();

/**
 * Get or create a lazy-loaded icon component
 */
function getLazyIcon(name: IconName) {
  if (!iconCache.has(name)) {
    const iconImport = dynamicIconImports[name];
    if (!iconImport) {
      console.warn(`Icon "${name}" not found in lucide-react`);
      // Return a no-op component
      const NoOpComponent = lazy(() => Promise.resolve({ 
        default: (() => null) as unknown as React.ComponentType<LucideProps> 
      }));
      iconCache.set(name, NoOpComponent);
      return NoOpComponent;
    }
    
    const LazyComponent = lazy(() => 
      iconImport().then((mod) => ({ default: mod.default as React.ComponentType<LucideProps> }))
    );
    iconCache.set(name, LazyComponent);
  }
  return iconCache.get(name)!;
}

/**
 * LazyIcon Component
 * Dynamically loads Lucide icons on demand
 * 
 * @example
 * <LazyIcon name="calculator" size={24} className="text-primary" />
 */
export const LazyIcon = memo(({ name, size = 24, ...props }: LazyIconProps) => {
  const LucideIcon = getLazyIcon(name);
  
  return (
    <Suspense fallback={<IconFallback size={size as number} />}>
      <LucideIcon size={size} {...props} />
    </Suspense>
  );
});

LazyIcon.displayName = 'LazyIcon';

export default LazyIcon;
