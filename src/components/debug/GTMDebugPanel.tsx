/**
 * GTM Debug Panel
 * 
 * Development-only floating panel for debugging GTM tracking events.
 * Shows engagement score accumulator, recent dataLayer events, and consent status.
 * 
 * Features:
 * - Floating toggle button (bottom-right corner)
 * - Persists open/closed state across navigations
 * - Only renders in development mode
 */

import { useState, useEffect, useCallback } from 'react';
import { getEngagementScore, getEngagementState } from '@/services/analytics';
import { hasMarketingConsent } from '@/lib/consent';
import { Bug, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataLayerEvent {
  event?: string;
  value?: number;
  timestamp: number;
  [key: string]: unknown;
}

export function GTMDebugPanel() {
  // Only render in development
  if (!import.meta.env.DEV) return null;
  
  return <GTMDebugPanelInner />;
}

function GTMDebugPanelInner() {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return sessionStorage.getItem('gtm-debug-open') === 'true';
    } catch {
      return false;
    }
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [events, setEvents] = useState<DataLayerEvent[]>([]);
  const [score, setScore] = useState(getEngagementScore());
  const [hasConsent, setHasConsent] = useState(hasMarketingConsent());
  const [engagementState, setEngagementState] = useState(getEngagementState());

  // Listen to dataLayer changes by monkey-patching push
  useEffect(() => {
    // Ensure dataLayer exists
    if (typeof window === 'undefined') return;
    
    window.dataLayer = window.dataLayer || [];
    const originalPush = window.dataLayer.push.bind(window.dataLayer);
    
    window.dataLayer.push = (...args: Record<string, unknown>[]) => {
      const result = originalPush(...args);
      
      // Capture events
      args.forEach(arg => {
        if (arg && typeof arg === 'object') {
          setEvents(prev => [
            ...prev.slice(-50), // Keep last 50 events
            { ...arg, timestamp: Date.now() } as DataLayerEvent
          ]);
        }
      });
      
      // Update state
      setScore(getEngagementScore());
      setHasConsent(hasMarketingConsent());
      setEngagementState(getEngagementState());
      
      return result;
    };
    
    return () => {
      if (window.dataLayer) {
        window.dataLayer.push = originalPush;
      }
    };
  }, []);

  // Persist open state
  useEffect(() => {
    try {
      sessionStorage.setItem('gtm-debug-open', String(isOpen));
    } catch {
      // Ignore storage errors
    }
  }, [isOpen]);

  // Periodic refresh of consent and score
  useEffect(() => {
    const interval = setInterval(() => {
      setScore(getEngagementScore());
      setHasConsent(hasMarketingConsent());
      setEngagementState(getEngagementState());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const getEventColor = (eventName?: string) => {
    if (!eventName) return 'text-gray-400';
    if (eventName.startsWith('cv_')) return 'text-green-400';
    if (eventName.includes('error') || eventName.includes('fallback')) return 'text-red-400';
    if (eventName.includes('lead') || eventName.includes('consultation')) return 'text-amber-400';
    return 'text-blue-400';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 z-[9999] p-2.5 rounded-full shadow-lg transition-all",
          "hover:scale-110 active:scale-95",
          isOpen 
            ? "bg-red-600 text-white" 
            : "bg-gray-800 text-green-400 hover:bg-gray-700"
        )}
        title={isOpen ? "Close GTM Debug Panel" : "Open GTM Debug Panel"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Bug className="h-5 w-5" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-16 right-4 z-[9998] overflow-hidden",
          "rounded-lg bg-gray-900 text-white shadow-xl border border-gray-700",
          "transition-all duration-200",
          isMinimized ? "w-64 max-h-20" : "w-80 max-h-[480px]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-green-400" />
              <span className="font-semibold text-sm">GTM Debug</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Consent indicator */}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                hasConsent 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-amber-500/20 text-amber-400'
              )}>
                {hasConsent ? '✓ Consent' : '○ No PII'}
              </span>
              
              {/* Minimize/Expand */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {isMinimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Score Section */}
              <div className="p-3 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400">Engagement Score</div>
                    <div className="text-2xl font-bold text-green-400">{score}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Session Events</div>
                    <div className="text-lg font-semibold text-blue-400">
                      {engagementState.events?.length || 0}
                    </div>
                  </div>
                </div>
                {/* Threshold indicators */}
                <div className="flex gap-2 mt-2 text-[10px]">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    engagementState.highIntentFired 
                      ? "bg-green-500/30 text-green-400" 
                      : "bg-gray-700 text-gray-500"
                  )}>
                    High Intent {engagementState.highIntentFired ? '✓' : '○'}
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    engagementState.qualifiedFired 
                      ? "bg-green-500/30 text-green-400" 
                      : "bg-gray-700 text-gray-500"
                  )}>
                    Qualified {engagementState.qualifiedFired ? '✓' : '○'}
                  </span>
                </div>
              </div>

              {/* Events Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                <span className="text-xs text-gray-400">Recent DataLayer Events</span>
                <button
                  onClick={clearEvents}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                  title="Clear events"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Events List */}
              <div className="max-h-60 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500 italic">
                    No events captured yet.
                    <br />
                    Interact with the app to see events.
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {events.slice().reverse().map((event, i) => (
                      <div 
                        key={`${event.timestamp}-${i}`} 
                        className="text-xs p-2 rounded bg-gray-800 font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className={getEventColor(event.event)}>
                            {event.event || 'push'}
                          </span>
                          {event.value !== undefined && (
                            <span className={cn(
                              "font-semibold",
                              event.value > 0 ? "text-green-400" : 
                              event.value < 0 ? "text-red-400" : "text-gray-400"
                            )}>
                              {event.value > 0 ? '+' : ''}{event.value}
                            </span>
                          )}
                        </div>
                        {event.tool_id && (
                          <div className="text-gray-500 mt-0.5">
                            tool: {String(event.tool_id)}
                          </div>
                        )}
                        {event.pii_status && (
                          <div className={cn(
                            "mt-0.5",
                            event.pii_status === 'included' ? 'text-green-500' :
                            event.pii_status === 'stripped_no_consent' ? 'text-amber-500' : 'text-gray-500'
                          )}>
                            pii: {String(event.pii_status)}
                          </div>
                        )}
                        {event.fallback && (
                          <div className="text-red-400 mt-0.5">
                            ⚠️ FALLBACK MODE
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
