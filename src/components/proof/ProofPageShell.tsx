import { ReactNode } from 'react';

interface ProofPageShellProps {
  children: ReactNode;
}

/**
 * Provide a page-level shell that applies a light, trust-forward background and decorative radial gradient.
 *
 * @param children - The page content to render inside the shell.
 * @returns The rendered page shell containing `children`.
 */
export function ProofPageShell({ children }: ProofPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background pattern for depth without darkness */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}