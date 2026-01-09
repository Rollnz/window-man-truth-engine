import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI component. If not provided, uses default fallback. */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Called when user clicks "Try Again" */
  onReset?: () => void;
  /** Custom title for the error state */
  title?: string;
  /** Custom description for the error state */
  description?: string;
  /** Whether to show the "Try Again" button */
  showRetry?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child component tree.
 * 
 * Use this to wrap AI-powered components or any section that might fail,
 * providing a graceful fallback UI instead of crashing the entire page.
 * 
 * @example
 * <ErrorBoundary title="AI Scanner Error" onReset={() => window.location.reload()}>
 *   <QuoteScannerContent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback takes priority
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-muted/30 rounded-lg border border-border">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {this.props.title || 'Something went wrong'}
          </h3>
          
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            {this.props.description || 
              'We encountered an unexpected error. This section may not be working correctly.'}
          </p>

          {this.props.showRetry !== false && (
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-xs text-muted-foreground max-w-md">
              <summary className="cursor-pointer hover:text-foreground">
                Error details
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded text-left overflow-auto max-h-40">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
