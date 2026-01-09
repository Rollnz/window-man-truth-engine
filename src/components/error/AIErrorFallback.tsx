import React from 'react';
import { Bot, RefreshCw, MessageSquareWarning, Clock, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AIErrorType = 'rate-limit' | 'timeout' | 'network' | 'service' | 'generic';

interface AIErrorFallbackProps {
  /** Type of error that occurred */
  errorType?: AIErrorType;
  /** Custom error message to display */
  message?: string;
  /** Called when user clicks "Try Again" */
  onRetry?: () => void;
  /** Whether a retry action is available */
  canRetry?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to use compact mode for inline displays */
  compact?: boolean;
}

const ERROR_CONFIG: Record<AIErrorType, {
  icon: typeof Bot;
  title: string;
  description: string;
  retryLabel: string;
}> = {
  'rate-limit': {
    icon: Clock,
    title: 'Too Many Requests',
    description: 'Our AI service is experiencing high demand. Please wait a moment before trying again.',
    retryLabel: 'Try Again in 30s',
  },
  'timeout': {
    icon: Clock,
    title: 'Request Timed Out',
    description: 'The AI took too long to respond. This might be due to a complex request or high server load.',
    retryLabel: 'Try Again',
  },
  'network': {
    icon: Wifi,
    title: 'Connection Issue',
    description: 'We couldn\'t connect to our AI service. Please check your internet connection.',
    retryLabel: 'Retry Connection',
  },
  'service': {
    icon: Bot,
    title: 'AI Service Unavailable',
    description: 'Our AI service is temporarily unavailable. Our team has been notified.',
    retryLabel: 'Try Again Later',
  },
  'generic': {
    icon: MessageSquareWarning,
    title: 'Something Went Wrong',
    description: 'We encountered an issue processing your request. Please try again.',
    retryLabel: 'Try Again',
  },
};

/**
 * AIErrorFallback - A styled error state for AI-powered features.
 * 
 * Provides user-friendly error messages and retry options for common
 * AI service failure scenarios (rate limits, timeouts, network issues).
 * 
 * @example
 * {error && (
 *   <AIErrorFallback
 *     errorType={getErrorType(error)}
 *     onRetry={() => refetch()}
 *   />
 * )}
 */
export function AIErrorFallback({
  errorType = 'generic',
  message,
  onRetry,
  canRetry = true,
  className,
  compact = false,
}: AIErrorFallbackProps) {
  const config = ERROR_CONFIG[errorType];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg',
        className
      )}>
        <div className="p-2 rounded-full bg-destructive/10 shrink-0">
          <Icon className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{config.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {message || config.description}
          </p>
        </div>
        {canRetry && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-border',
      className
    )}>
      {/* Icon */}
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <Icon className="h-8 w-8 text-destructive" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
        {config.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {message || config.description}
      </p>

      {/* Retry Button */}
      {canRetry && onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {config.retryLabel}
        </Button>
      )}

      {/* Tips for rate-limit errors */}
      {errorType === 'rate-limit' && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Tip: Sign up to increase your request limit
        </p>
      )}
    </div>
  );
}

/**
 * Helper function to determine error type from an Error object or message
 */
export function getAIErrorType(error: Error | string | null): AIErrorType {
  if (!error) return 'generic';
  
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('429') || lowerMessage.includes('rate limit')) {
    return 'rate-limit';
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'timeout';
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return 'network';
  }
  if (lowerMessage.includes('402') || lowerMessage.includes('unavailable') || lowerMessage.includes('503')) {
    return 'service';
  }

  return 'generic';
}

export default AIErrorFallback;
