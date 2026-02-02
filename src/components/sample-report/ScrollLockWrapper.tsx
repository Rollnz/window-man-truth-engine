import { RemoveScroll } from 'react-remove-scroll';
import type { ReactNode } from 'react';

interface ScrollLockWrapperProps {
  enabled: boolean;
  children: ReactNode;
}

/**
 * Cross-browser scroll lock implementation
 * 
 * Uses react-remove-scroll which handles iOS Safari edge cases
 * that native overflow: hidden cannot solve.
 * 
 * @see https://github.com/theKashey/react-remove-scroll
 */
export function ScrollLockWrapper({ enabled, children }: ScrollLockWrapperProps) {
  return (
    <RemoveScroll enabled={enabled}>
      {children}
    </RemoveScroll>
  );
}
