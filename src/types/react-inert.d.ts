/**
 * Type augmentation for React inert attribute
 * Enables TypeScript support for HTML inert property
 * Browser support: 95%+ (Chrome 102+, Safari 15.5+, Firefox 112+)
 */
import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    inert?: '' | 'true';
  }
}
